const { db } = require("../connect");
const moment = require("moment-timezone");
const dotenv = require("dotenv");
dotenv.config();
const {
  sendFinalInvoiceEmail,
  sendPaymentReceivedAlertEmail,
  TZ,
} = require("./re_sendEmails");
const {
  sendInvoiceWhatsApp,
  sendPaymentReceivedAlertWA,
} = require("./re_sendWhatsApp");
const { generatePublicAccessToken } = require("./re_publicController");

const WORKFLOW_STATUS = {
  PENDING_ADMIN_APPROVAL: "pending_admin_approval",
  ADMIN_APPROVED: "admin_approved",
  ADMIN_REJECTED: "admin_rejected",

  CLIENT_SENT: "client_sent",
  CLIENT_APPROVED: "client_approved",

  PROFORMA_GENERATED: "proforma_invoice_generated",
  PROFORMA_SENT: "proforma_invoice_sent",

  PAYMENT_RECEIVED: "payment_received_invoice_ready",

  INVOICE_SENT: "invoice_sent",

  STRATEGY_SAVED: "strategy_saved",
  STRATEGY_SENT_TO_ADMIN: "strategy_sent_to_admin",
  STRATEGY_ADMIN_APPROVED: "strategy_admin_approved",
  STRATEGY_CLIENT_APPROVED: "strategy_client_approved",

  TEAM_ASSIGNED: "team_assigned",
  TASKS_ASSIGNED: "tasks_assigned",
};
const now = () => moment().tz(TZ).format("YYYY-MM-DD HH:mm:ss");

