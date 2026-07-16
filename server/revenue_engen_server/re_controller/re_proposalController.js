// local code re_proposalController


const path = require("path");
const multer = require("multer");
const puppeteer = require("puppeteer");
const ILovePDF = require("@ilovepdf/ilovepdf-nodejs");
const ILovePDFFile = require("@ilovepdf/ilovepdf-nodejs/ILovePDFFile");

// --- Constants & Configuration ---
const TEMP_DIR = path.join(__dirname, "../re_temp");
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const MIN_VALID_PDF_SIZE = 1024; // 1 KB se chota PDF invalid maana jayega
const CONVERSION_RETRY_LIMIT = 2; // Failure par max 2 baar retry
const { db } = require("../../connect");
const {
  ASSETS_DIR,
  addBrandedPage,
  embedImageToPdf,
  loadBrandImages,
  HEADER_HEIGHT,
  FOOTER_HEIGHT,
  CONTENT_TOP_PADDING,
  drawHeader,
  drawFooter,
  drawWatermark,
} = require("./re_pdfHelpers");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const fs = require("fs");
const {
  sendProposalEmail,
  sendProposalAdminNotifyEmail,
} = require("./re_sendEmails");
const {
  sendProposalWhatsApp,
  sendProposalAdminNotifyWA,
} = require("./re_sendWhatsApp");
const { generatePublicAccessToken } = require("./re_publicController");
const notificationService = require("../re_services/notificationService");

