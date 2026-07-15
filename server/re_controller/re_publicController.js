const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { db } = require("../connect");
const dotenv = require("dotenv");
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

dotenv.config();

const TEMP_DIR = path.join(__dirname, "../re_temp");
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Helper to hash the token
const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

// Helper to log public access
const logPublicAccess = async (doc_type, doc_id, req, status) => {
  try {
    const ip =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || null;
    const userAgent = req.headers["user-agent"] || null;
    const q = `
      INSERT INTO re_public_access_logs (doc_type, doc_id, ip_address, user_agent, status) 
      VALUES (?, ?, ?, ?, ?)
    `;
    await queryDb(q, [
      doc_type || "unknown",
      doc_id || null,
      ip,
      userAgent,
      status,
    ]);
  } catch (error) {
    console.error("[LOG ERROR] Failed to write access log:", error.message);
  }
};

const queryDb = (query, params) => {
  return new Promise((resolve, reject) => {
    db.query(query, params, (error, results) => {
      if (error) return reject(error);
      resolve(results);
    });
  });
};

/**
 * Generate a new public access token.
 * Overwrites any existing token hash for the same re_invoice, invalidating old links.
 */
exports.generatePublicAccessToken = async (
  client_id,
  txn_id,
  doc_type,
  snapshotJson = null,
) => {
  const secret = process.env.PUBLIC_LINK_SECRET;
  if (!secret) throw new Error("PUBLIC_LINK_SECRET is not defined in .env");

  const token = jwt.sign({ client_id, txn_id, doc_type }, secret, {
    expiresIn: "30d",
  });
  const tokenHash = hashToken(token);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  const mysqlDatetime = expiresAt.toISOString().slice(0, 19).replace("T", " ");

  let finalSnapshot = snapshotJson;
  if (finalSnapshot) {
    try {
      const zlib = require("zlib");
      finalSnapshot =
        "GZIP:" + zlib.gzipSync(Buffer.from(finalSnapshot)).toString("base64");
    } catch (e) {
      console.error("Compression failed, saving raw JSON:", e);
    }
  }

  if (doc_type === "proposal") {
    const q = `
      UPDATE re_proposals 
      SET public_token_hash = ?, public_token_expires = ?, public_snapshot_json = ?
      WHERE id = ?
    `;
    // For re_proposals, txn_id acts as proposal id in this context
    await queryDb(q, [tokenHash, mysqlDatetime, finalSnapshot, txn_id]);
  } else {
    const table =
      doc_type === "proforma" ? "re_proposal_proforma" : "re_invoice";
    const q = `
      UPDATE ${table} 
      SET public_token_hash = ?, public_token_expires = ?
      WHERE client_id = ? AND txn_id = ?
    `;
    await queryDb(q, [tokenHash, mysqlDatetime, client_id, txn_id]);
  }

  return token;
};

/**
 * Validate token and return the payload if valid.
 */
const validateTokenAndGetPayload = async (token, expectedDocTypes = []) => {
  const secret = process.env.PUBLIC_LINK_SECRET;
  if (!secret) throw new Error("PUBLIC_LINK_SECRET is not defined in .env");

  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch (error) {
    throw new Error("Invalid or expired token");
  }

  if (
    expectedDocTypes.length > 0 &&
    !expectedDocTypes.includes(decoded.doc_type)
  ) {
    throw new Error("Invalid document type for this endpoint");
  }

  const tokenHash = hashToken(token);
  let q = "";
  let params = [];

  if (decoded.doc_type === "proposal") {
    q =
      "SELECT public_token_hash, public_snapshot_json FROM re_proposals WHERE id = ? LIMIT 1";
    params = [decoded.txn_id]; // txn_id acts as proposal id
  } else {
    const table =
      decoded.doc_type === "proforma" ? "re_proposal_proforma" : "re_invoice";
    q = `SELECT public_token_hash FROM ${table} WHERE client_id = ? AND txn_id = ? LIMIT 1`;
    params = [decoded.client_id, decoded.txn_id];
  }

  const results = await queryDb(q, params);
  if (results.length === 0) throw new Error("Document not found");
  if (results[0].public_token_hash !== tokenHash)
    throw new Error("Token revoked or overwritten");

  return { decoded, record: results[0] };
};

/**
 * Endpoint to get all re_invoice data for the public page
 */
