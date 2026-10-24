// re_quotationController.js
// Quotation Flow — CRUD, Status, Numbering, Calculator/Ads/Notes saves
// Follows same patterns as re_proposalController.js

const { db } = require("../../connect");

// ─── Shared runQuery ─────────────────────────────────────────────────────────
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

// ─── Concurrency-safe QTN number generator (mirrors getNextProformaNumber) ───
let qtnCounterLock = Promise.resolve();

const getNextQuotationNumber = async () => {
  const counterType = "QTN";
  const prefix = "QTN-";

  const nextVal = await (qtnCounterLock = qtnCounterLock.catch(() => {}).then(async () => {
    const rows = await runQuery(
      `SELECT current_number FROM re_proforma_counters WHERE counter_type = ?`,
      [counterType]
    );
    const num = (rows && rows.length > 0 ? Number(rows[0].current_number) : 0) + 1;
    await runQuery(
      `INSERT INTO re_proforma_counters (counter_type, current_number) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE current_number = ?`,
      [counterType, num, num]
    );
    return num;
  }));

  return `${prefix}${nextVal}`;
};

// ─── 1. createQuotation ───────────────────────────────────────────────────────
// POST /auth/api/re_calculator/quotation
exports.createQuotation = async (req, res) => {
  try {
    const { client_id, created_by } = req.body;

    if (!client_id) {
      return res.status(400).json({ status: "Failure", message: "client_id is required" });
    }

    const quotationNumber = await getNextQuotationNumber();
    const txnId = String(Date.now());

    const result = await runQuery(
      `INSERT INTO re_quotation (client_id, quotation_number, txn_id, status, created_by)
       VALUES (?, ?, ?, 'draft', ?)`,
      [client_id, quotationNumber, txnId, created_by || "System"]
    );

    res.status(200).json({
      status: "Success",
      message: "Quotation created",
      quotationId: result.insertId,
      quotationNumber,
    });
  } catch (error) {
    console.error("createQuotation error:", error);
    res.status(500).json({ status: "Failure", message: "Server error" });
  }
};