// ---- Remark save karne ka helper ----
async function saveRemark(txn_id, action_type, actor_name, remark) {
  return new Promise((resolve, reject) => {
    const q = `
      INSERT INTO re_workflow_remarks
      (
        txn_id,
        action_type,
        actor_name,
        remark,
        created_at
      )
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
      q,
      [txn_id, action_type, actor_name || "", remark || "", now()],
      (err) => {
        if (err) {
          console.error("[REMARK] save error:", err.message);

          return reject(err);
        }

        resolve(true);
      },
    );
  });
}

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

// ---- Quotation status update helper ----
function updateQuotationStatus(
  txn_id,
  client_id,
  status,
  approved_by = "System",
  cb,
) {
  const q = `
    INSERT INTO re_quotation_status
    (
      txn_id,
      client_id,
      status,
      approved_by,
      updated_at
    )
    VALUES (?, ?, ?, ?, NOW())

    ON DUPLICATE KEY UPDATE
      status = VALUES(status),
      approved_by = VALUES(approved_by),
      updated_at = NOW()
  `;

  db.query(q, [txn_id, client_id, status, approved_by], cb || (() => {}));
}

// Ye dhundho:
function updateQuotationStatusAsync(
  txn_id,
  client_id,
  status,
  approved_by = "System",
) {
  return new Promise((resolve, reject) => {
    updateQuotationStatus(txn_id, client_id, status, approved_by, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

async function ensurePaymentLedgerTable() {
  await runQuery(`
    CREATE TABLE IF NOT EXISTS re_workflow_payment_ledger (
      id INT AUTO_INCREMENT PRIMARY KEY,
      txn_id VARCHAR(100) NOT NULL,
      client_id VARCHAR(100) NOT NULL,
      amount_received DECIMAL(12,2) NOT NULL DEFAULT 0,
      payment_date DATE NOT NULL,
      payment_mode VARCHAR(50) NOT NULL,
      transaction_reference VARCHAR(255) NOT NULL,
      remark TEXT,
      received_by VARCHAR(200),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_txn_client (txn_id, client_id),
      KEY idx_payment_date (payment_date)
    )
  `);
}

function toAmount(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

async function getClientNameById(client_id) {
  const rows = await runQuery(
    `SELECT client_name
     FROM re_revenue_engine_client_details
     WHERE id = ?
     LIMIT 1`,
    [client_id],
  );

  return rows?.[0]?.client_name || "";
}

async function getContractValue(txn_id, client_id) {
  const rows = await runQuery(
    `
      SELECT
        (
          COALESCE((
            SELECT SUM(COALESCE(ct.total_amount, 0))
            FROM re_calculator_transactions ct
            WHERE ct.txn_id = ? AND ct.client_id = ?
          ), 0)
          +
          COALESCE((
            SELECT SUM(
              COALESCE(ad.total, COALESCE(ad.amount, 0) + COALESCE(ad.charge, 0))
            )
            FROM re_ads_campaign_details ad
            WHERE ad.txn_id = ? AND ad.client_id = ?
          ), 0)
        ) AS contract_total
    `,
    [txn_id, client_id, txn_id, client_id],
  );
  return toAmount(rows?.[0]?.contract_total);
}

async function getTotalReceived(txn_id, client_id) {
  const rows = await runQuery(
    `SELECT COALESCE(SUM(amount_received), 0) AS total_received
     FROM re_workflow_payment_ledger
     WHERE txn_id = ? AND client_id = ?`,
    [txn_id, client_id],
  );
  return toAmount(rows?.[0]?.total_received);
}

// ============================================================
// A. DM → SF: Quotation submit karo Admin ke liye
//    POST /workflow/submitToAdmin
//    Body: { txn_id, client_id, remark }
// ============================================================
exports.submitToAdmin = async (req, res) => {
  try {
    const { txn_id, client_id, remark } = req.body;

    // Validation
    if (!txn_id || !client_id) {
      return res.status(400).json({
        success: false,
        message: "txn_id aur client_id required hai",
      });
    }

    // =========================
    // CLIENT DETAILS FETCH
    // =========================
    db.query(
      `
SELECT 
  cd.client_name,
  cd.phone,
  cd.email
FROM re_revenue_engine_client_details cd
       LEFT JOIN re_calculator_transactions ch 
          ON ch.txn_id = ? 
          AND ch.client_id = ?
       WHERE cd.id = ?
       LIMIT 1`,
      [txn_id, client_id, client_id],

      async (err, results) => {
        if (err) {
          console.log("Client Fetch Error:", err);

          return res.status(500).json({
            success: false,
            error: err.message,
          });
        }

        const client = results[0];

        // Client not found
        if (!client) {
          return res.status(404).json({
            success: false,
            message: "Client details nahi mili",
          });
        }

        // =========================
        // services FETCH
        // =========================
        db.query(
          `SELECT 
    service_name,
    total_amount
FROM re_calculator_transactions
           WHERE txn_id = ?
           AND client_id = ?`,
          [txn_id, client_id],

          async (err2, services) => {
            if (err2) {
              console.log("services Fetch Error:", err2);

              return res.status(500).json({
                success: false,
                error: err2.message,
              });
            }

            try {
              // =========================
              // STATUS UPDATE
              // =========================
              await updateQuotationStatusAsync(
                txn_id,
                client_id,
                "pending_admin_approval",
                req.user?.employee_name || "Unknown Employee",
              );

              // =========================
              // REMARK SAVE
              // =========================
              await saveRemark(
                txn_id,
                "quotation_sent_to_sf",
                req.user?.employee_name || "Unknown Employee",
                remark || "",
              );

              // SF integration removed

              // =========================
              // SUCCESS RESPONSE
              // =========================
              return res.status(200).json({
                success: true,
                message: "Quotation SF Admin ke paas bhej diya gaya",
              });
            } catch (innerError) {
              console.log("Submit To Admin Error:", innerError);

              return res.status(500).json({
                success: false,
                error: innerError.message,
              });
            }
          },
        );
      },
    );
  } catch (error) {
    console.log("Server Error:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// sfQuotationDecision removed (SF integration removed)

// ============================================================
// C. DM Manager: Client ko Quotation bhejo
//    POST /workflow/sendQuotationToClient
//    Body: { txn_id, client_id, channel: 'email'|'whatsapp'|'both', remark }
// ============================================================
exports.sendQuotationToClient = async (req, res) => {
  const { txn_id, client_id, channel, remark } = req.body;

  if (!txn_id || !client_id || !channel) {
    return res.status(400).json({
      success: false,
      message: "txn_id, client_id, channel required hai",
    });
  }

  db.query(
    `SELECT 
        client_name,
        phone,
        email
     FROM re_revenue_engine_client_details
     WHERE id = ?
     LIMIT 1`,
    [client_id],

    async (err, results) => {
      if (err) {
        console.log("Client Fetch Error:", err);

        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }

      if (!results.length) {
        return res.status(404).json({
          success: false,
          message: "Client nahi mila",
        });
      }

      const c = results[0];

      const baseUrl = process.env.CLIENT_BASE_URL || "";

      const token = await generatePublicAccessToken(
        client_id,
        txn_id,
        "quotation",
      );
      const link = `${baseUrl}/#/public/invoice/${token}`;

      // STATUS UPDATE
      updateQuotationStatusAsync(txn_id, client_id, "client_sent");

      // SAVE REMARK
      await saveRemark(
        txn_id,
        "client_quotation_sent",
        req.user?.employee_name,
        remark,
      );

      return res.status(200).json({
        success: true,
        message: "Quotation client ko bhej diya gaya",
      });
    },
  );
};

