const {
  sendFinalInvoiceEmail,
  sendInvoiceAdminNotifyEmail,
  sendPaymentReceivedAlertEmail,
} = require("../re_controller/re_sendEmails");

const {
  sendInvoiceWhatsApp,
  sendInvoiceAdminNotifyWA,
  sendPaymentReceivedAlertWA,
} = require("../re_controller/re_sendWhatsApp");

/**
 * Handles dispatching notifications for the FINAL_INVOICE event.
 * Uses Promise.allSettled to ensure that individual failures do not block other channels.
 */
async function handleFinalInvoice(payload) {
  const {
    clientEmail,
    clientPhone,
    clientName,
    txnId,
    invoiceLink,
    adminAmount,
    adminTimeStr,
  } = payload;

  const results = await Promise.allSettled([
    sendFinalInvoiceEmail({
      to: clientEmail,
      clientName: clientName,
      txnId: txnId,
      invoiceLink: invoiceLink,
    }),
    sendInvoiceWhatsApp({
      toPhone: clientPhone,
      clientName: clientName,
      txnId: txnId,
      link: invoiceLink,
    }),
    sendInvoiceAdminNotifyEmail({
      clientName: clientName,
      invoiceNo: txnId,
      amount: adminAmount,
      timeStr: adminTimeStr,
      link: invoiceLink,
    }),
    sendInvoiceAdminNotifyWA({
      clientName: clientName,
      invoiceNo: txnId,
      amount: adminAmount,
      timeStr: adminTimeStr,
      link: invoiceLink,
    }),
  ]);

  // Map the settled results to a clean boolean status object
  const getStatus = (res) =>
    res.status === "fulfilled" && res.value?.ok === true;

  return {
    clientEmail: getStatus(results[0]),
    clientWhatsapp: getStatus(results[1]),
    adminEmail: getStatus(results[2]),
    adminWhatsapp: getStatus(results[3]),
  };
}

async function handlePaymentAlert(payload) {
  const {
    clientEmail,
    clientName,
    orgName,
    clientId,
    invoiceNo,
    invoiceDate,
    paymentDate,
    amountReceived,
    paymentMode,
    invoiceTotal,
    previousBalance,
    tdsApplicable,
    tdsDeducted,
    netCredited,
    totalReceivedTillDate,
    pendingOutstanding,
  } = payload;

  const results = await Promise.allSettled([
    sendPaymentReceivedAlertEmail({
      clientName,
      orgName,
      clientId,
      invoiceNo,
      invoiceDate,
      paymentDate,
      amountReceived,
      paymentMode,
      invoiceTotal,
      previousBalance,
      tdsApplicable,
      tdsDeducted,
      netCredited,
      totalReceivedTillDate,
      pendingOutstanding,
    }),
    sendPaymentReceivedAlertWA({
      clientName,
      orgName,
      clientId,
      invoiceNo,
      invoiceDate,
      paymentDate,
      amountReceived,
      paymentMode,
      invoiceTotal,
      previousBalance,
      tdsApplicable,
      tdsDeducted,
      netCredited,
      totalReceivedTillDate,
      pendingOutstanding,
    }),
  ]);

  const getStatus = (res) =>
    res.status === "fulfilled" && res.value?.ok === true;

  return {
    adminEmail: getStatus(results[0]),
    adminWhatsapp: getStatus(results[1]),
  };
}

// Event Handlers Map
const handlers = {
  FINAL_INVOICE: handleFinalInvoice,
  // PROPOSAL: handleProposal,
  PAYMENT_ALERT: handlePaymentAlert,
};

/**
 * Generic event dispatcher for notifications.
 * @param {Object} params
 * @param {string} params.event - The notification event name (e.g., 'FINAL_INVOICE').
 * @param {Object} params.payload - The data required for the event's notifications.
 * @returns {Promise<Object>} - An object detailing the success status of each channel.
 */
