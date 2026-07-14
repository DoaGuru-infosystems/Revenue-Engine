const cron = require("node-cron");
const { db } = require("../connect");
const moment = require("moment-timezone");
const {
  sendDailyPaymentSummaryEmail,
  TZ,
} = require("./sendEmails");
const {
  sendPeriodicPaymentSummaryWA,
} = require("./sendWhatsApp");



function runQuery(sql, params) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function runPeriodicPaymentSummary() {
  const now = moment().tz(TZ || "Asia/Kolkata");
  const dateStr = now.format("DD MMM YYYY");
  console.log(
    `[CRON] Running Periodic Payment Summary at ${now.format("YYYY-MM-DD HH:mm:ss")}`,
  );

  try {
    // We need to fetch clients who have outstanding amounts.
    // The outstanding amount is tracked in the `invoice` table (`current_amt`).
    // Since current_amt stores the balance AFTER the invoice is generated,
    // we should only consider the current_amt of the LATEST invoice per project/proforma.
    
    const invoices = await runQuery("SELECT bill_number, client_id, proforma_id, current_amt, created_at FROM invoice ORDER BY created_at DESC", []);
    const clients = await runQuery("SELECT id, client_name, client_organization FROM revenue_engine_client_details", []);
    
    const clientMap = {};
    clients.forEach(c => clientMap[c.id] = c);

    const seenProformas = new Set();
    const clientPendingMap = {}; // Maps client_id to { pending_amt, invoices: [] }

    invoices.forEach(inv => {
      const pid = inv.proforma_id || inv.client_id;
      if (!seenProformas.has(pid)) {
        seenProformas.add(pid);
        
        if (Number(inv.current_amt) > 0) {
          if (!clientPendingMap[inv.client_id]) {
            clientPendingMap[inv.client_id] = { pending_amt: 0, invoices: [] };
          }
          clientPendingMap[inv.client_id].pending_amt += Number(inv.current_amt);
          clientPendingMap[inv.client_id].invoices.push(inv.bill_number);
        }
      }
    });

    const pendingClientsIds = Object.keys(clientPendingMap);

    if (pendingClientsIds.length === 0) {
      console.log(
        "[CRON] No pending payments found. Skipping Admin Notification.",
      );
      return;
    }

    let totalOutstanding = 0;
    let clientListStr = "";

    pendingClientsIds.forEach((clientId) => {
      const clientInfo = clientMap[clientId];
      if (!clientInfo) return;

      const amt = clientPendingMap[clientId].pending_amt;
      totalOutstanding += amt;
      const orgName = clientInfo.client_organization
        ? ` (${clientInfo.client_organization})`
        : "";
      const invStr = ` | Invoice: ${clientPendingMap[clientId].invoices.join(', ')}`;
      clientListStr += `• ${clientInfo.client_name}${orgName}: ₹${amt}${invStr}\n`;
    });

    console.log(`[CRON] Total Outstanding: ₹${totalOutstanding}`);

    // Send notifications
    await sendDailyPaymentSummaryEmail({
      dateStr,
      totalOutstanding,
      clientListStr,
    });

    await sendPeriodicPaymentSummaryWA({
      dateStr,
      totalOutstanding,
      clientListStr,
    });

    console.log("[CRON] Periodic Payment Summary Sent.");
  } catch (error) {
    console.error(
      "[CRON ERROR] Periodic Payment Summary failed:",
      error.message,
    );
  }
}

// Run every 5 days at 10:30 AM
// Note: */5 means every 5th day of the month (e.g. 1st, 6th, 11th, 16th, etc.)
cron.schedule("30 10 */5 * *", runPeriodicPaymentSummary, {
  timezone: TZ || "Asia/Kolkata",
});

// Optional: for manual testing uncomment this
// setTimeout(runPeriodicPaymentSummary, 10000);