// ─── 2. getQuotationById ──────────────────────────────────────────────────────
// GET /auth/api/re_calculator/quotation/:id
exports.getQuotationById = async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await runQuery(
      `SELECT q.*,
              c.client_name, c.client_organization, c.email, c.phone, c.address
       FROM re_quotation q
       LEFT JOIN re_revenue_engine_client_details c ON q.client_id = c.id
       WHERE q.id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ status: "Failure", message: "Quotation not found" });
    }
    const quotation = rows[0];
    const services = await runQuery(
      `SELECT * FROM re_quotation_services WHERE quotation_id = ? ORDER BY id ASC`,
      [id]
    );
    const ads = await runQuery(
      `SELECT * FROM re_quotation_ads WHERE quotation_id = ? ORDER BY id ASC`,
      [id]
    );
    res.status(200).json({ status: "Success", data: { ...quotation, services, ads } });
  } catch (error) {
    console.error("getQuotationById error:", error);
    res.status(500).json({ status: "Failure", message: "Server error" });
  }
};

// ─── 3. getQuotationsByClient ─────────────────────────────────────────────────
// GET /auth/api/re_calculator/quotations/client/:clientId
exports.getQuotationsByClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    // Check if a proforma was generated from this quotation
    const rows = await runQuery(
      `SELECT q.*,
              (SELECT id FROM re_proposal_proforma WHERE quotation_id = q.id ORDER BY id DESC LIMIT 1) AS proforma_id,
              (SELECT is_gst FROM re_proposal_proforma WHERE quotation_id = q.id ORDER BY id DESC LIMIT 1) AS proforma_is_gst
       FROM re_quotation q
       WHERE q.client_id = ?
       ORDER BY q.created_at DESC`,
      [clientId]
    );
    res.status(200).json({ status: "Success", data: rows });
  } catch (error) {
    console.error("getQuotationsByClient error:", error);
    res.status(500).json({ status: "Failure", message: "Server error" });
  }
};

// ─── 4. getAllQuotations ──────────────────────────────────────────────────────
// GET /auth/api/re_calculator/quotations
exports.getAllQuotations = async (req, res) => {
  try {
    const { status } = req.query;
    let q = `SELECT q.*,
                     c.client_name, c.client_organization, c.email, c.phone,
                     (SELECT id FROM re_proposal_proforma WHERE quotation_id = q.id ORDER BY id DESC LIMIT 1) AS proforma_id,
                     (SELECT is_gst FROM re_proposal_proforma WHERE quotation_id = q.id ORDER BY id DESC LIMIT 1) AS proforma_is_gst
              FROM re_quotation q
              LEFT JOIN re_revenue_engine_client_details c ON q.client_id = c.id`;
    const params = [];
    if (status) {
      q += ` WHERE q.status = ?`;
      params.push(status);
    }
    q += ` ORDER BY q.created_at DESC`;
    const rows = await runQuery(q, params);
    res.status(200).json({ status: "Success", data: rows });
  } catch (error) {
    console.error("getAllQuotations error:", error);
    res.status(500).json({ status: "Failure", message: "Server error" });
  }
};

// ─── 5. updateQuotationStatus ────────────────────────────────────────────────
// PUT /auth/api/re_calculator/quotation/:id/status
exports.updateQuotationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, updated_by } = req.body;
    if (!status) {
      return res.status(400).json({ status: "Failure", message: "status is required" });
    }
    await runQuery(
      `UPDATE re_quotation SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, id]
    );
    res.status(200).json({ status: "Success", message: `Quotation status updated to ${status}` });
  } catch (error) {
    console.error("updateQuotationStatus error:", error);
    res.status(500).json({ status: "Failure", message: "Server error" });
  }
};

// ─── 6. deleteQuotation ───────────────────────────────────────────────────────
// DELETE /auth/api/re_calculator/quotation/:id
exports.deleteQuotation = async (req, res) => {
  try {
    const { id } = req.params;

    // Block delete if proforma already generated
    const proformaCheck = await runQuery(
      `SELECT id FROM re_proposal_proforma WHERE quotation_id = ?`,
      [id]
    );
    if (proformaCheck.length > 0) {
      return res.status(400).json({
        status: "Failure",
        message: "Please delete the proforma first before deleting the quotation.",
      });
    }

    // FK CASCADE will handle re_quotation_services and re_quotation_ads
    await runQuery(`DELETE FROM re_quotation WHERE id = ?`, [id]);
    res.status(200).json({ status: "Success", message: "Quotation deleted" });
  } catch (error) {
    console.error("deleteQuotation error:", error);
    res.status(500).json({ status: "Failure", message: "Server error" });
  }
};

