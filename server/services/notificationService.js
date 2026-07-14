const { 
  sendFinalInvoiceEmail, 
  sendInvoiceAdminNotifyEmail,
  sendPaymentReceivedAlertEmail 
} = require("../controller/sendEmails");

const { 
  sendInvoiceWhatsApp, 
  sendInvoiceAdminNotifyWA,
  sendPaymentReceivedAlertWA 
} = require("../controller/sendWhatsApp");

/**
 * Handles dispatching notifications for the FINAL_INVOICE event.
 * Uses Promise.allSettled to ensure that individual failures do not block other channels.
 */
async function handleFinalInvoice(payload) {
  const { clientEmail, clientPhone, clientName, txnId, invoiceLink, adminAmount, adminTimeStr } = payload;

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
    })
  ]);

  // Map the settled results to a clean boolean status object
  const getStatus = (res) => res.status === "fulfilled" && res.value?.ok === true;

  return {
    clientEmail: getStatus(results[0]),
    clientWhatsapp: getStatus(results[1]),
    adminEmail: getStatus(results[2]),
    adminWhatsapp: getStatus(results[3]),
  };
}


async function handlePaymentAlert(payload) {
  const {
    clientEmail, clientName, orgName, clientId, invoiceNo, invoiceDate,
    paymentDate, amountReceived, paymentMode, invoiceTotal,
    previousBalance, tdsApplicable, tdsDeducted, netCredited,
    totalReceivedTillDate, pendingOutstanding
  } = payload;

  const results = await Promise.allSettled([
    sendPaymentReceivedAlertEmail({
      clientName, orgName, clientId, invoiceNo, invoiceDate,
      paymentDate, amountReceived, paymentMode, invoiceTotal,
      previousBalance, tdsApplicable, tdsDeducted, netCredited,
      totalReceivedTillDate, pendingOutstanding
    }),
    sendPaymentReceivedAlertWA({
      clientName, orgName, clientId, invoiceNo, invoiceDate,
      paymentDate, amountReceived, paymentMode, invoiceTotal,
      previousBalance, tdsApplicable, tdsDeducted, netCredited,
      totalReceivedTillDate, pendingOutstanding
    })
  ]);

  const getStatus = (res) => res.status === "fulfilled" && res.value?.ok === true;

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
    console.error(`[NOTIFICATION_SERVICE] No handler found for event: ${event}`);
    return { error: "Unknown Event" };
  }

  try {
    return await handler(payload);
  } catch (error) {
    console.error(`[NOTIFICATION_SERVICE] Critical error in handler ${event}:`, error);
    return { error: error.message };
  }
}

module.exports = {
  dispatch,
};