// ============================================================
// D. DM Manager: Client ne Quotation Approve mark kiya (manually)
//    PUT /workflow/markClientQuotationApproved
//    Body: { txn_id, client_id, remark }
// ============================================================
exports.markClientQuotationApproved = async (req, res) => {
  const { txn_id, client_id, decision = "approved", remark } = req.body;
  if (!txn_id || !client_id) {
    return res
      .status(400)
      .json({ success: false, message: "txn_id aur client_id required" });
  }

  const decisionMap = {
    approved: "client_approved",
    rejected: "client_rejected",
    pending: "client_sent",
    changes: "client_sent",
  };
  const nextStatus = decisionMap[decision];
  if (!nextStatus) {
    return res.status(400).json({
      success: false,
      message: "decision: approved | rejected | pending | changes",
    });
  }

  try {
    await updateQuotationStatusAsync(txn_id, client_id, nextStatus);
    await saveRemark(
      txn_id,
      `client_quotation_${decision}`,
      req.user?.employee_name,
      remark,
    );

    return res.status(200).json({
      success: true,
      message: `Client quotation response marked: ${decision}`,
      nextStatus,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// E. Invoice Client ko bheji — SF ko notify karo
//    POST /workflow/invoiceSentNotify
//    Body: { txn_id, client_id, invoice_amount, remark }
// ============================================================
exports.generateProformaInvoice = async (req, res) => {
  const { txn_id, client_id, proforma_amount = 0, remark } = req.body;
  if (!txn_id || !client_id) {
    return res
      .status(400)
      .json({ success: false, message: "txn_id aur client_id required" });
  }

  try {
    await updateQuotationStatusAsync(
      txn_id,
      client_id,
      "proforma_invoice_generated",
    );
    await saveRemark(
      txn_id,
      "proforma_invoice_generated",
      req.user?.employee_name,
      remark || `Proforma generated: ${proforma_amount}`,
    );
    return res.status(200).json({
      success: true,
      message: "Proforma invoice generated",
      nextStatus: "proforma_invoice_generated",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPaymentSummary = async (req, res) => {
  const { txn_id } = req.params;
  const client_id = req.query.client_id || req.params.client_id;
  if (!txn_id || !client_id) {
    return res
      .status(400)
      .json({ success: false, message: "txn_id aur client_id required" });
  }

  try {
    await ensurePaymentLedgerTable();
    const total_contract_value = await getContractValue(txn_id, client_id);
    const total_received_till_date = await getTotalReceived(txn_id, client_id);
    const pending_payment_amount = Math.max(
      total_contract_value - total_received_till_date,
      0,
    );
    const payments = await runQuery(
      `SELECT id, amount_received, payment_date, payment_mode, transaction_reference, remark, received_by, created_at
       FROM re_workflow_payment_ledger
       WHERE txn_id = ? AND client_id = ?
       ORDER BY payment_date DESC, id DESC`,
      [txn_id, client_id],
    );

    return res.status(200).json({
      success: true,
      data: {
        txn_id,
        client_id,
        total_contract_value,
        total_received_till_date,
        pending_payment_amount,
        payments,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.recordPaymentAndGenerateFinalInvoice = async (req, res) => {
  const {
    txn_id,
    client_id,
    amount_received,
    payment_date,
    payment_mode,
    transaction_reference,
    remark,
  } = req.body;

  if (
    !txn_id ||
    !client_id ||
    !amount_received ||
    !payment_date ||
    !payment_mode ||
    !transaction_reference
  ) {
    return res.status(400).json({
      success: false,
      message:
        "txn_id, client_id, amount_received, payment_date, payment_mode, transaction_reference required",
    });
  }

  // Duplicate transaction check
  const duplicatePayment = await runQuery(
    `
    SELECT id
    FROM re_workflow_payment_ledger
    WHERE transaction_reference = ?
    LIMIT 1
  `,
    [transaction_reference],
  );

  if (duplicatePayment.length) {
    return res.status(400).json({
      success: false,
      message: "Duplicate transaction reference detected",
    });
  }

  const allowedModes = ["UPI", "Bank Transfer", "Cash", "Cheque"];
  if (!allowedModes.includes(payment_mode)) {
    return res.status(400).json({
      success: false,
      message: "payment_mode: UPI | Bank Transfer | Cash | Cheque",
    });
  }

  const paymentAmount = toAmount(amount_received);
  if (paymentAmount <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "amount_received should be > 0" });
  }

  try {
    await ensurePaymentLedgerTable();

    await runQuery(
      `INSERT INTO re_workflow_payment_ledger
       (txn_id, client_id, amount_received, payment_date, payment_mode, transaction_reference, remark, received_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        txn_id,
        client_id,
        paymentAmount,
        payment_date,
        payment_mode,
        transaction_reference,
        remark || "",
        req.user?.employee_name || "",
      ],
    );

    const total_contract_value = await getContractValue(txn_id, client_id);
    const total_received_till_date = await getTotalReceived(txn_id, client_id);
    const pending_payment_amount = Math.max(
      total_contract_value - total_received_till_date,
      0,
    );
    const tag_received_amt =
      pending_payment_amount <= 0 ? "received" : "pending";

    const invoiceExists = await runQuery(
      `SELECT id FROM re_invoice WHERE txn_id = ? AND client_id = ? LIMIT 1`,
      [txn_id, client_id],
    );
    if (!invoiceExists.length) {
      return res.status(404).json({
        success: false,
        message: "Invoice record nahi mila, pehle invoice generate karo",
      });
    }

    await runQuery(
      `UPDATE re_invoice
       SET
         previous_amt = ?,
         received_amt = ?,
         current_amt = ?,
         tag_received_amt = ?
       WHERE txn_id = ? AND client_id = ?`,
      [
        Math.max(total_received_till_date - paymentAmount, 0),
        total_received_till_date,
        pending_payment_amount,
        tag_received_amt,
        txn_id,
        client_id,
      ],
    );

    await updateQuotationStatusAsync(
      txn_id,
      client_id,
      "payment_received_invoice_ready",
    );
    await saveRemark(
      txn_id,
      "payment_recorded_invoice_ready",
      req.user?.employee_name,
      remark || transaction_reference,
    );

    const client_name = await getClientNameById(client_id);
    await sf
      .pushPaymentInvoiceReadyToSF({
        txn_id,
        client_name,
        amount_received: paymentAmount,
        total_received_till_date,
        pending_payment_amount,
        payment_mode,
        payment_date,
        transaction_reference,
      })
      .catch((e) => console.error("[SF] payment invoice ready:", e.message));

    // Need to get invoice date and number for the notification
    const invoiceDetails = await runQuery(
      `SELECT invoice_no, invoice_date, total_amt, tds_deducted FROM re_invoice WHERE txn_id = ? AND client_id = ? LIMIT 1`,
      [txn_id, client_id],
    );

    let adminEmailStatus = { ok: true };
    let adminWAStatus = { ok: true };

    if (invoiceDetails.length) {
      const inv = invoiceDetails[0];
      const alertData = {
        clientName: client_name,
        orgName: "", // Could fetch from client details if needed
        clientId: client_id,
        invoiceNo: inv.invoice_no,
        invoiceDate: moment(inv.invoice_date).format("YYYY-MM-DD"),
        paymentDate: payment_date,
        amountReceived: paymentAmount,
        paymentMode: payment_mode,
        invoiceTotal: inv.total_amt,
        previousBalance: Math.max(total_received_till_date - paymentAmount, 0),
        tdsApplicable: inv.tds_deducted > 0 ? "Yes" : "No",
        tdsDeducted: inv.tds_deducted || 0,
        netCredited: paymentAmount,
        totalReceivedTillDate: total_received_till_date,
        pendingOutstanding: pending_payment_amount,
      };

      adminEmailStatus = await sendPaymentReceivedAlertEmail(alertData);
      adminWAStatus = await sendPaymentReceivedAlertWA(alertData);
    }

    return res.status(200).json({
      success: true,
      message: "Payment recorded. Final invoice is ready to dispatch.",
      nextStatus: "payment_received_invoice_ready",
      data: {
        total_contract_value,
        total_received_till_date,
        pending_payment_amount,
      },
      adminEmailStatus,
      adminWAStatus,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// exports.sendFinalInvoiceToClient = async (req, res) => {
//   const { txn_id, client_id, channel, invoice_amount = 0, remark } = req.body;
//   if (!txn_id || !client_id || !channel) {
//     return res
//       .status(400)
//       .json({ success: false, message: "txn_id, client_id, channel required" });
//   }

//   try {
//     const rows = await runQuery(
//       `SELECT client_name, phone, email FROM re_revenue_engine_client_details WHERE id = ? LIMIT 1`,
//       [client_id],
//     );
//     if (!rows.length) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Client nahi mila" });
//     }

//     const c = rows[0];
//     const baseUrl = process.env.CLIENT_BASE_URL || "";

//     const token = await generatePublicAccessToken(client_id, txn_id, "final");
//     const invoiceLink = `${baseUrl}/#/public/invoice/${token}`;

//     if (channel === "email" || channel === "both") {
//       await sendFinalInvoiceEmail({
//         to: c.email,
//         clientName: c.client_name,
//         txnId: txn_id,
//         invoiceLink,
//       }).catch((e) =>
//         console.error("[MAIL] final invoice to client:", e.message),
//       );
//     }

//     if (channel === "whatsapp" || channel === "both") {
//       await sendInvoiceWhatsApp({
//         toPhone: c.phone,
//         assigneeName: c.client_name,
//         clientName: c.client_name,
//         clientId: client_id,
//         txnId: txn_id,
//         deadline: null,
//         link: invoiceLink,
//       }).catch((e) =>
//         console.error("[WA] final invoice to client:", e.message),
//       );
//     }

//     await updateQuotationStatusAsync(txn_id, client_id, "invoice_sent");
//     await saveRemark(txn_id, "invoice_sent", req.user?.employee_name, remark);
//     await sf
//       .pushInvoiceSentToSF({
//         txn_id,
//         client_name: c.client_name || "",
//         invoice_amount,
//       })
//       .catch((e) => console.error("[SF] invoice sent:", e.message));

//     return res.status(200).json({
//       success: true,
//       message: "Final invoice sent to client",
//       nextStatus: "invoice_sent",
//     });
//   } catch (err) {
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };

exports.invoiceSentNotify = async (req, res) => {
  const { txn_id, client_id, invoice_amount, remark } = req.body;
  if (!txn_id || !client_id) {
    return res
      .status(400)
      .json({ success: false, message: "txn_id aur client_id required" });
  }

  try {
    await updateQuotationStatusAsync(txn_id, client_id, "invoice_sent");
    await saveRemark(txn_id, "invoice_sent", req.user?.employee_name, remark);
    const client_name = await getClientNameById(client_id);
    await sf
      .pushInvoiceSentToSF({ txn_id, client_name, invoice_amount })
      .catch((e) => {
        console.error("[SF] invoice sent (legacy):", e.message);
      });
    return res
      .status(200)
      .json({ success: true, message: "Invoice sent - SF notify ho gaya" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* --- FOR FUTURE DEVELOPMENT OK ---
// ============================================================
// F. Strategy Save karo + SF ko bhejo
//    POST /workflow/saveStrategy
//    Body: { txn_id, client_id, tasks: [{service_name, description, deadline}] }
// ============================================================
exports.saveStrategy = async (req, res) => {
  const { txn_id, client_id, tasks = [], services = [] } = req.body;
  const sourceTasks = Array.isArray(tasks) && tasks.length ? tasks : services;

  const normalizedTasks = (sourceTasks || [])
    .map((task) => ({
      service_name: task?.service_name || task?.name || "",
      description: task?.description || task?.desc || "",
      deadline: task?.deadline || null,
    }))
    .filter((task) => task.service_name && task.deadline);

  if (!txn_id || !client_id || normalizedTasks.length === 0) {
    return res.status(400).json({
      success: false,
      message: "txn_id, client_id aur valid tasks required",
    });
  }

  try {
    const client_name = await getClientNameById(client_id);
    const values = normalizedTasks.map((task) => [
      txn_id,
      client_id,
      task.service_name,
      task.description,
      task.deadline,
      "saved",
    ]);

    const q = `
      INSERT INTO re_workflow_strategy (txn_id, client_id, service_name, description, deadline, status)
      VALUES ?
      ON DUPLICATE KEY UPDATE
        description = VALUES(description),
        deadline = VALUES(deadline),
        updated_at = NOW()
    `;

    await runQuery(q, [values]);
    await updateQuotationStatusAsync(txn_id, client_id, "strategy_saved");
    await saveRemark(
      txn_id,
      "strategy_saved",
      req.user?.employee_name || "DM Manager",
      "Strategy updated",
    );

    // SF push will happen only when DM Manager submits to Admin
    // via sendStrategyToAdmin endpoint

    return res.status(200).json({ success: true, message: "Strategy updated" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// F2. DM Manager: Strategy ko Admin (SF) ko bhejo
//     POST /workflow/sendStrategyToAdmin
//     Body: { txn_id, client_id }
// ============================================================
exports.sendStrategyToAdmin = async (req, res) => {
  const { txn_id, client_id } = req.body;

  if (!txn_id || !client_id) {
    return res.status(400).json({
      success: false,
      message: "txn_id aur client_id required",
    });
  }

  try {
    // 1. Strategy tasks fetch karo DB se
    const tasks = await new Promise((resolve, reject) => {
      db.query(
        `SELECT service_name, description, deadline FROM re_workflow_strategy WHERE txn_id = ? AND client_id = ?`,
        [txn_id, client_id],
        (err, results) => {
          if (err) return reject(err);
          resolve(results || []);
        }
      );
    });

    if (!tasks.length) {
      return res.status(400).json({
        success: false,
        message: "No strategy tasks found. Please save strategy first.",
      });
    }

    // 2. Client name fetch karo
    const client_name = await getClientNameById(client_id);

    // 3. SF push karo
    await sf
      .pushStrategyToSF({
        txn_id,
        client_name,
        tasks,
      })
      .catch((e) => console.error("SF Push Error:", e.message));

    // 4. Status update karo
    await updateQuotationStatusAsync(txn_id, client_id, "strategy_sent_to_admin");

    // 5. Remark save karo
    await saveRemark(
      txn_id,
      "strategy_sent_to_admin",
      req.user?.employee_name || "DM Manager",
      "Strategy submitted to Admin (SF)"
    );

    return res.status(200).json({
      success: true,
      message: "Strategy sent to admin",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// G. Strategy GET — ek txn ki strategy dekho
//    GET /workflow/getStrategy/:txn_id
// ============================================================
exports.getStrategy = (req, res) => {
  const { txn_id } = req.params;
  db.query(
    `SELECT * FROM re_workflow_strategy WHERE txn_id = ? ORDER BY id ASC`,
    [txn_id],
    (err, results) => {
      if (err)
        return res.status(500).json({ success: false, error: err.message });
      return res.status(200).json({ success: true, data: results });
    },
  );
};

// ============================================================
// H. SF → DM Webhook: Admin ne Strategy decide kiya
// sfStrategyDecision removed (SF integration removed)

// ============================================================
// I. DM Manager: Strategy client ko bhejo
//    POST /workflow/sendStrategyToClient
//    Body: { txn_id, client_id, channel: 'email'|'whatsapp'|'both', remark }
// ============================================================
exports.sendStrategyToClient = async (req, res) => {
  const { txn_id, client_id, channel, remark } = req.body;
  if (!txn_id || !client_id || !channel) {
    return res
      .status(400)
      .json({ success: false, message: "txn_id, client_id, channel required" });
  }

  db.query(
    `SELECT client_name, phone, email FROM re_revenue_engine_client_details WHERE id = ? LIMIT 1`,
    [client_id],
    async (err, results) => {
      if (err || !results.length) {
        return res
          .status(500)
          .json({ success: false, message: "Client nahi mila" });
      }

      const c = results[0];
      const baseUrl = process.env.CLIENT_BASE_URL || "";

      // Strategy ki list bhi bhejni hai message mein
      db.query(
        `SELECT service_name, deadline FROM re_workflow_strategy WHERE txn_id = ?`,
        [txn_id],
        async (_, tasks) => {
          const taskText = (tasks || [])
            .map(
              (t) => `• ${t.service_name} — deadline: ${t.deadline || "TBD"}`,
            )
            .join("\n");


          updateQuotationStatus(txn_id, client_id, "strategy_client_sent");
          await saveRemark(
            txn_id,
            "strategy_client_sent",
            req.user?.employee_name,
            remark,
          );

          return res
            .status(200)
            .json({ success: true, message: "Strategy client ko bhej di" });
        },
      );
    },
  );
};

// ============================================================
// J. DM Manager: Client ne Strategy Approve mark kiya
//    PUT /workflow/markClientStrategyApproved
//    Body: { txn_id, client_id, decision: 'approved'|'rejected'|'changes', remark }
// ============================================================
exports.markClientStrategyDecision = async (req, res) => {
  const { txn_id, client_id, decision, remark } = req.body;
  if (!txn_id || !client_id || !decision) {
    return res.status(400).json({
      success: false,
      message: "txn_id, client_id, decision required",
    });
  }

  const statusMap = {
    approved: "strategy_client_approved",
    rejected: "strategy_client_rejected",
    changes: "strategy_changes_requested",
  };

  const newStatus = statusMap[decision];
  if (!newStatus) {
    return res.status(400).json({
      success: false,
      message: "decision: approved | rejected | changes",
    });
  }

  updateQuotationStatus(txn_id, client_id, newStatus);
  await saveRemark(
    txn_id,
    `strategy_client_${decision}`,
    req.user?.employee_name,
    remark,
  );

  db.query(
    `UPDATE re_workflow_strategy SET status = ?, client_remark = ? WHERE txn_id = ?`,
    [
      decision === "approved"
        ? "client_approved"
        : decision === "rejected"
          ? "client_rejected"
          : "changes_requested",
      remark || "",
      txn_id,
    ],
    () => {},
  );



  return res
    .status(200)
    .json({ success: true, message: `Strategy client decision: ${decision}` });
};

// ============================================================
// K. Team Lead Assign karo
//    POST /workflow/assignTeamLead
//    Body: { txn_id, client_id, team_id, team_name, team_lead_id, team_lead_name, team_lead_email, remark }
// ============================================================
exports.assignTeamLead = async (req, res) => {
  const {
    txn_id,
    client_id,
    team_id,
    team_name,
    team_lead_id,
    team_lead_name,
    team_lead_email,
    remark,
  } = req.body;
  if (!txn_id || !client_id || !team_lead_id) {
    return res.status(400).json({
      success: false,
      message: "txn_id, client_id, team_lead_id required",
    });
  }

  const insertQ = `
    INSERT INTO re_workflow_project_assignments
      (txn_id, client_id, team_id, team_name, team_lead_id, team_lead_name, team_lead_email, assigned_by_id, remark, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      team_id = VALUES(team_id),
      team_name = VALUES(team_name),
      team_lead_id = VALUES(team_lead_id),
      team_lead_name = VALUES(team_lead_name),
      team_lead_email = VALUES(team_lead_email),
      remark = VALUES(remark)
  `;

  db.query(
    insertQ,
    [
      txn_id,
      client_id,
      team_id || "",
      team_name || "",
      team_lead_id,
      team_lead_name || "",
      team_lead_email || "",
      req.user?.id || "",
      remark || "",
      now(),
    ],
    async (err) => {
      if (err)
        return res.status(500).json({ success: false, error: err.message });

      updateQuotationStatus(txn_id, client_id, "team_assigned");
      await saveRemark(
        txn_id,
        "team_lead_assigned",
        req.user?.employee_name,
        remark,
      );

      // Strategy tasks bhi bhejo
      // SF push removed

      return res
        .status(200)
        .json({ success: true, message: "Team Lead assign ho gaya" });
    },
  );
};

// ============================================================
// L. Employees list — Stub (SF removed, connect to local DB in future)
//    GET /workflow/sfEmployees
// ============================================================
exports.getSFEmployees = async (req, res) => {
  return res.status(200).json({ success: true, data: [] });
};

// ============================================================
// M. teams list — Stub (SF removed, connect to local DB in future)
//    GET /workflow/sfTeams
// ============================================================
exports.getSFTeams = async (req, res) => {
  return res.status(200).json({ success: true, data: [] });
};

// ============================================================
// N. Team Leads list — Stub (SF removed, connect to local DB in future)
//    GET /workflow/sfTeamLeads/:teamId
// ============================================================
exports.getSFTeamLeads = async (req, res) => {
  return res.status(200).json({ success: true, data: [] });
};

// ============================================================
// O. Task Owners bulk assign karo
//    POST /workflow/assignTaskOwners
//    Body: {
//      txn_id, client_id,
//      tasks: [{strategy_id, task_name, task_description, assigned_to_id,
//               assigned_to_name, assigned_to_email, deadline}]
//    }
// ============================================================
exports.assignTaskOwners = (req, res) => {
  const { txn_id, client_id, tasks } = req.body;
  if (!tasks || tasks.length === 0) return res.status(400).send("No tasks");

  db.query(
    `SELECT client_name FROM re_revenue_engine_client_details WHERE id = ? LIMIT 1`,
    [client_id],
    (err, result) => {
      const client_name = result?.[0]?.client_name || "";
      const values = tasks.map((t) => [
        txn_id,
        client_id,
        t.strategy_id,
        t.task_name,
        t.task_description,
        t.assigned_to_id,
        t.assigned_to_name,
        t.assigned_to_email,
        t.deadline,
      ]);

      const q = `INSERT INTO re_workflow_task_assignments (txn_id, client_id, strategy_id, task_name, task_description, assigned_to_id, assigned_to_name, assigned_to_email, deadline)
               VALUES ? ON DUPLICATE KEY UPDATE task_description = VALUES(task_description), assigned_to_id = VALUES(assigned_to_id), updated_at = NOW()`;

      db.query(q, [values], async (err) => {
        if (err)
          return res.status(500).json({ success: false, error: err.message });

        updateQuotationStatus(txn_id, client_id, "tasks_assigned");
        await saveRemark(
          txn_id,
          "tasks_assigned",
          req.user?.employee_name || "DM Manager",
          "Tasks assigned",
        );

        // SF push removed
        res.status(200).json({ success: true, message: "Tasks assigned" });
      });
    },
  );
};

// ============================================================
// P. Tasks GET — ek txn ke sare tasks dekho
//    GET /workflow/getTasks/:txn_id
// ============================================================
exports.getTasksByTxn = (req, res) => {
  const { txn_id } = req.params;
  db.query(
    `SELECT * FROM re_workflow_task_assignments WHERE txn_id = ? ORDER BY deadline ASC`,
    [txn_id],
    (err, results) => {

      console.log("TXN:", txn_id);
console.log("TASKS:", tasks);
      if (err)
        return res.status(500).json({ success: false, error: err.message });
      return res.status(200).json({ success: true, data: results });
    },
  );
};

// sfTaskStatusUpdate removed (SF integration removed)

// ============================================================
// R. Remarks GET — ek txn ke sare remarks dekho
//    GET /workflow/getRemarks/:txn_id
// ============================================================
exports.getRemarks = (req, res) => {
  const { txn_id } = req.params;
  db.query(
    `SELECT * FROM re_workflow_remarks WHERE txn_id = ? ORDER BY created_at DESC`,
    [txn_id],
    (err, results) => {
      if (err)
        return res.status(500).json({ success: false, error: err.message });
      return res.status(200).json({ success: true, data: results });
    },
  );
};
*/