// ─── 7. saveQuotationServices ────────────────────────────────────────────────
// POST /auth/api/re_calculator/quotation/:id/services
// Replaces all existing services for this quotation
exports.saveQuotationServices = async (req, res) => {
  try {
    const { id } = req.params;
    const { services, grand_total_excl_gst } = req.body;

    if (!Array.isArray(services)) {
      return res.status(400).json({ status: "Failure", message: "services must be an array" });
    }

    // Verify quotation exists
    const qtnRows = await runQuery(`SELECT id FROM re_quotation WHERE id = ?`, [id]);
    if (qtnRows.length === 0) {
      return res.status(404).json({ status: "Failure", message: "Quotation not found" });
    }

    // Clear existing services for this quotation
    await runQuery(`DELETE FROM re_quotation_services WHERE quotation_id = ?`, [id]);

    // Insert new rows
    if (services.length > 0) {
      const values = services.map(s => [
        id,
        s.service_name || s.service || null,
        s.category_name || null,
        s.editing_type_name || null,
        Number(s.editing_type_amount || s.unit_price || 0),
        Number(s.quantity || 1),
        s.additional_services
          ? (typeof s.additional_services === "string"
              ? s.additional_services
              : JSON.stringify(s.additional_services))
          : null,
        Number(s.total_amount || s.total_price || 0),
        s.source || "graphic",
      ]);
      await runQuery(
        `INSERT INTO re_quotation_services
         (quotation_id, service_name, category_name, editing_type_name, editing_type_amount, quantity, additional_services, total_amount, source)
         VALUES ?`,
        [values]
      );
    }

    // Update grand total
    if (grand_total_excl_gst !== undefined) {
      await runQuery(
        `UPDATE re_quotation SET grand_total_excl_gst = ?, updated_at = NOW() WHERE id = ?`,
        [Number(grand_total_excl_gst), id]
      );
    }

    res.status(200).json({ status: "Success", message: "Quotation services saved" });
  } catch (error) {
    console.error("saveQuotationServices error:", error);
    res.status(500).json({ status: "Failure", message: "Server error" });
  }
};

// ─── 8. saveQuotationAds ─────────────────────────────────────────────────────
// POST /auth/api/re_calculator/quotation/:id/ads
// Replaces all existing ads for this quotation
exports.saveQuotationAds = async (req, res) => {
  try {
    const { id } = req.params;
    const { ads } = req.body;

    if (!Array.isArray(ads)) {
      return res.status(400).json({ status: "Failure", message: "ads must be an array" });
    }

    const qtnRows = await runQuery(`SELECT id FROM re_quotation WHERE id = ?`, [id]);
    if (qtnRows.length === 0) {
      return res.status(404).json({ status: "Failure", message: "Quotation not found" });
    }

    await runQuery(`DELETE FROM re_quotation_ads WHERE quotation_id = ?`, [id]);

    if (ads.length > 0) {
      const values = ads.map(a => [
        id,
        a.category_name || a.service_name || null,
        Number(a.budget || 0),
        Number(a.percent || a.charge_percentage || 0),
        Number(a.charge || a.ad_charge || 0),
        Number(a.total || a.budget || 0),
      ]);
      await runQuery(
        `INSERT INTO re_quotation_ads (quotation_id, category_name, budget, percent, charge, total) VALUES ?`,
        [values]
      );
    }

    res.status(200).json({ status: "Success", message: "Quotation ads saved" });
  } catch (error) {
    console.error("saveQuotationAds error:", error);
    res.status(500).json({ status: "Failure", message: "Server error" });
  }
};

// ─── 9. saveQuotationNotes ────────────────────────────────────────────────────
// PATCH /auth/api/re_calculator/quotation/:id/notes
// Saves notes to re_quotation.notes_json — does NOT touch re_plan_client_notes
exports.saveQuotationNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes_json, discount_json } = req.body;

    const updates = [];
    const params = [];

    if (notes_json !== undefined) {
      updates.push("notes_json = ?");
      params.push(
        typeof notes_json === "string" ? notes_json : JSON.stringify(notes_json)
      );
    }
    if (discount_json !== undefined) {
      updates.push("discount_json = ?");
      params.push(
        typeof discount_json === "string" ? discount_json : JSON.stringify(discount_json)
      );
    }

    if (updates.length === 0) {
      return res.status(400).json({ status: "Failure", message: "Nothing to update" });
    }

    updates.push("updated_at = NOW()");
    params.push(id);

    await runQuery(`UPDATE re_quotation SET ${updates.join(", ")} WHERE id = ?`, params);
    res.status(200).json({ status: "Success", message: "Quotation notes saved" });
  } catch (error) {
    console.error("saveQuotationNotes error:", error);
    res.status(500).json({ status: "Failure", message: "Server error" });
  }
};