// Helper to load assets as base64 for Puppeteer
function getImageDataURI(filename) {
  try {
    const ext = path.extname(filename).substring(1);
    const mime = ext === "png" ? "image/png" : "image/jpeg";
    const buffer = fs.readFileSync(
      path.join(__dirname, "../re_assets", filename),
    );
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch (err) {
    console.warn("[PUPPETEER] Image load error:", filename);
    return "";
  }
}

// Helper to convert plain text to HTML paragraphs and bullets
function textToHtml(text) {
  if (!text) return "";
  if (typeof text !== "string") {
    if (Array.isArray(text)) {
      text = text.join("\n");
    } else {
      text = String(text);
    }
  }
  const lines = text.split("\n");
  let html = "";
  let inList = false;

  lines.forEach((line) => {
    line = line.trim();
    if (!line) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += "<br/>";
      return;
    }

    // Bold parsing basic: **text** -> <strong>text</strong>
    line = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    if (line.startsWith("- ") || line.startsWith("• ")) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      html += `<li>${line.substring(2)}</li>`;
    } else {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<p>${line}</p>`;
    }
  });
  if (inList) html += "</ul>";
  return html;
}

function parseJsonValue(value, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function toJsonString(value, fallback) {
  const normalized = value === null || value === undefined ? fallback : value;
  if (typeof normalized === "string") {
    try {
      JSON.parse(normalized);
      return normalized;
    } catch {
      return JSON.stringify(normalized);
    }
  }
  return JSON.stringify(normalized);
}

function hasRenderableContent(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") {
    return Object.values(value).some((item) => hasRenderableContent(item));
  }
  return String(value || "").trim() !== "";
}

function valueToText(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => valueToText(item))
      .filter(Boolean)
      .join("\n");
  }
  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([key, item]) => {
        if (!hasRenderableContent(item)) return "";
        const label = key
          .replace(/_/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase());
        return `${label}: ${valueToText(item)}`;
      })
      .filter(Boolean)
      .join("\n");
  }
  return String(value || "");
}

function notesToText(notes) {
  return (Array.isArray(notes) ? notes : [])
    .map(
      (note) =>
        note?.note_name || note?.note_text || note?.text || String(note || ""),
    )
    .filter(Boolean)
    .join("\n");
}

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

// ─── PROPOSAL CRUD ───────────────────────────────────────────────────────────

exports.createProposal = async (req, res) => {
  try {
    const {
      client_id,
      proposal_type,
      billing_type,
      billing_start_date,
      billing_end_date,
      sections_json,
      optional_toggles,
      pricing_table_json,
      grand_total_excl_gst,
      terms_notes_json,
      notes_json,
      additional_remarks,
      client_instructions,
      created_by,
      updated_by,
      // Generated once on the frontend (Date.now().toString()), flows to all downstream tables
      txn_id,
    } = req.body;

    if (!client_id || !proposal_type || !billing_type) {
      return res
        .status(400)
        .json({ status: "Failure", message: "Missing required fields" });
    }

    if (!txn_id) {
      return res
        .status(400)
        .json({ status: "Failure", message: "txn_id is required" });
    }

    let final_start_date = billing_start_date;
    let final_end_date = billing_end_date;

    if (billing_type && billing_type.toLowerCase() === "monthly") {
      if (!final_start_date) {
        const d = new Date();
        final_start_date = d.toISOString().split("T")[0];
      }
      if (!final_end_date) {
        const d = new Date(final_start_date);
        d.setMonth(d.getMonth() + 1);
        final_end_date = d.toISOString().split("T")[0];
      }
    } else if (billing_type && billing_type.toLowerCase() === "yearly") {
      if (!final_start_date) {
        const d = new Date();
        final_start_date = d.toISOString().split("T")[0];
      }
      if (!final_end_date) {
        const d = new Date(final_start_date);
        d.setFullYear(d.getFullYear() + 1);
        final_end_date = d.toISOString().split("T")[0];
      }
    }

    // Verify client exists
    const clientCheck = await runQuery(
      "SELECT id FROM re_revenue_engine_client_details WHERE id = ?",
      [client_id],
    );
    if (clientCheck.length === 0) {
      return res.status(400).json({
        status: "Failure",
        message: "Invalid client_id: Client does not exist.",
      });
    }

    const q = `
      INSERT INTO re_proposals 
      (
        client_id, txn_id, proposal_type, billing_type, billing_start_date, billing_end_date,
        sections_json, optional_toggles, pricing_table_json, grand_total_excl_gst,
        terms_notes_json, notes_json, additional_remarks, client_instructions,
        created_by, updated_by, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
    `;

    const result = await runQuery(q, [
      client_id,
      txn_id,
      proposal_type,
      billing_type,
      final_start_date || null,
      final_end_date || null,
      toJsonString(sections_json, {}),
      toJsonString(optional_toggles, {}),
      toJsonString(pricing_table_json, []),
      grand_total_excl_gst || 0,
      toJsonString(terms_notes_json, []),
      toJsonString(notes_json, []),
      additional_remarks || "",
      client_instructions || "",
      created_by || "System",
      updated_by || created_by || "System",
    ]);

    res.status(200).json({
      status: "Success",
      message: "Proposal created",
      proposalId: result.insertId,
    });
  } catch (error) {
    console.error("createProposal error:", error);
    res.status(500).json({ status: "Failure", message: "Server error" });
  }
};

exports.updateProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      client_id,
      proposal_type,
      billing_type,
      billing_start_date,
      billing_end_date,
      sections_json,
      optional_toggles,
      pricing_table_json,
      grand_total_excl_gst,
      terms_notes_json,
      notes_json,
      additional_remarks,
      client_instructions,
      updated_by,
    } = req.body;

    let targetClientId = client_id;
    if (!targetClientId) {
      const existingProp = await runQuery(
        `SELECT client_id FROM re_proposals WHERE id = ?`,
        [id],
      );
      if (existingProp.length === 0) {
        return res
          .status(404)
          .json({ status: "Failure", message: "Proposal not found" });
      }
      targetClientId = existingProp[0].client_id;
    }

    // Verify client exists
    const clientCheck = await runQuery(
      "SELECT id FROM re_revenue_engine_client_details WHERE id = ?",
      [targetClientId],
    );
    if (clientCheck.length === 0) {
      return res.status(400).json({
        status: "Failure",
        message: "Invalid client_id: Client does not exist.",
      });
    }

    let final_start_date = billing_start_date;
    let final_end_date = billing_end_date;

    if (billing_type && billing_type.toLowerCase() === "monthly") {
      if (!final_start_date) {
        const d = new Date();
        final_start_date = d.toISOString().split("T")[0];
      }
      if (!final_end_date) {
        const d = new Date(final_start_date);
        d.setMonth(d.getMonth() + 1);
        final_end_date = d.toISOString().split("T")[0];
      }
    } else if (billing_type && billing_type.toLowerCase() === "yearly") {
      if (!final_start_date) {
        const d = new Date();
        final_start_date = d.toISOString().split("T")[0];
      }
      if (!final_end_date) {
        const d = new Date(final_start_date);
        d.setFullYear(d.getFullYear() + 1);
        final_end_date = d.toISOString().split("T")[0];
      }
    }

    const q = `
      UPDATE re_proposals 
      SET proposal_type = ?, billing_type = ?, billing_start_date = ?, billing_end_date = ?,
          sections_json = ?, optional_toggles = ?, pricing_table_json = ?,
          grand_total_excl_gst = ?, terms_notes_json = ?, notes_json = ?, 
          additional_remarks = ?, client_instructions = ?, updated_by = ?
      WHERE id = ?
    `;

    await runQuery(q, [
      proposal_type,
      billing_type,
      final_start_date || null,
      final_end_date || null,
      toJsonString(sections_json, {}),
      toJsonString(optional_toggles, {}),
      toJsonString(pricing_table_json, []),
      grand_total_excl_gst || 0,
      toJsonString(terms_notes_json, []),
      toJsonString(notes_json, []),
      additional_remarks || "",
      client_instructions || "",
      updated_by || "System",
      id,
    ]);

    // Also update any generated proforma for this proposal so it stays synced with live data
    const existingProformas = await runQuery(
      `SELECT id, is_gst, gst_rate FROM re_proposal_proforma WHERE proposal_id = ?`,
      [id],
    );
    if (existingProformas.length > 0) {
      const base_amt = Number(grand_total_excl_gst || 0);
      for (const prof of existingProformas) {
        const gst_amt =
          prof.is_gst &&
          (Buffer.isBuffer(prof.is_gst)
            ? prof.is_gst[0] === 1
            : Number(prof.is_gst) === 1)
            ? Number((base_amt * prof.gst_rate) / 100).toFixed(2)
            : 0;
        const total_amt = Number(base_amt) + Number(gst_amt);

        await runQuery(
          `
          UPDATE re_proposal_proforma 
          SET base_amount = ?, gst_amount = ?, total_amount = ?, pricing_snapshot = ?
          WHERE id = ?
        `,
          [
            base_amt,
            gst_amt,
            total_amt,
            toJsonString(pricing_table_json, []),
            prof.id,
          ],
        );
      }
    }

    res.status(200).json({ status: "Success", message: "Proposal updated" });
  } catch (error) {
    console.error("updateProposal error:", error);
    res.status(500).json({ status: "Failure", message: "Server error" });
  }
};

exports.getProposalById = async (req, res) => {
  try {
    const { id } = req.params;
    const q = `SELECT p.*, 
                      (SELECT id FROM re_proposal_proforma WHERE proposal_id = p.id ORDER BY id DESC LIMIT 1) AS proforma_id, 
                      (SELECT is_gst FROM re_proposal_proforma WHERE proposal_id = p.id ORDER BY id DESC LIMIT 1) AS proforma_is_gst, 
                      (SELECT SUM(realized_ad_budget) FROM re_proposal_payment_records WHERE proposal_id = p.id AND status = 'approved') AS realized_ad_budget,
                      c.client_name, c.client_organization AS company_name, c.email, c.phone AS phone_no 
               FROM re_proposals p
               LEFT JOIN re_revenue_engine_client_details c ON p.client_id = c.id
               WHERE p.id = ?`;
    const results = await runQuery(q, [id]);

    if (results.length === 0) {
      return res
        .status(404)
        .json({ status: "Failure", message: "Proposal not found" });
    }

    res.status(200).json({ status: "Success", data: results[0] });
  } catch (error) {
    console.error("getProposalById error:", error);
    res.status(500).json({ status: "Failure", message: "Server error" });
  }
};

exports.getProposalsByClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    const q = `SELECT *, 
                      (SELECT id FROM re_proposal_proforma WHERE proposal_id = re_proposals.id ORDER BY id DESC LIMIT 1) AS proforma_id,
                      (SELECT is_gst FROM re_proposal_proforma WHERE proposal_id = re_proposals.id ORDER BY id DESC LIMIT 1) AS proforma_is_gst,
                      (SELECT SUM(realized_ad_budget) FROM re_proposal_payment_records WHERE proposal_id = re_proposals.id AND status = 'approved') AS realized_ad_budget
               FROM re_proposals WHERE client_id = ? ORDER BY created_at DESC`;
    const results = await runQuery(q, [clientId]);

    res.status(200).json({ status: "Success", data: results });
  } catch (error) {
    console.error("getProposalsByClient error:", error);
    res.status(500).json({ status: "Failure", message: "Server error" });
  }
};

exports.getAllProposals = async (req, res) => {
  try {
    const { status } = req.query;
    let q = `SELECT p.*, 
                    (SELECT id FROM re_proposal_proforma WHERE proposal_id = p.id ORDER BY id DESC LIMIT 1) AS proforma_id, 
                    (SELECT is_gst FROM re_proposal_proforma WHERE proposal_id = p.id ORDER BY id DESC LIMIT 1) AS proforma_is_gst, 
                    (SELECT SUM(realized_ad_budget) FROM re_proposal_payment_records WHERE proposal_id = p.id AND status = 'approved') AS realized_ad_budget,
                    c.client_name, c.client_organization AS company_name, c.email, c.phone AS phone_no 
             FROM re_proposals p
             LEFT JOIN re_revenue_engine_client_details c ON p.client_id = c.id`;
    const params = [];
    if (status) {
      q += ` WHERE p.status = ?`;
      params.push(status);
    }
    q += ` ORDER BY p.created_at DESC`;
    const results = await runQuery(q, params);
    res.status(200).json({ status: "Success", data: results });
  } catch (error) {
    console.error("getAllProposals error:", error);
    res.status(500).json({ status: "Failure", message: "Server error" });
  }
};

exports.deleteProposal = async (req, res) => {
  try {
    const { id } = req.params;

    // Block delete if there is an associated proforma
    const proformaCheck = await runQuery(
      "SELECT id FROM re_proposal_proforma WHERE proposal_id = ?",
      [id],
    );
    if (proformaCheck.length > 0) {
      return res.status(400).json({
        status: "Failure",
        message:
          "Please delete the proforma first before deleting the proposal.",
      });
    }

    await runQuery(`DELETE FROM re_proposals WHERE id = ?`, [id]);
    res.status(200).json({ status: "Success", message: "Proposal deleted" });
  } catch (error) {
    console.error("deleteProposal error:", error);
    res.status(500).json({ status: "Failure", message: "Server error" });
  }
};

exports.updateProposalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, updated_by } = req.body;

    await runQuery(
      `UPDATE re_proposals SET status = ?, updated_by = ? WHERE id = ?`,
      [status, updated_by || "System", id],
    );
    res.status(200).json({ status: "Success", message: "Status updated" });
  } catch (error) {
    console.error("updateProposalStatus error:", error);
    res.status(500).json({ status: "Failure", message: "Server error" });
  }
};

exports.sendProposalToClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { channel } = req.body;

    // Fetch proposal and client details
    const q = `SELECT p.*, c.client_name, c.client_organization AS company_name, c.email, c.phone AS phone_no 
               FROM re_proposals p
               LEFT JOIN re_revenue_engine_client_details c ON p.client_id = c.id
               WHERE p.id = ?`;
    const results = await runQuery(q, [id]);
    if (results.length === 0)
      return res
        .status(404)
        .json({ status: "Failure", message: "Proposal not found" });

    const proposal = results[0];
    const clientName = proposal.company_name || proposal.client_name;
    const baseUrl = process.env.CLIENT_BASE_URL || "http://localhost:5173";

    const { generatePublicAccessToken } = require("./re_publicController");
    const snapshotJson = JSON.stringify(proposal);
    const token = await generatePublicAccessToken(
      proposal.client_id,
      proposal.id,
      "proposal",
      snapshotJson,
    );
    const proposalLink = `${baseUrl}/#/public/proposal/${token}`;
    let emailStatus = null;
    let waStatus = null;
    let adminEmailStatus = null;
    let adminWAStatus = null;

    let pdfBuffer = null;
    if (channel === "email" || channel === "both") {
      if (proposal.email) {
        // PDF generation disabled, as client will view link instead
        // pdfBuffer = await createProposalPdfBuffer(id);
        emailStatus = await sendProposalEmail({
          to: proposal.email,
          clientName: clientName,
          proposalId: id,
          proposalLink: proposalLink,
          // pdfBuffer: pdfBuffer
        });
      }
    }

    if (channel === "whatsapp" || channel === "both") {
      if (proposal.phone_no) {
        waStatus = await sendProposalWhatsApp({
          toPhone: proposal.phone_no,
          clientName: clientName,
          clientId: proposal.client_id,
          proposalId: id,
          link: proposalLink,
          lang: "en",
        });
      }
    }

    // Admin Notification
    const sentOn = new Date().toLocaleString();

    if (channel === "email" || channel === "both") {
      adminEmailStatus = await sendProposalAdminNotifyEmail({
        clientName,
        clientId: proposal.client_id,
        proposalId: id,
        sentOn,
        proposalLink,
        // pdfBuffer, // Disabled so admin also gets only link
      });
    }

    if (channel === "whatsapp" || channel === "both") {
      adminWAStatus = await sendProposalAdminNotifyWA({
        clientName,
        clientId: proposal.client_id,
        proposalId: id,
        sentOn,
        proposalLink,
      });
    }

    // Update status to 'sent'
    if (["draft", "changes", "rejected"].includes(proposal.status)) {
      await runQuery(
        "UPDATE re_proposals SET status = ?, updated_by = ? WHERE id = ?",
        ["sent", "System", id],
      );
    }

    res.status(200).json({
      status: "Success",
      message: "Proposal sent successfully",
      emailStatus,
      waStatus,
      adminEmailStatus,
      adminWAStatus,
    });
  } catch (error) {
    console.error("sendProposalToClient error:", error);
    res.status(500).json({
      status: "Failure",
      message: "Server error while sending proposal",
    });
  }
};

// ─── PROFORMA & PAYMENT CRUD ─────────────────────────────────────────────────

exports.createProforma = async (req, res) => {
  try {
    const {
      proposal_id,
      client_id,
      is_gst,
      gst_rate,
      base_amount,
      gst_amount,
      total_amount,
      created_by,
      duration_start_date,
      duration_end_date,
    } = req.body;

    // Fetch parent proposal to snapshot data
    const propQuery = `SELECT * FROM re_proposals WHERE id = ?`;
    const propResults = await runQuery(propQuery, [proposal_id]);
    if (propResults.length === 0) {
      return res
        .status(404)
        .json({ status: "Failure", message: "Proposal not found" });
    }
    const proposal = propResults[0];

    const q = `
      INSERT INTO re_proposal_proforma 
      (proposal_id, client_id, txn_id, is_gst, gst_rate, base_amount, gst_amount, total_amount, 
       pricing_snapshot, notes_snapshot, terms_snapshot, remarks_snapshot, client_instructions_snapshot, created_by,
       duration_start_date, duration_end_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await runQuery(q, [
      proposal_id,
      client_id,
      proposal.txn_id, // Copied from parent proposal
      is_gst ? 1 : 0,
      gst_rate,
      base_amount,
      gst_amount,
      total_amount,
      proposal.pricing_table_json,
      proposal.notes_json,
      proposal.terms_notes_json,
      proposal.additional_remarks,
      proposal.client_instructions,
      created_by || "System",
      duration_start_date || null,
      duration_end_date || null,
    ]);

    // Update proposal status and billing dates
    let updateFields = ["status = 'proforma_generated'"];
    let updateParams = [];
    if (duration_start_date) {
      updateFields.push("billing_start_date = ?");
      updateParams.push(duration_start_date);
    }
    if (duration_end_date) {
      updateFields.push("billing_end_date = ?");
      updateParams.push(duration_end_date);
    }
    updateParams.push(proposal_id);

    await runQuery(
      `UPDATE re_proposals SET ${updateFields.join(", ")} WHERE id = ?`,
      updateParams,
    );

    res.status(200).json({
      status: "Success",
      message: "Proforma created",
      proformaId: result.insertId,
    });
  } catch (error) {
    console.error("createProforma error:", error);
    res.status(500).json({ status: "Failure", message: "Server error" });
  }
};

exports.getProformasByClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    const q = `SELECT * FROM re_proposal_proforma WHERE client_id = ? ORDER BY created_at DESC`;
    const results = await runQuery(q, [clientId]);
    res.status(200).json({ status: "Success", data: results });
  } catch (error) {
    console.error("getProformasByClient error:", error);
    res.status(500).json({ status: "Failure", message: "Server error" });
  }
};

exports.getAllProformas = async (req, res) => {
  try {
    const q = `
      SELECT p.*, c.client_name, c.client_organization
      FROM re_proposal_proforma p
      LEFT JOIN re_revenue_engine_client_details c ON p.client_id = c.id
      ORDER BY p.created_at DESC
    `;
    const results = await runQuery(q, []);
    res.status(200).json({ status: "Success", data: results });
  } catch (error) {
    console.error("getAllProformas error:", error);
    res.status(500).json({ status: "Failure", message: "Server error" });
  }
};

exports.getFinalInvoices = async (req, res) => {
  try {
    const q = `
      SELECT p.*, c.client_name, c.client_organization, c.email, c.phone 
      FROM re_proposal_proforma p
      LEFT JOIN re_revenue_engine_client_details c ON p.client_id = c.id
      WHERE p.status IN ('partially_paid', 'payment_received')
      ORDER BY p.created_at DESC
    `;
    const results = await runQuery(q);
    res.status(200).json({ status: "Success", data: results });
  } catch (error) {
    console.error("getFinalInvoices error:", error);
    res.status(500).json({ status: "Failure", message: "Server error" });
  }
};

exports.getProformasByProposal = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const q = `SELECT * FROM re_proposal_proforma WHERE proposal_id = ? ORDER BY created_at DESC`;
    const results = await runQuery(q, [proposalId]);
    res.status(200).json({ status: "Success", data: results });
  } catch (error) {
    console.error("getProformasByProposal error:", error);
    res.status(500).json({ status: "Failure", message: "Server error" });
  }
};

exports.deleteProforma = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete associated payment records first to avoid orphaned data
    await runQuery(
      `DELETE FROM re_proposal_payment_records WHERE proforma_id = ?`,
      [id],
    );

    const proforma = await runQuery(
      "SELECT proposal_id FROM re_proposal_proforma WHERE id = ?",
      [id],
    );
    if (proforma.length > 0) {
      const proposalId = proforma[0].proposal_id;
      await runQuery(`DELETE FROM re_proposal_proforma WHERE id = ?`, [id]);
      await runQuery(
        `UPDATE re_proposals SET status = 'client_approved' WHERE id = ?`,
        [proposalId],
      );
    } else {
      await runQuery(`DELETE FROM re_proposal_proforma WHERE id = ?`, [id]);
    }

    res.status(200).json({ status: "Success", message: "Proforma deleted" });
  } catch (error) {
    console.error("deleteProforma error:", error);
    res.status(500).json({ status: "Failure", message: "Server error" });
  }
};

const beginTransaction = () =>
  new Promise((res, rej) =>
    db.beginTransaction((err) => (err ? rej(err) : res())),
  );
const commitTransaction = () =>
  new Promise((res, rej) => db.commit((err) => (err ? rej(err) : res())));
const rollbackTransaction = () =>
  new Promise((res) => db.rollback(() => res()));

exports.recordProposalPayment = async (req, res) => {
  try {
    const {
      proforma_id,
      proposal_id,
      client_id,
      amount,
      is_gst,
      tds_applicable,
      tds_percentage,
      tds_amount,
      final_amount,
      payment_date,
      payment_mode,
      transaction_reference,
      remark,
      created_by,
      realized_ad_budget,
      realized_google_budget,
      realized_meta_budget,
    } = req.body;

    const proformaRows = await runQuery(
      `SELECT * FROM re_proposal_proforma WHERE id = ?`,
      [proforma_id],
    );
    if (proformaRows.length === 0)
      return res
        .status(404)
        .json({ status: "Failure", message: "Proforma not found" });
    const proforma = proformaRows[0];

    const proposalRows = await runQuery(
      `SELECT * FROM re_proposals WHERE id = ?`,
      [proposal_id],
    );
    const proposal = proposalRows.length > 0 ? proposalRows[0] : {};

    const clientRows = await runQuery(
      `SELECT * FROM re_revenue_engine_client_details WHERE id = ?`,
      [client_id],
    );
    const client = clientRows.length > 0 ? clientRows[0] : {};

    const createdAt = new Date()
      .toISOString()
      .replace(/T/, " ")
      .replace(/\..+/, "");

    // 3. BEGIN MYSQL TRANSACTION
    await beginTransaction();

    try {
      // Generate a new unique txn_id for this milestone re_invoice snapshot
      const invoice_txn_id = String(Date.now());

      // 3.2 Record payment with 'pending_approval' status
      const paymentQ = `
        INSERT INTO re_proposal_payment_records 
        (proforma_id, proposal_id, client_id, amount, is_gst, tds_applicable, tds_percentage, tds_amount, final_amount, payment_date, payment_mode, transaction_reference, remark, created_by, txn_id, status, realized_ad_budget, realized_google_budget, realized_meta_budget)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_approval', ?, ?, ?)
      `;
      const insertResult = await runQuery(paymentQ, [
        proforma_id,
        proposal_id,
        client_id,
        amount,
        is_gst ? 1 : 0,
        tds_applicable ? 1 : 0,
        tds_percentage || 0,
        tds_amount || 0,
        final_amount,
        payment_date,
        payment_mode,
        transaction_reference,
        remark,
        created_by || "System",
        invoice_txn_id,
        realized_ad_budget || 0,
        realized_google_budget || 0,
        realized_meta_budget || 0,
      ]);

      const timelineRemark = `Payment Recorded (Pending Approval)\nAmount : ₹${amount}\nTime : ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`;
      const timelineQ = `INSERT INTO re_workflow_remarks (txn_id, action_type, actor_name, remark, created_at) VALUES (?, ?, ?, ?, ?)`;
      await runQuery(timelineQ, [
        invoice_txn_id,
        "payment_recorded",
        created_by || "System",
        timelineRemark,
        createdAt,
      ]);

      // COMMIT TRANSACTION
      await commitTransaction();

      // Trigger Notification to Admin ONLY
      let deliveryStatus = { adminWhatsapp: "N/A", adminEmail: "N/A" };
      try {
        const pastPayments = await runQuery(
          `SELECT SUM(amount) as total_past FROM re_proposal_payment_records WHERE proforma_id = ? AND status = 'approved'`,
          [proforma_id],
        );
        const totalPastPayments = Number(pastPayments[0].total_past || 0);
        const invoiceTotal = Number(proforma.total_amount || 0);
        const previousBalance = Math.max(invoiceTotal - totalPastPayments, 0);
        const pendingOutstanding = Math.max(
          previousBalance - Number(amount || 0),
          0,
        );

        const payload = {
          clientName: client.client_name || "N/A",
          orgName: client.client_organization || "N/A",
          clientId: client_id,
          invoiceNo: invoice_txn_id,
          invoiceDate: new Date().toLocaleDateString("en-IN"),
          paymentDate: payment_date || new Date().toLocaleDateString("en-IN"),
          amountReceived: amount || 0,
          paymentMode: payment_mode || "N/A",
          invoiceTotal: invoiceTotal,
          previousBalance: previousBalance,
          tdsApplicable: tds_applicable ? "Yes" : "No",
          tdsDeducted: tds_amount || 0,
          netCredited: final_amount || 0,
          totalReceivedTillDate: totalPastPayments + Number(amount || 0),
          pendingOutstanding: pendingOutstanding,
        };
        const notifyRes = await notificationService.dispatch({
          event: "PAYMENT_ALERT",
          payload,
        });
        if (!notifyRes.error) deliveryStatus = notifyRes;
      } catch (err) {
        console.error("Auto notification error:", err);
      }

      res.status(200).json({
        status: "Success",
        txn_id: invoice_txn_id,
        message: "Payment recorded successfully and sent for approval.",
        adminAlertSent: deliveryStatus,
      });
    } catch (txErr) {
      await rollbackTransaction();
      console.error("Transaction Error in recordProposalPayment:", txErr);
      res.status(500).json({
        status: "Failure",
        message: "Error processing payment transaction",
      });
    }
  } catch (error) {
    console.error("recordProposalPayment error:", error);
    res.status(500).json({ status: "Failure", message: "Server error" });
  }
};

exports.markPaymentReceived = async (req, res) => {
  try {
    const { id } = req.params; // proposal_id
    const { updated_by } = req.body;

    await runQuery(
      `UPDATE re_proposals SET status = 'payment_received', updated_by = ? WHERE id = ?`,
      [updated_by || "System", id],
    );
    await runQuery(
      `UPDATE re_proposal_proforma SET status = 'payment_received' WHERE proposal_id = ? AND status IN ('generated', 'sent', 'payment_awaited')`,
      [id],
    );

    res
      .status(200)
      .json({ status: "Success", message: "Marked as payment received" });
  } catch (error) {
    console.error("markPaymentReceived error:", error);
    res.status(500).json({ status: "Failure", message: "Server error" });
  }
};

exports.getProposalPaymentSummary = async (req, res) => {
  try {
    const { id } = req.params; // proposal_id

    // Get proposal total
    const propResults = await runQuery(
      `SELECT grand_total_excl_gst FROM re_proposals WHERE id = ?`,
      [id],
    );
    if (propResults.length === 0) {
      return res
        .status(404)
        .json({ status: "Failure", message: "Proposal not found" });
    }

    // We would ideally fetch the proforma total, but let's stick to base amount for now or fetch proforma if exists
    const profResults = await runQuery(
      `SELECT total_amount FROM re_proposal_proforma WHERE proposal_id = ? ORDER BY id DESC LIMIT 1`,
      [id],
    );
    const proposalTotal =
      profResults.length > 0
        ? Number(profResults[0].total_amount)
        : Number(propResults[0].grand_total_excl_gst);

    const payments = await runQuery(
      `SELECT * FROM re_proposal_payment_records WHERE proposal_id = ? ORDER BY payment_date DESC, id DESC`,
      [id],
    );
    const totalReceived = payments.reduce(
      (sum, p) => sum + Number(p.final_amount),
      0,
    );
    const outstanding_balance = Math.max(proposalTotal - totalReceived, 0);

    res.status(200).json({
      status: "Success",
      data: {
        proposal_total: proposalTotal,
        total_received: totalReceived,
        outstanding_balance: outstanding_balance,
        payments: payments,
      },
    });
  } catch (error) {
    console.error("getProposalPaymentSummary error:", error);
    res.status(500).json({ status: "Failure", message: "Server error" });
  }
};

exports.getPaymentRecordsByClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    const q = `SELECT * FROM re_proposal_payment_records WHERE client_id = ? ORDER BY created_at DESC`;
    const results = await runQuery(q, [clientId]);
    res.status(200).json({ status: "Success", data: results });
  } catch (error) {
    console.error("getPaymentRecordsByClient error:", error);
    res.status(500).json({ status: "Failure", message: "Server error" });
  }
};

exports.getAllPaymentRecords = async (req, res) => {
  try {
    const q = `
      SELECT p.*, c.client_name, c.client_organization
      FROM re_proposal_payment_records p
      LEFT JOIN re_revenue_engine_client_details c ON p.client_id = c.id
      ORDER BY p.created_at DESC
    `;
    const results = await runQuery(q, []);
    res.status(200).json({ status: "Success", data: results });
  } catch (error) {
    console.error("getAllPaymentRecords error:", error);
    res.status(500).json({ status: "Failure", message: "Server error" });
  }
};

exports.approvePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approved_by, remark } = req.body;

    if (status !== "approved") {
      await runQuery(
        `UPDATE re_proposal_payment_records SET status = ?, approved_by = ?, remark = ? WHERE id = ?`,
        [status, approved_by || "System", remark, id],
      );
      return res
        .status(200)
        .json({ status: "Success", message: "Payment status updated" });
    }

    // Process Approval
    const paymentRows = await runQuery(
      `SELECT * FROM re_proposal_payment_records WHERE id = ?`,
      [id],
    );
    if (paymentRows.length === 0)
      return res
        .status(404)
        .json({ status: "Failure", message: "Payment not found" });
    const payment = paymentRows[0];

    if (payment.status === "approved") {
      return res
        .status(400)
        .json({ status: "Failure", message: "Payment already approved" });
    }

    const proformaRows = await runQuery(
      `SELECT * FROM re_proposal_proforma WHERE id = ?`,
      [payment.proforma_id],
    );
    if (proformaRows.length === 0)
      return res
        .status(404)
        .json({ status: "Failure", message: "Proforma not found" });
    const proforma = proformaRows[0];

    const proposalRows = await runQuery(
      `SELECT * FROM re_proposals WHERE id = ?`,
      [payment.proposal_id],
    );
    const proposal = proposalRows.length > 0 ? proposalRows[0] : {};

    const clientRows = await runQuery(
      `SELECT * FROM re_revenue_engine_client_details WHERE id = ?`,
      [payment.client_id],
    );
    const client = clientRows.length > 0 ? clientRows[0] : {};

    const createdAt = new Date()
      .toISOString()
      .replace(/T/, " ")
      .replace(/\..+/, "");
    const invoice_txn_id = payment.txn_id || String(Date.now());
    const client_id = payment.client_id;
    const received_amt = Number(payment.amount || 0);
    const tds_amt = Number(payment.tds_amount || 0);

    await beginTransaction();
    try {
      // 1. Update Payment Record to Approved
      await runQuery(
        `UPDATE re_proposal_payment_records SET status = 'approved', approved_by = ?, remark = ? WHERE id = ?`,
        [approved_by || "System", remark, id],
      );

      // 2. Calculate Math
      const pastPayments = await runQuery(
        `SELECT SUM(amount) as total_past FROM re_proposal_payment_records WHERE proforma_id = ? AND status = 'approved' AND id != ?`,
        [payment.proforma_id, id],
      );
      const totalPastPayments = Number(pastPayments[0].total_past || 0);
      const previous_amt =
        totalPastPayments === 0
          ? 0
          : Math.max(Number(proforma.total_amount) - totalPastPayments, 0);
      const current_amt =
        totalPastPayments === 0
          ? Math.max(Number(proforma.total_amount) - received_amt, 0)
          : Math.max(previous_amt - received_amt, 0);

      const PAYMENT_TOLERANCE = 0.05;
      const isFullyPaid = current_amt <= PAYMENT_TOLERANCE;
      const newStatus = isFullyPaid ? "paid" : "partially_paid";

      // 3. Generate Bill Number
      const bill_type =
        proforma.is_gst &&
        (Buffer.isBuffer(proforma.is_gst)
          ? proforma.is_gst[0] === 1
          : Number(proforma.is_gst) === 1)
          ? "GST"
          : "NON_GST";
      const lastBillRows = await runQuery(
        `SELECT bill_number FROM re_invoice WHERE bill_type = ? ORDER BY id DESC LIMIT 1`,
        [bill_type],
      );
      let newBillNumber = "01";
      if (lastBillRows.length > 0 && lastBillRows[0].bill_number) {
        const lastNumber = parseInt(
          lastBillRows[0].bill_number.split("-").pop(),
          10,
        );
        newBillNumber = String(lastNumber + 1).padStart(2, "0");
      }

      // 4. INSERT INTO re_invoice
      const insertInvoiceQ = `
        INSERT INTO re_invoice (
          bill_type, bill_number, txn_id, client_id, client_name, client_organization,
          email, phone, address, dg_employee, duration_start_date, duration_end_date,
          payment_mode, payment_date, payment_reference, client_gst_no, client_pan_no,
          tag_received_amt, received_amt, current_amt, previous_amt, tds_amount,
          created_at, invoice_source, proforma_id, base_amount, gst_rate, gst_amount, realized_ad_budget, realized_google_budget, realized_meta_budget
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await runQuery(insertInvoiceQ, [
        bill_type,
        newBillNumber,
        invoice_txn_id,
        client_id,
        client.client_name || "",
        client.client_organization || "",
        client.email || "",
        client.phone || "",
        client.address || "",
        proposal.created_by || "",
        proposal.billing_start_date || "",
        proposal.billing_end_date || "",
        payment.payment_mode || "UPI",
        payment.payment_date || null,
        payment.transaction_reference || null,
        "",
        "",
        "pending",
        received_amt,
        current_amt,
        previous_amt,
        tds_amt,
        createdAt,
        "proposal",
        proforma.id,
        proforma.base_amount || 0,
        proforma.gst_rate || 0,
        proforma.gst_amount || 0,
        payment.realized_ad_budget || 0,
        payment.realized_google_budget || 0,
        payment.realized_meta_budget || 0,
      ]);

      // 5. PARSE pricing_snapshot JSON and copy to graphic/ads/comp
      const items = JSON.parse(proforma.pricing_snapshot || "[]");
      for (const item of items) {
        if (!item) continue;
        const isComplimentary =
          item.source === "custom_complimentary" ||
          (item.service_name &&
            item.service_name.toLowerCase() === "re_complimentary") ||
          item.include_in_total === false;

        if (isComplimentary) {
          const compQ = `
            INSERT INTO re_complimentary_invoice (
              client_id, txn_id, service_name, category_name, editing_type_id, editing_type_name, editing_type_amount,
              quantity, include_content_posting, include_thumbnail_creation, total_amount, employee, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          await runQuery(compQ, [
            client_id,
            invoice_txn_id,
            item.service_name || "re_complimentary",
            item.category_name || "",
            null,
            item.editing_type_name || "",
            item.unit_price || 0,
            item.quantity || 1,
            "0",
            "0",
            item.total_price || 0,
            proposal.created_by || "",
            createdAt,
          ]);
        } else if (
          item.source === "custom_ads" ||
          item.service_type === "Ads Campaign" ||
          item.service_name === "Ads Campaign"
        ) {
          const uniqueId =
            Date.now() + "-" + Math.random().toString(36).substr(2, 6);
          const adQ = `
            INSERT INTO re_ads_campaign_details_invoice (
              txn_id, client_id, unique_id, category, amount, percent, charge, total, employee, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          await runQuery(adQ, [
            invoice_txn_id,
            client_id,
            uniqueId,
            item.category_name || "",
            item.budget || item.unit_price || 0,
            item.percent || 0,
            item.charge || 0,
            item.total_price || 0,
            proposal.created_by || "",
            createdAt,
          ]);
        } else {
          const igQ = `
            INSERT INTO re_invoice_graphic (
              txn_id, client_id, service_name, category_name, editing_type_id, editing_type_name, editing_type_amount,
              quantity, include_content_posting, include_thumbnail_creation, include_youtube_video_posting, total_amount, plan_name, employee, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          await runQuery(igQ, [
            invoice_txn_id,
            client_id,
            item.service_name || "",
            item.category_name || "",
            null,
            item.editing_type_name || "",
            item.unit_price || 0,
            item.quantity || 1,
            "0",
            "0",
            0,
            item.total_price || 0,
            "",
            proposal.created_by || "",
            createdAt,
          ]);
        }
      }

      // 6. Notes & re_discount
      const notes = JSON.parse(proforma.notes_snapshot || "[]");
      for (const note of notes) {
        if (!note) continue;
        const noteName =
          note.note_name || note.note_text || note.text || String(note);
        if (!noteName) continue;
        await runQuery(
          `INSERT INTO re_invoice_client_notes (client_id, txn_id, note_name, created_at) VALUES (?, ?, ?, ?)`,
          [client_id, invoice_txn_id, noteName, createdAt],
        );
      }

      const sections = JSON.parse(proposal.sections_json || "{}");
      const pricingDiscount = sections.pricing_discount || {};
      const discountVal = Number(pricingDiscount.value) || 0;
      if (discountVal > 0) {
        const isPercent = pricingDiscount.type === "Percentage";
        await runQuery(
          `INSERT INTO re_discount (txn_id, client_id, discount_type, discount_per, discount_amt, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            invoice_txn_id,
            client_id,
            pricingDiscount.type || "Amount",
            isPercent ? discountVal : 0,
            isPercent ? 0 : discountVal,
            createdAt,
          ],
        );
      }

      // 8. UPDATE statuses
      await runQuery(
        `UPDATE re_proposal_proforma SET status = ? WHERE id = ?`,
        [newStatus, payment.proforma_id],
      );
      if (isFullyPaid) {
        await runQuery(
          `UPDATE re_proposals SET status = 'invoiced' WHERE id = ?`,
          [payment.proposal_id],
        );
      }

      // Timeline Remark
      const timelineRemark = `Payment Approved\nAmount : ₹${received_amt}\nOutstanding : ₹${current_amt}\nInvoice Number : ${newBillNumber}`;
      await runQuery(
        `INSERT INTO re_workflow_remarks (txn_id, action_type, actor_name, remark, created_at) VALUES (?, ?, ?, ?, ?)`,
        [
          invoice_txn_id,
          "payment_approved",
          approved_by || "System",
          timelineRemark,
          createdAt,
        ],
      );

      await commitTransaction();

      // Notifications
      let deliveryStatus = {
        clientEmail: "N/A",
        clientWhatsapp: "N/A",
        adminEmail: "N/A",
        adminWhatsapp: "N/A",
      };
      try {
        const token = await generatePublicAccessToken(
          client_id,
          invoice_txn_id,
          "final",
        );
        const invoiceLink = `${process.env.CLIENT_BASE_URL || ""}/#/public/re_invoice/${token}`;
        const payload = {
          clientEmail: client.email || "",
          clientPhone: client.phone || "",
          clientName: client.client_name || "",
          txnId: invoice_txn_id,
          invoiceLink,
          adminAmount: received_amt,
          adminTimeStr: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
          }),
        };
        const notifyRes = await notificationService.dispatch({
          event: "FINAL_INVOICE",
          payload,
        });
        if (!notifyRes.error) deliveryStatus = notifyRes;
      } catch (err) {
        console.error("Auto notification error:", err);
      }

      res.status(200).json({
        status: "Success",
        message: "Payment approved and re_invoice generated",
        invoiceSent: deliveryStatus,
      });
    } catch (txErr) {
      await rollbackTransaction();
      console.error("Approve Payment Transaction Error:", txErr);
      res
        .status(500)
        .json({ status: "Failure", message: "Error approving payment" });
    }
  } catch (error) {
    console.error("approvePayment error:", error);
    res.status(500).json({ status: "Failure", message: "Server error" });
  }
};

// ─── GENERATE FINAL re_invoice FROM PROFORMA ─────────────────────────────────────
exports.generateInvoiceFromProforma = async (req, res) => {
  try {
    const { proforma_id } = req.params;

    // 1. Verify proforma exists and has a payment
    const proformaRows = await runQuery(
      `SELECT * FROM re_proposal_proforma WHERE id = ?`,
      [proforma_id],
    );
    if (proformaRows.length === 0) {
      return res
        .status(404)
        .json({ status: "Failure", message: "Proforma not found" });
    }
    const proforma = proformaRows[0];

    const allowedStatuses = ["partially_paid", "payment_received"];
    if (!allowedStatuses.includes(proforma.status)) {
      return res.status(400).json({
        status: "Failure",
        message: `Proforma status is '${proforma.status}'. Payment must be recorded first.`,
      });
    }

    // 2. Verify at least one payment record exists for this proforma
    const paymentRows = await runQuery(
      `SELECT * FROM re_proposal_payment_records WHERE proforma_id = ? ORDER BY created_at DESC`,
      [proforma_id],
    );
    if (paymentRows.length === 0) {
      return res.status(400).json({
        status: "Failure",
        message: "No payment records found for this proforma",
      });
    }
    const latestPayment = paymentRows[0];

    // 3. Check if re_invoice already generated for this proforma
    const existingInvoice = await runQuery(
      `SELECT id, bill_number FROM re_invoice WHERE proforma_id = ?`,
      [proforma_id],
    );
    if (existingInvoice.length > 0) {
      return res.status(409).json({
        status: "Failure",
        message: "re_invoice already generated for this proforma",
        invoice_id: existingInvoice[0].id,
        bill_number: existingInvoice[0].bill_number,
      });
    }

    // 4. Fetch proposal + client details
    let proposal = {};
    if (proforma.source_type !== "manual") {
      const proposalRows = await runQuery(
        `SELECT * FROM re_proposals WHERE id = ?`,
        [proforma.proposal_id],
      );
      if (proposalRows.length === 0) {
        return res
          .status(404)
          .json({ status: "Failure", message: "Parent proposal not found" });
      }
      proposal = proposalRows[0];
    }

    const clientRows = await runQuery(
      `SELECT * FROM re_revenue_engine_client_details WHERE id = ?`,
      [proforma.client_id],
    );
    const client = clientRows[0] || {};

    // 5. Determine bill_type
    const bill_type =
      proforma.is_gst &&
      (Buffer.isBuffer(proforma.is_gst)
        ? proforma.is_gst[0] === 1
        : Number(proforma.is_gst) === 1)
        ? "GST"
        : "NON_GST";

    // 6. Get next bill_number (same pattern as old system)
    const lastBillRows = await runQuery(
      `SELECT bill_number FROM re_invoice WHERE bill_type = ? ORDER BY id DESC LIMIT 1`,
      [bill_type],
    );
    let newBillNumber = "01";
    if (lastBillRows.length > 0 && lastBillRows[0].bill_number) {
      const lastNum = parseInt(
        lastBillRows[0].bill_number.split("-").pop(),
        10,
      );
      newBillNumber = String(lastNum + 1).padStart(2, "0");
    }

    // 7. Generate txn_id (timestamp-based, same pattern as existing)
    const txn_id = String(Date.now());

    // 8. Calculate received amount from payment records
    const received_amt = paymentRows.reduce(
      (sum, p) => sum + Number(p.final_amount || p.amount),
      0,
    );

    // 9. INSERT into re_invoice table
    const insertQ = `
      INSERT INTO re_invoice (
        invoice_source, proposal_id, proforma_id,
        bill_type, bill_number,
        base_amount, gst_rate, gst_amount,
        txn_id, client_id, client_name, client_organization,
        email, phone, address, dg_employee,
        duration_start_date, duration_end_date,
        payment_mode, payment_date, payment_reference,
        current_amt, received_amt,
        pricing_snapshot, notes_snapshot, terms_snapshot,
        created_at
      ) VALUES (
        ?, ?, ?,
        ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?,
        ?, ?,
        ?, ?, ?,
        NOW()
      )
    `;

    const invoiceSource =
      proforma.source_type === "manual" ? "manual" : "proposal"; // Not inserted directly but conceptually useful

    // Convert dates
    const safeDate = (d) => {
      try {
        return new Date(d).toISOString().slice(0, 10);
      } catch (e) {
        return new Date().toISOString().slice(0, 10);
      }
    };

    // Fetch dates directly from proforma since they are now always stored there
    const startDateFallback = proforma.duration_start_date
      ? safeDate(proforma.duration_start_date)
      : null;
    const endDateFallback = proforma.duration_end_date
      ? safeDate(proforma.duration_end_date)
      : null;

    const dgEmployeeFallback =
      proforma.source_type === "manual"
        ? req.user?.name || "System"
        : proposal.created_by || null;

    const insertValues = [
      invoiceSource,
      proforma.proposal_id || null,
      proforma.id,
      bill_type,
      newBillNumber,
      proforma.base_amount || null,
      proforma.gst_rate || null,
      proforma.gst_amount || null,
      txn_id,
      proforma.client_id,
      client.client_name || null,
      client.client_organization || null,
      client.email || null,
      client.phone || null,
      client.address || null,
      dgEmployeeFallback,
      startDateFallback,
      endDateFallback,
      latestPayment.payment_mode || null,
      latestPayment.payment_date || null,
      latestPayment.transaction_reference || null,
      proforma.total_amount || null,
      received_amt,
      proforma.pricing_snapshot || null,
      proforma.notes_snapshot || null,
      proforma.terms_snapshot || null,
    ];

    const result = await runQuery(insertQ, insertValues);
    const new_invoice_id = result.insertId;

    // 10. Update re_proposals.status = 'invoiced'
    if (proforma.proposal_id) {
      await runQuery(
        `UPDATE re_proposals SET status = 'invoiced' WHERE id = ?`,
        [proforma.proposal_id],
      );
    }

    return res.status(200).json({
      status: "Success",
      message: "re_invoice generated successfully",
      invoice_id: new_invoice_id,
      bill_number: newBillNumber,
      txn_id,
    });
  } catch (error) {
    console.error("generateInvoiceFromProforma error:", error);
    return res.status(500).json({ status: "Failure", message: "Server error" });
  }
};

// ─── GET PROPOSAL-SOURCED INVOICES ────────────────────────────────────────────
exports.getProposalInvoices = async (req, res) => {
  try {
    const q = `
      SELECT i.*, p.id AS p_id, pf.id AS pf_id
      FROM re_invoice i
      LEFT JOIN re_proposals p ON i.proposal_id = p.id
      LEFT JOIN re_proposal_proforma pf ON i.proforma_id = pf.id
      WHERE i.invoice_source = 'proposal'
      ORDER BY i.created_at DESC
    `;
    const results = await runQuery(q);
    res.status(200).json({ status: "Success", data: results });
  } catch (error) {
    console.error("getProposalInvoices error:", error);
    res.status(500).json({ status: "Failure", message: "Server error" });
  }
};

async function createProposalPdfBuffer(id, snapshotData = null) {
  try {
    let proposal;

    if (snapshotData && snapshotData.client_name) {
      proposal = snapshotData;
    } else {
      // Fetch proposal data
      const q = `SELECT p.*, c.client_name, c.client_organization AS company_name, c.email, c.phone AS phone_no, c.address 
                 FROM re_proposals p
                 LEFT JOIN re_revenue_engine_client_details c ON p.client_id = c.id
                 WHERE p.id = ?`;
      const results = await runQuery(q, [id]);
      if (results.length === 0) throw new Error("Proposal not found");
      proposal = results[0];
    }
    const sections = parseJsonValue(proposal.sections_json, {}) || {};
    const toggles = parseJsonValue(proposal.optional_toggles, {}) || {};
    let pricing = parseJsonValue(proposal.pricing_table_json, []) || [];
    const savedTerms = parseJsonValue(proposal.terms_notes_json, []) || [];
    const savedNotes = parseJsonValue(proposal.notes_json, []) || [];

    // Process pricing to split Ads Campaign and Service Charge for PDF display (matches UI logic)
    const finalPricing = [];
    pricing.forEach((item) => {
      const isAds =
        item.source === "custom_ads" ||
        item.service_type === "Ads Campaign" ||
        item.service_name === "Ads Campaign" ||
        item.source_type === "ads_campaign";

      if (isAds) {
        const explicitBudget =
          item.budget !== undefined
            ? item.budget
            : item.ad_budget !== undefined
              ? item.ad_budget
              : item.amount !== undefined
                ? item.amount
                : null;
        const charge = Number(item.charge || item.ad_charge || 0);
        let budget = 0;
        if (explicitBudget !== null) {
          budget = Number(explicitBudget);
        } else {
          const fallback = Number(item.unit_price || item.total_price || 0);
          // If fallback is greater than or equal to charge, assume it includes the charge
          budget = fallback > charge ? fallback - charge : fallback;
        }

        const percent =
          item.percent !== undefined && item.percent !== null
            ? item.percent
            : item.ad_percent || "N/A";
        const category =
          item.category_name ||
          item.service_name ||
          item.service ||
          "Ads Campaign";

        // 1. Ads Budget row
        finalPricing.push({
          ...item,
          service: `Ads Campaign - ${category}`,
          service_name: "Ads Campaign",
          category_name: category,
          quantity: "-",
          total_price: budget,
        });

        // 2. Service Charge row
        if (charge > 0) {
          finalPricing.push({
            ...item,
            service: `Service Charge - ${category}`,
            service_name: "Service Charge",
            category_name: category,
            quantity: 1,
            total_price: charge,
          });
        }
      } else {
        finalPricing.push(item);
      }
    });
    pricing = finalPricing;
    const documentTitle = `${(proposal.client_name || "Client").toUpperCase()} Proposal`;

    let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${documentTitle}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; font-size: 14px; line-height: 1.5; }
        h1 { color: #004d80; margin-bottom: 5px; }
        h2 { color: #004d80; border-bottom: 2px solid #004d80; padding-bottom: 5px; margin-top: 35px; margin-bottom: 15px; }
        p { margin-bottom: 12px; text-align: justify; }
        ul { margin-bottom: 12px; padding-left: 20px; }
        li { margin-bottom: 6px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px; }
        th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
        th { background-color: #f5f5f5; color: #004d80; font-weight: bold; }
        .total-row { background-color: #e0f0ff; font-weight: bold; }
        .signature-box { margin-top: 50px; display: flex; justify-content: space-between; page-break-inside: avoid; }
        .sign-line { border-top: 1px solid #000; width: 250px; padding-top: 5px; margin-top: 60px; text-align: left; font-weight: bold;}
      </style>
    </head>
    <body>
    `;

    // Title / Cover Page Info
    const cover =
      typeof sections.cover_page === "object" ? sections.cover_page : {};
    const clientName = proposal.client_name || "";
    const organization = proposal.company_name || "";
    const propType =
      proposal.proposal_type === "digital_marketing"
        ? "Digital Marketing Proposal For"
        : "Development Proposal For";
    const duration = cover.duration || "1 Month";
    const propDate =
      cover.proposal_date ||
      new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    const validity = cover.proposal_validity || "7 Days";
    const prepBy = cover.prepared_by || "DOAGuru InfoSystems";
    const web = cover.website || "www.doaguru.com";

    htmlContent += `
      <div style="margin-bottom: 40px; margin-top: 20px;">
        <h1 style="text-align: center; color: #004d80; margin-bottom: 30px; font-size: 24px;">
          ${propType} ${organization ? organization.toUpperCase() : clientName.toUpperCase()}
        </h1>
        <table style="width: 70%; margin: 0 auto; border: none;">
          <tr><td style="border: none; padding: 6px; font-weight: bold; font-size: 16px; width: 40%;">Client Name:</td><td style="border: none; padding: 6px; font-size: 16px;">${clientName}</td></tr>
          <tr><td style="border: none; padding: 6px; font-weight: bold; font-size: 16px;">Organization:</td><td style="border: none; padding: 6px; font-size: 16px;">${organization}</td></tr>
          <tr><td style="border: none; padding: 6px; font-weight: bold; font-size: 16px;">Duration:</td><td style="border: none; padding: 6px; font-size: 16px;">${duration}</td></tr>
          <tr><td style="border: none; padding: 6px; font-weight: bold; font-size: 16px;">Proposal Date:</td><td style="border: none; padding: 6px; font-size: 16px;">${propDate}</td></tr>
          <tr><td style="border: none; padding: 6px; font-weight: bold; font-size: 16px;">Proposal Validity:</td><td style="border: none; padding: 6px; font-size: 16px;">${validity}</td></tr>
          <tr><td style="border: none; padding: 6px; font-weight: bold; font-size: 16px;">Prepared By:</td><td style="border: none; padding: 6px; font-size: 16px;">${prepBy}</td></tr>
          <tr><td style="border: none; padding: 6px; font-weight: bold; font-size: 16px;">Website:</td><td style="border: none; padding: 6px; font-size: 16px;">${web}</td></tr>
        </table>
      </div>
    `;

    const isSectionIncluded = (key) => {
      const optionalKeys = [
        "client_problem",
        "strategy_overview",
        "timeline",
        "expected_results",
        "additional_remarks",
        "client_instructions",
        "why_choose_us",
      ];
      if (optionalKeys.includes(key)) {
        return toggles[key] === true || toggles[key] === "true";
      }
      return true;
    };

    // 2. Executive Summary
    if (
      isSectionIncluded("executive_summary") &&
      hasRenderableContent(sections.executive_summary)
    ) {
      htmlContent += `<h2>EXECUTIVE SUMMARY</h2>`;
      htmlContent += textToHtml(valueToText(sections.executive_summary));
    }

    // 3. About Us / Company Introduction
    if (
      isSectionIncluded("about_us") &&
      hasRenderableContent(sections.about_us)
    ) {
      htmlContent += `<h2>ABOUT US</h2>`;
      htmlContent += textToHtml(valueToText(sections.about_us));
    }

    // 4. Understanding Client's Problem
    if (
      isSectionIncluded("client_problem") &&
      hasRenderableContent(sections.client_problem)
    ) {
      htmlContent += `<h2>UNDERSTANDING CLIENT'S PROBLEM</h2>`;
      htmlContent += textToHtml(valueToText(sections.client_problem));
    }

    // 5. Proposed Solution
    if (
      isSectionIncluded("proposed_solution") &&
      hasRenderableContent(sections.proposed_solution)
    ) {
      htmlContent += `<h2>PROPOSED SOLUTION</h2>`;
      htmlContent += textToHtml(valueToText(sections.proposed_solution));
    }

    // 6. Scope of Work (Deliverables Table)
    if (isSectionIncluded("scope_of_work")) {
      htmlContent += `<h2>SCOPE OF WORK</h2>`;
      if (pricing && pricing.length > 0) {
        htmlContent += `<table>
          <thead>
            <tr>
              <th>Service Category</th>
              <th>Service Name</th>
              <th style="width: 20%; text-align: center;">Quantity</th>
            </tr>
          </thead>
          <tbody>`;
        pricing.forEach((item) => {
          htmlContent += `<tr>
            <td>${item.category_name || "-"}</td>
            <td>
              ${item.service_name || item.service || "-"}
            </td>
            <td style="text-align: center;">${item.quantity || "-"}</td>
          </tr>`;
        });
        htmlContent += `</tbody></table>`;
      } else {
        htmlContent += `<p style="color: #888; font-style: italic;">No deliverables added yet.</p>`;
      }
    }

    // 7. Strategy Overview
    if (
      isSectionIncluded("strategy_overview") &&
      hasRenderableContent(sections.strategy_overview)
    ) {
      htmlContent += `<h2>STRATEGY OVERVIEW</h2>`;
      htmlContent += textToHtml(valueToText(sections.strategy_overview));
    }

    // 8. Timeline & Milestones
    if (
      isSectionIncluded("timeline") &&
      Array.isArray(sections.timeline) &&
      sections.timeline.length > 0
    ) {
      htmlContent += `<h2>TIMELINE & MILESTONES</h2>`;
      htmlContent += `<table>
        <thead>
          <tr>
            <th style="width: 30%;">Milestone Title</th>
            <th style="width: 25%;">Duration</th>
            <th>Deliverables / Details</th>
          </tr>
        </thead>
        <tbody>`;
      sections.timeline.forEach((m) => {
        htmlContent += `<tr>
          <td><strong>${m.title || ""}</strong></td>
          <td>${m.duration || ""}</td>
          <td>${m.deliverables || ""}</td>
        </tr>`;
      });
      htmlContent += `</tbody></table>`;
    }

    // 9. Expected Results
    if (
      isSectionIncluded("expected_results") &&
      hasRenderableContent(sections.expected_results)
    ) {
      htmlContent += `<h2>EXPECTED RESULTS</h2>`;
      htmlContent += textToHtml(valueToText(sections.expected_results));
    }

    // 10. Pricing & Investment
    if (
      isSectionIncluded("pricing_investment") &&
      pricing &&
      pricing.length > 0
    ) {
      htmlContent += `<h2>PRICING & INVESTMENT</h2>`;
      htmlContent += `<table>
        <thead>
          <tr>
            <th>Service / Item</th>
            <th style="width: 15%; text-align: center;">Quantity</th>
            <th style="width: 25%; text-align: right;">Total Price (₹)</th>
          </tr>
        </thead>
        <tbody>`;
      pricing.forEach((item) => {
        htmlContent += `<tr>
          <td>${item.service || ""}</td>
          <td style="text-align: center;">${item.quantity || 1}</td>
          <td style="text-align: right;">₹ ${Number(item.total_price || 0).toLocaleString("en-IN")}</td>
        </tr>`;
      });

      const pricingDiscount = sections.pricing_discount || {};
      const discountVal = Number(pricingDiscount.value) || 0;
      const discountType = pricingDiscount.type || "Amount";

      const dmSubtotal = pricing.reduce(
        (sum, item) =>
          sum +
          (item.service_name === "Ads Campaign" ||
          item.service_name?.toLowerCase() === "re_complimentary"
            ? 0
            : Number(item.total_price) || 0),
        0,
      );
      const adsSubtotal = pricing.reduce(
        (sum, item) =>
          sum +
          (item.service_name === "Ads Campaign"
            ? Number(item.total_price) || 0
            : 0),
        0,
      );
      const discountAmt =
        discountType === "Percentage"
          ? (dmSubtotal * discountVal) / 100
          : discountVal;

      htmlContent += `<tr>
        <td colspan="2" style="text-align: right; font-weight: bold;">Subtotal (Excl. GST)</td>
        <td style="text-align: right; font-weight: bold;">₹ ${dmSubtotal.toLocaleString("en-IN")}</td>
      </tr>`;

      if (discountVal > 0) {
        htmlContent += `<tr>
          <td colspan="2" style="text-align: right; font-weight: bold; color: #cc0000;">re_discount (${discountType === "Percentage" ? `${discountVal}%` : "₹"})</td>
          <td style="text-align: right; font-weight: bold; color: #cc0000;">- ₹ ${discountAmt.toLocaleString("en-IN")}</td>
        </tr>`;
      }

      if (adsSubtotal > 0) {
        htmlContent += `<tr>
          <td colspan="2" style="text-align: right; font-weight: bold;">Ads Budget Total</td>
          <td style="text-align: right; font-weight: bold;">₹ ${adsSubtotal.toLocaleString("en-IN")}</td>
        </tr>`;
      }

      const finalGrandTotalForPdf =
        Math.max(0, dmSubtotal - discountAmt) + adsSubtotal;
      htmlContent += `<tr class="total-row">
          <td colspan="2" style="text-align: right;">Grand Total (Excl. GST)</td>
          <td style="text-align: right;">₹ ${finalGrandTotalForPdf.toLocaleString("en-IN")}</td>
        </tr>
        </tbody></table>`;
    }

    // 11. Notes
    if (isSectionIncluded("combined_notes_tc")) {
      const rawNotes = sections.notes_selection || savedNotes;
      const notesList = (Array.isArray(rawNotes) ? rawNotes : [])
        .map(
          (note) =>
            note?.note_name ||
            note?.note_text ||
            note?.text ||
            String(note || ""),
        )
        .filter(Boolean);

      if (notesList.length > 0) {
        htmlContent += `<h2>NOTES</h2>`;
        htmlContent += `<ul style="list-style-type: none; padding-left: 0;">`;
        notesList.forEach((item) => {
          let text = String(item).trim();
          if (text.startsWith("- ") || text.startsWith("• ")) {
            text = text.substring(2).trim();
          }
          if (text !== "") {
            htmlContent += `<li style="margin-bottom: 8px; padding-left: 20px; position: relative;">
              <span style="position: absolute; left: 0; top: 0;">•</span>
              ${text}
            </li>`;
          }
        });
        htmlContent += `</ul>`;
      }
    }

    // 12. Terms & Conditions
    if (isSectionIncluded("combined_notes_tc")) {
      const rawTerms = hasRenderableContent(sections.terms_conditions)
        ? sections.terms_conditions
        : savedTerms;
      const termsList = Array.isArray(rawTerms)
        ? rawTerms
        : hasRenderableContent(rawTerms)
          ? [valueToText(rawTerms)]
          : [];

      if (termsList.length > 0) {
        htmlContent += `<h2>TERMS & CONDITIONS</h2>`;
        htmlContent += `<ul style="list-style-type: none; padding-left: 0;">`;
        termsList.forEach((item) => {
          let text = String(item).trim();
          if (text.startsWith("- ") || text.startsWith("• ")) {
            text = text.substring(2).trim();
          }
          if (text !== "") {
            htmlContent += `<li style="margin-bottom: 8px; padding-left: 20px; position: relative;">
              <span style="position: absolute; left: 0; top: 0;">•</span>
              ${text}
            </li>`;
          }
        });
        htmlContent += `</ul>`;
      }
    }

    // 13. Additional Remarks
    const additionalRemarks =
      sections.additional_remarks || proposal.additional_remarks;
    if (
      isSectionIncluded("additional_remarks") &&
      hasRenderableContent(additionalRemarks)
    ) {
      htmlContent += `<h2>ADDITIONAL REMARKS</h2>`;
      htmlContent += textToHtml(valueToText(additionalRemarks));
    }

    // 14. Client Instructions
    const clientInstructions =
      sections.client_instructions || proposal.client_instructions;
    if (
      isSectionIncluded("client_instructions") &&
      hasRenderableContent(clientInstructions)
    ) {
      htmlContent += `<h2>CLIENT INSTRUCTIONS</h2>`;
      htmlContent += textToHtml(valueToText(clientInstructions));
    }

    // 15. Why Choose Us
    if (
      isSectionIncluded("why_choose_us") &&
      hasRenderableContent(sections.why_choose_us)
    ) {
      htmlContent += `<h2>WHY CHOOSE US</h2>`;
      htmlContent += textToHtml(valueToText(sections.why_choose_us));
    }

    // Approval Block
    const approval = sections.approval_acceptance || {};
    htmlContent += `
      <h2>APPROVAL & ACCEPTANCE</h2>
      <p>By signing below, you agree to the terms and scope of work outlined in this proposal.</p>
    `;

    htmlContent += `
      <div class="signature-box">
        <div>
          <div class="sign-line">Authorized Client Signature</div>
          <p>Name: ${approval.client_signatory_name || "______________________"}</p>
          <p>Designation: ${approval.client_signatory_designation || "______________________"}</p>
          <p>Date: ______________________</p>
        </div>
        <div>
          <div class="sign-line">DOAGuru InfoSystems</div>
          <p>Name: ${approval.our_signatory_name || "______________________"}</p>
          <p>Designation: ${approval.our_signatory_designation || "______________________"}</p>
          <p>Date: ______________________</p>
        </div>
      </div>
    `;

    htmlContent += `</body></html>`;

    const headerImageURI = getImageDataURI("Header.png");
    const footerImageURI = getImageDataURI("DG_Footer.jpg");

    // Inject print CSS and repeating header/footer wrappers into the existing HTML
    const printReadyHtml = htmlContent
      .replace(
        "</head>",
        `
      <style>
        @media print {
          @page { margin: 0; }
          body { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
            margin: 0;
            padding: 0;
          }
          .page-content { padding: 0 40px; }
          .print-header-space { height: 130px; }
          .print-footer-space { height: 100px; }
          .print-header { position: fixed; top: 0; left: 0; right: 0; width: 100%; height: 130px; z-index: 1000; text-align: center; background: white; display: flex; pointer-events: none; }
          .print-footer { position: fixed; bottom: 0; left: 0; right: 0; width: 100%; height: 100px; z-index: 1000; text-align: center; background: white; display: flex; pointer-events: none; }
          /* Ensure table rows do not break */
          tr { page-break-inside: avoid; }
        }
        @media screen {
          body { background: #525659; margin: 0; padding: 20px; display: flex; justify-content: center; }
          .document-wrapper { background: white; width: 210mm; min-height: 297mm; box-shadow: 0 0 10px rgba(0,0,0,0.5); position: relative; }
          .page-content { padding: 0 40px; }
          .print-header-space { height: 130px; }
          .print-footer-space { height: 100px; }
          .print-header { position: absolute; top: 0; left: 0; right: 0; width: 100%; height: 130px; z-index: 1000; text-align: center; display: flex; pointer-events: none; }
          .print-footer { position: absolute; bottom: 0; left: 0; right: 0; width: 100%; height: 100px; z-index: 1000; text-align: center; display: flex; pointer-events: none; }
        }
      </style>
    </head>`,
      )
      .replace(
        "<body>",
        `<body>
      <div class="document-wrapper">
        <div class="print-header">
          <img src="${headerImageURI}" style="width: 100%; height: 100%; object-fit: fill;" />
        </div>
        <div class="print-footer">
          <img src="${footerImageURI}" style="width: 100%; height: 100%; object-fit: fill;" />
        </div>
        
        <table style="width: 100%; border: none; margin: 0; padding: 0;">
          <thead>
            <tr>
              <td style="border: none; padding: 0;">
                <div class="print-header-space"></div>
              </td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: none; padding: 0;">
                <div class="page-content">
    `,
      )
      .replace(
        "</body>",
        `
                </div>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td style="border: none; padding: 0;">
                <div class="print-footer-space"></div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </body>`,
      );

    return printReadyHtml;
  } catch (error) {
    console.error("createProposalPdfBuffer error:", error);
    throw error;
  }
}

exports.createProposalPdfBuffer = createProposalPdfBuffer;

exports.generateProposalPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const htmlString = await createProposalPdfBuffer(id);

    // Instead of returning a PDF buffer, we return the print-ready HTML
    res.status(200).json({ status: "Success", html: htmlString });
  } catch (error) {
    console.error("generateProposalPdf error:", error);
    res.status(500).json({
      status: "Failure",
      message: "Server error generating HTML for PDF",
    });
  }
};

exports.getRevenueHistory = async (req, res) => {
  try {
    const invoices = await runQuery(
      "SELECT txn_id, proforma_id, bill_number, client_name, received_amt, current_amt, base_amount, gst_amount, tds_amount, created_at, bill_type FROM re_invoice ORDER BY created_at DESC",
      [],
    );
    let totalReceived = 0;
    let totalPending = 0;
    let totalTds = 0;
    const seenProformas = new Set();

    invoices.forEach((inv) => {
      totalReceived += Number(inv.received_amt || 0);
      totalTds += Number(inv.tds_amount || 0);

      const pid = inv.proforma_id || inv.client_name;
      if (!seenProformas.has(pid)) {
        seenProformas.add(pid);
        totalPending += Number(inv.current_amt || 0);
      }
    });
    const totalInvoiced = totalReceived + totalPending;
    res.status(200).json({
      status: "Success",
      totals: { totalInvoiced, totalReceived, totalPending, totalTds },
      invoices,
    });
  } catch (error) {
    console.error("getRevenueHistory error:", error);
    res.status(500).json({ status: "Failure", message: "Server error" });
  }
};