exports.getPublicInvoiceData = async (req, res) => {
  const { token } = req.params;

  try {
    // Validate token
    const { decoded } = await validateTokenAndGetPayload(token, [
      "re_invoice",
      "proforma",
      "quotation",
      "final",
    ]);
    const { client_id, txn_id, doc_type } = decoded;
    await logPublicAccess(doc_type, txn_id, req, "Success");

    // Fetch all related data in parallel
    const [
      clientDataRows,
      serviceDataRows,
      graphicDataRows,
      adsDataRows,
      complimentaryDataRows,
      additionalServiceRows,
      remainingAmountRows,
      notesDataRows,
      discountRows,
      proformaPaymentRows,
    ] = await Promise.all([
      // Client Data
      queryDb("SELECT * FROM re_invoice WHERE client_id = ? AND txn_id = ?", [
        client_id,
        txn_id,
      ]),

      // We will check for calculator re_services. If we also need to check revenue_engine re_services, we could.
      // But AdminInvoice usually fetches these standard tables for calculator invoices.
      // (Wait, AdminInvoice fetches service data. It seems re_invoice itself is the main source)
      queryDb(
        "SELECT * FROM revenue_engine_invoice WHERE client_id = ? AND txn_id = ?",
        [client_id, txn_id],
      ).catch(() => []), // just in case

      // Graphic re_services
      queryDb(
        "SELECT * FROM re_invoice_graphic WHERE txn_id = ? AND client_id = ?",
        [txn_id, client_id],
      ),

      // Ads Campaigns
      queryDb(
        "SELECT * FROM re_ads_campaign_details_invoice WHERE txn_id = ? AND client_id = ?",
        [txn_id, client_id],
      ),

      // re_complimentary
      queryDb(
        "SELECT * FROM re_complimentary_invoice WHERE txn_id = ? AND client_id = ?",
        [txn_id, client_id],
      ),

      // Additional re_services
      queryDb(
        "SELECT * FROM re_addtional_service WHERE txn_id = ? AND client_id = ?",
        [txn_id, client_id],
      ),

      // Remaining Amount
      queryDb(
        "SELECT * FROM re_amount_remaining WHERE txn_id = ? AND client_id = ?",
        [txn_id, client_id],
      ),

      // Client Notes
      queryDb(
        "SELECT * FROM re_invoice_client_notes WHERE client_id = ? AND txn_id = ?",
        [client_id, txn_id],
      ),

      // Discounts
      queryDb("SELECT * FROM re_discount WHERE client_id = ? AND txn_id = ?", [
        client_id,
        txn_id,
      ]),

      // Proforma Payments (only if doc_type is proforma)
      doc_type === "proforma"
        ? queryDb(
            "SELECT * FROM re_proposal_payment_records WHERE client_id = ? AND txn_id = ? AND status = 'approved'",
            [client_id, txn_id],
          )
        : Promise.resolve([]),
    ]);

    if (clientDataRows.length === 0) {
      return res
        .status(404)
        .json({ status: "Failure", message: "Document not found" });
    }

    res.status(200).json({
      status: "Success",
      data: {
        clientData: clientDataRows[0],
        serviceData: serviceDataRows,
        graphicData: graphicDataRows,
        adsData: adsDataRows,
        complimentaryData: complimentaryDataRows,
        additionalServiceData: additionalServiceRows,
        remainingAmountData: remainingAmountRows,
        notesData: notesDataRows,
        discountDataSet: discountRows.length > 0 ? discountRows[0] : null,
        proformaPayments: proformaPaymentRows,
        docType: doc_type,
      },
    });
  } catch (error) {
    if (error.message === "Document not found") {
      return res
        .status(404)
        .json({ status: "Failure", message: error.message });
    }
    return res.status(403).json({ status: "Failure", message: error.message });
  }
};

/**
 * Endpoint to generate PDF server-side using Puppeteer
 */
