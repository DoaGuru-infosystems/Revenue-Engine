// LOCAL CODE 

const cron = require("node-cron");
const { db } = require("../../connect");
const moment = require("moment-timezone");
const {
  sendDailyPaymentSummaryEmail,
  sendMeetingReminderEmail,
  TZ,
} = require("./re_sendEmails");
const {
  sendPeriodicPaymentSummaryWA,
  sendMeetingReminderWA,
} = require("./re_sendWhatsApp");
const {
  getOwnerContact,
  getManagerContact,
  getTeamLeadByTeam,
} = require("./re_reminderSettingsController");



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
    // The outstanding amount is tracked in the `re_invoice` table (`current_amt`).
    // Since current_amt stores the balance AFTER the re_invoice is generated,
    // we should only consider the current_amt of the LATEST re_invoice per project/proforma.
    
    const invoices = await runQuery("SELECT bill_number, client_id, proforma_id, current_amt, created_at FROM re_invoice ORDER BY created_at DESC", []);
    const clients = await runQuery("SELECT id, client_name, client_organization FROM re_revenue_engine_client_details", []);
    
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

// ─────────────────────────────────────────────────────────────
// MEETING REMINDER DISPATCHER
// ─────────────────────────────────────────────────────────────
async function runMeetingReminders() {
  const now = moment().tz(TZ || "Asia/Kolkata");
  console.log(`[MEETING CRON] Running Meeting Reminders at ${now.format("YYYY-MM-DD HH:mm:ss")}`);

  try {
    const q = `
      SELECT p.id, p.proforma_number, p.client_id, p.assigned_team, p.duration_end_date,
             p.meeting_status, p.meeting_rescheduled_date, p.last_meeting_reminder_sent_at,
             c.client_name, c.client_organization
      FROM re_proposal_proforma p
      LEFT JOIN re_revenue_engine_client_details c ON p.client_id = c.id
      WHERE (p.meeting_status IS NULL OR p.meeting_status NOT IN ('done', 'cancelled'))
        AND (
          (p.meeting_status = 'rescheduled' AND p.meeting_rescheduled_date IS NOT NULL)
          OR (p.duration_end_date IS NOT NULL)
        )
    `;

    const proformas = await runQuery(q, []);
    if (!proformas || proformas.length === 0) {
      console.log("[MEETING CRON] No active proformas with duration dates found.");
      return;
    }

    // Fetch Owner & Manager contacts
    const owner = await getOwnerContact();
    const manager = await getManagerContact();

    let reminderCount = 0;

    for (const pf of proformas) {
      const isRescheduled = pf.meeting_status === "rescheduled" && pf.meeting_rescheduled_date;
      const targetDateStr = isRescheduled ? pf.meeting_rescheduled_date : pf.duration_end_date;
      if (!targetDateStr) continue;

      const targetDate = moment.tz(targetDateStr, TZ || "Asia/Kolkata").startOf("day");
      const today = now.clone().startOf("day");
      const diffDays = targetDate.diff(today, "days");

      // Requirement: Within 7 days prior up to and including the exact End Date (0 to 7 days)
      if (diffDays >= 0 && diffDays <= 7) {
        reminderCount++;
        const proformaNo = pf.proforma_number || `PROF-${pf.id}`;
        const clientName = pf.client_name || "Valued Client";
        const assignedTeam = pf.assigned_team || "General";
        const meetingDateFormatted = targetDate.format("DD MMMM YYYY");
        const daysLeftText = diffDays === 0 ? "Today (Final Date)" : `${diffDays} Day${diffDays > 1 ? "s" : ""} Left`;

        // 1. Send to Owner
        if (owner) {
          if (owner.email) {
            await sendMeetingReminderEmail({
              to: owner.email,
              recipientName: owner.name,
              roleLabel: "Company Owner",
              clientName,
              proformaNo,
              assignedTeam,
              meetingDate: meetingDateFormatted,
              daysLeft: daysLeftText,
            });
          }
          if (owner.phone) {
            await sendMeetingReminderWA({
              toPhone: owner.phone,
              recipientName: owner.name,
              clientName,
              proformaNo,
              assignedTeam,
              meetingDate: meetingDateFormatted,
              daysLeft: daysLeftText,
            });
          }
        }

        // 2. Send to Manager (if configured)
        if (manager) {
          if (manager.email) {
            await sendMeetingReminderEmail({
              to: manager.email,
              recipientName: manager.name,
              roleLabel: "Project Manager",
              clientName,
              proformaNo,
              assignedTeam,
              meetingDate: meetingDateFormatted,
              daysLeft: daysLeftText,
            });
          }
          if (manager.phone) {
            await sendMeetingReminderWA({
              toPhone: manager.phone,
              recipientName: manager.name,
              clientName,
              proformaNo,
              assignedTeam,
              meetingDate: meetingDateFormatted,
              daysLeft: daysLeftText,
            });
          }
        }

        // 3. Send to Assigned Team Lead (if assigned)
        if (assignedTeam) {
          const tl = await getTeamLeadByTeam(assignedTeam);
          if (tl) {
            if (tl.email) {
              await sendMeetingReminderEmail({
                to: tl.email,
                recipientName: tl.name,
                roleLabel: `Team Lead (${tl.team_name})`,
                clientName,
                proformaNo,
                assignedTeam: tl.team_name,
                meetingDate: meetingDateFormatted,
                daysLeft: daysLeftText,
              });
            }
            if (tl.phone) {
              await sendMeetingReminderWA({
                toPhone: tl.phone,
                recipientName: tl.name,
                clientName,
                proformaNo,
                assignedTeam: tl.team_name,
                meetingDate: meetingDateFormatted,
                daysLeft: daysLeftText,
              });
            }
          }
        }

        // Update timestamp on proforma
        await runQuery("UPDATE re_proposal_proforma SET last_meeting_reminder_sent_at = NOW() WHERE id = ?", [pf.id]);
      }
    }

    console.log(`[MEETING CRON] Completed meeting reminder dispatch. ${reminderCount} proformas processed.`);
  } catch (err) {
    console.error("[MEETING CRON ERROR] Failed meeting reminder dispatch:", err.message);
  }
}

// ─────────────────────────────────────────────────────────────
// CRON SCHEDULES: 10:00 AM, 12:00 PM, 03:00 PM (Daily)
// ─────────────────────────────────────────────────────────────
cron.schedule("0 10 * * *", runMeetingReminders, { timezone: TZ || "Asia/Kolkata" });
cron.schedule("0 12 * * *", runMeetingReminders, { timezone: TZ || "Asia/Kolkata" });
cron.schedule("0 15 * * *", runMeetingReminders, { timezone: TZ || "Asia/Kolkata" });

module.exports = {
  runPeriodicPaymentSummary,
  runMeetingReminders,
};