async function dispatch({ event, payload }) {
  const handler = handlers[event];
  if (!handler) {
    console.error(
      `[NOTIFICATION_SERVICE] No handler found for event: ${event}`,
    );
    return { error: "Unknown Event" };
  }

  try {
    return await handler(payload);
  } catch (error) {
    console.error(
      `[NOTIFICATION_SERVICE] Critical error in handler ${event}:`,
      error,
    );
    return { error: error.message };
  }
}


const { db } = require("../../connect");
const { sendProjectBlockedAlertEmail } = require("../re_controller/re_sendEmails");

/**
 * Handles dispatching notification to Account Owner when SF project is Blocked.
 */
async function notifyProjectBlocked({ proformaId, clientName, proformaNumber }) {
  try {
    console.log(`[RE Notification] Resolving Account Owner for Blocked Proforma #${proformaId}...`);

    // 1. Fetch proforma and client details
    const proformaRows = await new Promise((resolve) => {
      const sql = `
        SELECT p.created_by, c.client_name, c.dg_employee, p.proforma_number
        FROM re_proposal_proforma p
        LEFT JOIN re_revenue_engine_client_details c ON p.client_id = c.id
        WHERE p.id = ?
        LIMIT 1
      `;
      db.query(sql, [proformaId], (err, rows) => resolve(rows || []));
    });

    const proforma = proformaRows[0] || {};
    const finalClientName = clientName || proforma.client_name || "Client Project";
    const finalProformaNo = proformaNumber || proforma.proforma_number || `ID #${proformaId}`;

    let ownerEmail = null;
    let ownerName = "Account Owner";

    // 2. Try to resolve employee from p.created_by
    if (proforma.created_by && proforma.created_by !== "System") {
      const empRows = await new Promise((resolve) => {
        const sql = `
          SELECT employee_name, employee_email
          FROM re_revenue_engine_employees
          WHERE id = ? OR employee_name = ?
          LIMIT 1
        `;
        db.query(sql, [proforma.created_by, proforma.created_by], (err, rows) => resolve(rows || []));
      });
      if (empRows.length > 0 && empRows[0].employee_email) {
        ownerEmail = empRows[0].employee_email;
        ownerName = empRows[0].employee_name;
      }
    }

    // 3. Fallback: try to resolve employee from c.dg_employee
    if (!ownerEmail && proforma.dg_employee) {
      const dgRows = await new Promise((resolve) => {
        const sql = `
          SELECT employee_name, employee_email
          FROM re_revenue_engine_employees
          WHERE employee_name = ?
          LIMIT 1
        `;
        db.query(sql, [proforma.dg_employee], (err, rows) => resolve(rows || []));
      });
      if (dgRows.length > 0 && dgRows[0].employee_email) {
        ownerEmail = dgRows[0].employee_email;
        ownerName = dgRows[0].employee_name;
      }
    }

    // 4. Ultimate Fallback: Default to RE Owner role
    if (!ownerEmail) {
      const ownerRows = await new Promise((resolve) => {
        const sql = `
          SELECT employee_name, employee_email
          FROM re_revenue_engine_employees
          WHERE employee_role = 'Owner'
          LIMIT 1
        `;
        db.query(sql, (err, rows) => resolve(rows || []));
      });
      if (ownerRows.length > 0 && ownerRows[0].employee_email) {
        ownerEmail = ownerRows[0].employee_email;
        ownerName = ownerRows[0].employee_name;
      }
    }

    if (!ownerEmail) {
      console.warn(`[RE Notification] Could not find any recipient email for proforma #${proformaId}.`);
      return { ok: false, error: "no_owner_email" };
    }

    console.log(`[RE Notification] Sending Project Blocked email to ${ownerName} <${ownerEmail}> for ${finalClientName}`);
    return await sendProjectBlockedAlertEmail({
      to: ownerEmail,
      ownerName,
      clientName: finalClientName,
      proformaNumber: finalProformaNo,
    });
  } catch (err) {
    console.error("[RE Notification] notifyProjectBlocked error:", err.message);
    return { ok: false, error: err.message };
  }
}

module.exports = {
  dispatch,
  notifyProjectBlocked,
};