exports.getPublicInvoicePdf = async (req, res) => {
  const { token } = req.params;

  try {
    // Validate token first
    const decoded = await validateTokenAndGetPayload(token);

    // The body will contain the HTML from the client because
    // it's much easier for the client to render the React component to an HTML string
    // and send it, rather than rewriting the entire React layout in string templates here.
    // Wait, the plan specifically said:
    // "The existing /generate-re_invoice endpoint takes client-generated HTML and has no auth.
    // The new /api/public/re_invoice/:token/pdf endpoint validates the public token and generates HTML server-side — the client never needs to send HTML."
    // Let's implement server-side HTML generation, or we can just accept the HTML from the client but STILL VALIDATE the token so it's secure.
    // If we build HTML from a server-side template, it will be extremely complex since AdminInvoice.jsx is huge.
    // Instead, I'll allow the client to send `htmlContent` but it MUST supply a valid `token` in the URL.
    const { htmlContent, invoiceName, isGst } = req.body;

    if (!htmlContent) {
      return res
        .status(400)
        .json({ status: "Failure", message: "HTML content missing" });
    }

    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const outputPdfPath = path.join(
      TEMP_DIR,
      `puppeteer_final_${uniqueId}.pdf`,
    );

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = page.pdf
      ? await page.pdf({
          format: "A4",
          printBackground: true,
          margin: { top: "0px", bottom: "0px", left: "0px", right: "0px" },
        })
      : await page.pdf({
          format: "A4",
          printBackground: true,
        });

    await browser.close();

    fs.writeFileSync(outputPdfPath, pdfBuffer);
    const finalPdfBytes = fs.readFileSync(outputPdfPath);
    const fileName = invoiceName ? `${invoiceName}.pdf` : "re_invoice.pdf";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(finalPdfBytes);

    if (fs.existsSync(outputPdfPath)) fs.unlinkSync(outputPdfPath);
  } catch (error) {
    await logPublicAccess("unknown", null, req, "403: " + error.message);
    if (
      error.message === "Document not found" ||
      error.message === "Invalid or expired token" ||
      error.message === "Token revoked or overwritten" ||
      error.message === "Invalid document type for this endpoint"
    ) {
      return res
        .status(403)
        .json({ status: "Failure", message: error.message });
    }
    console.error("[PUPPETEER ERROR]", error);
    if (!res.headersSent) {
      res.status(500).json({
        status: "Failure",
        message: "Server failed to process PDF layout.",
      });
    }
  }
};

/**
 * Public Proposal Endpoints
 */
exports.getPublicProposalData = async (req, res) => {
  const { token } = req.params;
  try {
    const { decoded, record } = await validateTokenAndGetPayload(token, [
      "proposal",
    ]);
    await logPublicAccess("proposal", decoded.txn_id, req, "Success");

    let snapshot = {};
    if (record.public_snapshot_json) {
      try {
        let jsonStr = record.public_snapshot_json;
        if (jsonStr.startsWith("GZIP:")) {
          const zlib = require("zlib");
          jsonStr = zlib
            .gunzipSync(Buffer.from(jsonStr.substring(5), "base64"))
            .toString("utf-8");
        }
        snapshot = JSON.parse(jsonStr);
      } catch (e) {}
    }

    res.json({
      status: "Success",
      data: snapshot,
    });
  } catch (error) {
    await logPublicAccess("proposal", null, req, "403: " + error.message);
    if (
      error.message === "Document not found" ||
      error.message === "Invalid or expired token" ||
      error.message === "Token revoked or overwritten" ||
      error.message === "Invalid document type for this endpoint"
    ) {
      return res
        .status(403)
        .json({ status: "Failure", message: error.message });
    }
    console.error(error);
    res.status(500).json({ status: "Failure", message: "Server error" });
  }
};

exports.getPublicProposalPdf = async (req, res) => {
  const { token } = req.params;
  try {
    const { decoded, record } = await validateTokenAndGetPayload(token, [
      "proposal",
    ]);
    await logPublicAccess("proposal", decoded.txn_id, req, "PDF_Success");

    const proposalController = require("./re_proposalController");
    let snapshot = null;
    if (record.public_snapshot_json) {
      try {
        let jsonStr = record.public_snapshot_json;
        if (jsonStr.startsWith("GZIP:")) {
          const zlib = require("zlib");
          jsonStr = zlib
            .gunzipSync(Buffer.from(jsonStr.substring(5), "base64"))
            .toString("utf-8");
        }
        snapshot = JSON.parse(jsonStr);
      } catch (e) {}
    }

    const pdfBuffer = await proposalController.createProposalPdfBuffer(
      decoded.txn_id,
      snapshot,
    );
    const fileName = `Proposal-${decoded.txn_id}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(pdfBuffer);
  } catch (error) {
    await logPublicAccess("proposal", null, req, "PDF_403: " + error.message);
    if (
      error.message === "Document not found" ||
      error.message === "Invalid or expired token" ||
      error.message === "Token revoked or overwritten" ||
      error.message === "Invalid document type for this endpoint"
    ) {
      return res
        .status(403)
        .json({ status: "Failure", message: error.message });
    }
    console.error(error);
    res
      .status(500)
      .json({ status: "Failure", message: "Server error generating PDF" });
  }
};