// ─── 10. sendQuotationToClientNew ─────────────────────────────────────────────
// POST /auth/api/re_calculator/quotation/:id/send
// Updates status to 'sent'; notification hooks can be added later
exports.sendQuotationToClientNew = async (req, res) => {
  try {
    const { id } = req.params;
    const { channel } = req.body;

    const qtnRows = await runQuery(
      `SELECT q.*, c.client_name, c.client_organization, c.email, c.phone
       FROM re_quotation q
       LEFT JOIN re_revenue_engine_client_details c ON q.client_id = c.id
       WHERE q.id = ?`,
      [id]
    );
    if (qtnRows.length === 0) {
      return res.status(404).json({ status: "Failure", message: "Quotation not found" });
    }

    const quotation = qtnRows[0];
    const services = await runQuery(
      `SELECT * FROM re_quotation_services WHERE quotation_id = ? ORDER BY id ASC`,
      [id]
    );
    const ads = await runQuery(
      `SELECT * FROM re_quotation_ads WHERE quotation_id = ? ORDER BY id ASC`,
      [id]
    );
    let notes = [];
    try {
      const raw = quotation.notes_json;
      notes = typeof raw === "string" ? JSON.parse(raw || "[]") : raw || [];
    } catch (e) {
      notes = [];
    }

    const clientName = quotation.client_organization || quotation.client_name;
    const snapshot = {
      id: quotation.id,
      quotation_number: quotation.quotation_number,
      txn_id: quotation.txn_id,
      grand_total_excl_gst: quotation.grand_total_excl_gst,
      discount_json: quotation.discount_json,
      notes,
      client_name: quotation.client_name,
      client_organization: quotation.client_organization,
      services,
      ads,
    };

    const { generatePublicAccessToken } = require("./re_publicController");
    const { sendQuotationEmail } = require("./re_sendEmails");
    const { sendQuotationWhatsApp } = require("./re_sendWhatsApp");
    const baseUrl = process.env.CLIENT_BASE_URL || "http://localhost:5173";
    const token = await generatePublicAccessToken(
      quotation.client_id,
      quotation.id,
      "quotation",
      JSON.stringify(snapshot)
    );
    const quotationLink = `${baseUrl}/#/public/quotation/${token}`;

    let emailStatus = null;
    let waStatus = null;

    if (channel === "email" || channel === "both") {
      if (quotation.email) {
        emailStatus = await sendQuotationEmail({
          to: quotation.email,
          clientName,
          quotationNumber: quotation.quotation_number,
          quotationLink,
        });
      } else {
        emailStatus = { ok: false, error: "Client email missing" };
      }
    }

    if (channel === "whatsapp" || channel === "both") {
      if (quotation.phone) {
        waStatus = await sendQuotationWhatsApp({
          toPhone: quotation.phone,
          clientName,
          clientId: quotation.client_id,
          quotationNumber: quotation.quotation_number,
          link: quotationLink,
        });
      } else {
        waStatus = { ok: false, error: "Client phone missing" };
      }
    }

    await runQuery(
      `UPDATE re_quotation SET status = 'sent', updated_at = NOW() WHERE id = ?`,
      [id]
    );

    res.status(200).json({
      status: "Success",
      message: "Quotation sent to client",
      emailStatus,
      waStatus,
    });
  } catch (error) {
    console.error("sendQuotationToClientNew error:", error);
    res.status(500).json({ status: "Failure", message: "Server error" });
  }
};

// ─── 11. getQuotationsByProposal (proforma manager use) ──────────────────────
// GET /auth/api/re_calculator/quotation/:id/proformas
exports.getProformasByQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await runQuery(
      `SELECT * FROM re_proposal_proforma WHERE quotation_id = ? ORDER BY id DESC`,
      [id]
    );
    res.status(200).json({ status: "Success", data: rows });
  } catch (error) {
    console.error("getProformasByQuotation error:", error);
    res.status(500).json({ status: "Failure", message: "Server error" });
  }
};
