const moment = require("moment-timezone");
const nodemailer = require("nodemailer");
const path = require("path");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAILSENDER,
    pass: process.env.EMAILPASSWORD,
  },
  logger: true,
  debug: true,
});

const TZ = "Asia/Kolkata";

function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || "");
}

// Logo attachment common to all emails
const getLogoAttachment = () => ({
  filename: 'logo.png',
  path: path.join(__dirname, '../../client/public/logo.png'),
  cid: 'logo'
});

// ----------------------------------------------------
// 1. sendProposalEmail (Client Facing - Minimalist Orange Theme)
// ----------------------------------------------------
async function sendProposalEmail({ to, clientName, txnId, proposalLink }) {
  if (!isEmail(to)) return;

  const subject = `Your Proposal is Ready • TXN ${txnId}`;
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9fa; padding: 40px 20px; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <div style="text-align: center; padding: 30px 20px; border-bottom: 3px solid #ea580c;">
          <img src="cid:logo" alt="Revenue Engine" style="height: 50px; width: auto;" />
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="margin: 0 0 20px; color: #111; font-size: 24px; font-weight: 600;">Proposal Ready for Review</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #555;">Hi <b>${clientName || "there"}</b>,</p>
          <p style="font-size: 16px; line-height: 1.6; color: #555;">We have prepared a customized proposal for your project. Please review the details by clicking the link below.</p>
          
          <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; font-size: 14px; color: #9a3412;"><b>Transaction ID:</b> ${txnId}</p>
          </div>

          ${proposalLink ? `
          <div style="text-align: center; margin-top: 35px; margin-bottom: 20px;">
            <a href="${proposalLink}" style="display: inline-block; padding: 14px 32px; background-color: #ea580c; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; letter-spacing: 0.5px;">View Proposal</a>
          </div>
          ` : ""}
        </div>
        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b;">
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} Revenue Engine. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAILSENDER,
      to,
      subject,
      html,
      attachments: [getLogoAttachment()]
    });
    console.log("[MAIL] Proposal sent to:", to);
    return { ok: true };
  } catch (err) {
    console.error("[MAIL ERROR] Proposal sent:", err.message);
    return { ok: false, error: err.message };
  }
}

// ----------------------------------------------------
// 2. sendFinalInvoiceEmail (Client Facing - Formal Dark/Orange Theme)
// ----------------------------------------------------
async function sendFinalInvoiceEmail({ to, clientName, txnId, invoiceLink }) {
  if (!isEmail(to)) return;

  const subject = `Final Invoice • TXN ${txnId}`;
  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #1e293b; padding: 50px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
        <div style="background-color: #0f172a; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <img src="cid:logo" alt="Revenue Engine" style="height: 45px; margin-bottom: 15px;" />
          <h2 style="color: #ffffff; margin: 0; font-weight: 400; letter-spacing: 1px;">FINAL INVOICE</h2>
        </div>
        
        <div style="padding: 40px;">
          <p style="font-size: 16px; color: #334155; margin-top: 0;">Dear <b>${clientName}</b>,</p>
          <p style="font-size: 16px; color: #475569; line-height: 1.6;">Your final invoice for transaction <strong>#${txnId}</strong> has been generated and is ready for your records.</p>
          
          ${invoiceLink ? `
          <div style="margin: 40px 0; text-align: center;">
            <a href="${invoiceLink}" style="display: inline-block; padding: 15px 40px; background-color: #f97316; color: #fff; text-decoration: none; border-radius: 4px; font-weight: bold; text-transform: uppercase; font-size: 14px;">Download / View Invoice</a>
          </div>
          ` : ""}
          
          <p style="font-size: 14px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-bottom: 0;">Thank you for your business.</p>
        </div>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAILSENDER,
      to,
      subject,
      html,
      attachments: [getLogoAttachment()]
    });
    console.log("[MAIL] Final invoice sent to:", to);
    return { ok: true };
  } catch (err) {
    console.error("[MAIL ERROR] Final invoice sent:", err.message);
    return { ok: false, error: err.message };
  }
}

// ----------------------------------------------------
// 3. sendProposalAdminNotifyEmail (Admin Alert - Dark Monospace Vibe)
// ----------------------------------------------------
async function sendProposalAdminNotifyEmail({ clientName, clientId, proposalId, sentOn, proposalLink, pdfBuffer }) {
  const to = process.env.OWNER_EMAIL;
  if (!isEmail(to)) return { ok: false, error: "Invalid OWNER_EMAIL" };

  const subject = `[ADMIN ALERT] Proposal Sent - ${clientName}`;
  const html = `
    <div style="font-family: 'Courier New', Courier, monospace; background-color: #000000; color: #00ffcc; padding: 30px;">
      <div style="max-width: 650px; margin: 0 auto; border: 1px solid #333; padding: 20px; background: #0a0a0a;">
        <div style="margin-bottom: 25px; border-bottom: 1px dashed #333; padding-bottom: 15px;">
          <img src="cid:logo" alt="Logo" style="height: 35px; filter: grayscale(100%) brightness(200%);" />
          <h2 style="color: #ffaa00; margin: 15px 0 0;">SYSTEM ALERT: PROPOSAL SENT</h2>
        </div>
        
        <p style="color: #ccc;">A new proposal has been dispatched to the client. Awaiting client approval.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; color: #fff;">
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #222; width: 150px; color: #888;">CLIENT NAME:</td><td style="border-bottom: 1px solid #222;">${clientName}</td></tr>
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #222; color: #888;">CLIENT ID:</td><td style="border-bottom: 1px solid #222;">${clientId}</td></tr>
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #222; color: #888;">PROPOSAL ID:</td><td style="border-bottom: 1px solid #222;">${proposalId}</td></tr>
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #222; color: #888;">TIMESTAMP:</td><td style="border-bottom: 1px solid #222;">${sentOn}</td></tr>
        </table>

        <div style="margin-top: 25px;">
          <p style="color: #888; margin-bottom: 5px;">PROPOSAL URL:</p>
          <a href="${proposalLink}" style="color: #00ffcc; word-break: break-all;">${proposalLink}</a>
        </div>
      </div>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAILSENDER,
    to,
    subject,
    html,
    attachments: [getLogoAttachment()]
  };

  if (pdfBuffer) {
    mailOptions.attachments.push({
      filename: `Proposal_${proposalId}.pdf`,
      content: pdfBuffer,
      contentType: "application/pdf",
    });
  }

  try {
    await transporter.sendMail(mailOptions);
    return { ok: true };
  } catch (err) {
    console.error("[MAIL ERROR] Proposal Admin Notify:", err.message);
    return { ok: false, error: err.message };
  }
}

// ----------------------------------------------------
// 4. sendDailyPaymentSummaryEmail (Admin Report - Wide Light Blue Table Layout)
// ----------------------------------------------------
async function sendDailyPaymentSummaryEmail({ dateStr, totalOutstanding, clientListStr }) {
  const to = process.env.OWNER_EMAIL;
  if (!isEmail(to)) return { ok: false, error: "Invalid OWNER_EMAIL" };

  const subject = `Daily Payment Summary - ${dateStr}`;
  const formattedClientList = clientListStr.replace(/\\n/g, '<br/>');

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f0f4f8; padding: 40px 20px;">
      <div style="max-width: 800px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-top: 5px solid #3b82f6;">
        <div style="padding: 30px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0;">
          <img src="cid:logo" alt="Logo" style="height: 40px;" />
          <div style="text-align: right;">
            <h2 style="margin: 0; color: #1e293b; font-size: 20px;">Outstanding Report</h2>
            <p style="margin: 5px 0 0; color: #64748b; font-size: 14px;">${dateStr}</p>
          </div>
        </div>
        
        <div style="padding: 30px;">
          <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 30px;">
            <p style="margin: 0; font-size: 14px; color: #3b82f6; font-weight: 600; text-transform: uppercase;">Total Outstanding</p>
            <h1 style="margin: 10px 0 0; color: #1e40af; font-size: 36px;">₹${totalOutstanding}</h1>
          </div>
          
          <h3 style="color: #334155; font-size: 16px; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Client Breakdown</h3>
          <div style="background: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px; line-height: 1.8; color: #475569;">
            ${formattedClientList}
          </div>
        </div>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({ from: process.env.EMAILSENDER, to, subject, html, attachments: [getLogoAttachment()] });
    return { ok: true };
  } catch (err) {
    console.error("[MAIL ERROR] Daily Payment Summary:", err.message);
    return { ok: false, error: err.message };
  }
}

// ----------------------------------------------------
// 5. sendPaymentReceivedAlertEmail (Admin Alert - Green Success Motif)
// ----------------------------------------------------
async function sendPaymentReceivedAlertEmail({
  clientName, orgName, clientId, invoiceNo, invoiceDate, paymentDate, amountReceived, paymentMode,
  invoiceTotal, previousBalance, tdsApplicable, tdsDeducted, netCredited, totalReceivedTillDate, pendingOutstanding
}) {
  const to = process.env.OWNER_EMAIL;
  if (!isEmail(to)) return { ok: false, error: "Invalid OWNER_EMAIL" };

  const subject = `Payment Received Alert - ${clientName}`;
  const html = `
    <div style="font-family: 'Inter', sans-serif; background-color: #f0fdf4; padding: 30px 10px;">
      <div style="max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #bbf7d0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #22c55e; padding: 25px; display: flex; align-items: center; justify-content: space-between;">
          <img src="cid:logo" alt="Logo" style="height: 35px; filter: brightness(0) invert(1);" />
          <div style="color: white; font-weight: bold; font-size: 18px;">PAYMENT LOGGED</div>
        </div>
        
        <div style="padding: 30px;">
          <p style="color: #166534; font-size: 16px; margin-top: 0;"><b>Action Required:</b> Please verify this payment in your bank account.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 25px; font-size: 14px;">
            <tr>
              <td style="padding: 15px; background: #f8fafc; width: 50%; border-right: 2px solid #fff; border-bottom: 2px solid #fff;">
                <p style="margin:0 0 5px; color:#64748b; font-size: 12px;">CLIENT</p>
                <p style="margin:0; font-weight:bold; color:#0f172a;">${clientName} (${clientId})</p>
                <p style="margin:5px 0 0; color:#475569; font-size: 13px;">${orgName || "No Org"}</p>
              </td>
              <td style="padding: 15px; background: #f8fafc; border-bottom: 2px solid #fff;">
                <p style="margin:0 0 5px; color:#64748b; font-size: 12px;">INVOICE</p>
                <p style="margin:0; font-weight:bold; color:#0f172a;">${invoiceNo}</p>
                <p style="margin:5px 0 0; color:#475569; font-size: 13px;">Dated: ${invoiceDate}</p>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 15px; background: #ecfdf5;">
                <p style="margin:0 0 5px; color:#065f46; font-size: 12px;">PAYMENT DETAILS</p>
                <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                  <div>
                    <p style="margin:0; color:#064e3b; font-size: 14px;">Received on ${paymentDate} via ${paymentMode}</p>
                  </div>
                  <div>
                    <h2 style="margin:0; color:#047857; font-size: 28px;">₹${amountReceived}</h2>
                  </div>
                </div>
              </td>
            </tr>
          </table>

          <div style="margin-top: 25px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <p style="margin: 0 0 10px; font-weight: 600; color: #334155; font-size: 14px;">Financial Breakdown</p>
            <table style="width: 100%; font-size: 13px; color: #475569;">
              <tr><td style="padding: 4px 0;">Invoice Total:</td><td style="text-align: right;">₹${invoiceTotal}</td></tr>
              <tr><td style="padding: 4px 0;">Previous Balance:</td><td style="text-align: right;">₹${previousBalance}</td></tr>
              <tr><td style="padding: 4px 0;">TDS Deducted (${tdsApplicable}):</td><td style="text-align: right;">₹${tdsDeducted}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; border-top: 1px dashed #cbd5e1;">Net Credited (Bank):</td><td style="text-align: right; font-weight: bold; border-top: 1px dashed #cbd5e1; color: #15803d;">₹${netCredited}</td></tr>
            </table>
          </div>
          
          <div style="margin-top: 15px; padding: 15px; background: #fff1f2; border-radius: 8px; color: #9f1239; text-align: center; font-weight: bold;">
            Pending Outstanding: ₹${pendingOutstanding}
          </div>
        </div>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({ from: process.env.EMAILSENDER, to, subject, html, attachments: [getLogoAttachment()] });
    return { ok: true };
  } catch (err) {
    console.error("[MAIL ERROR] Payment Received Alert:", err.message);
    return { ok: false, error: err.message };
  }
}

// ----------------------------------------------------
// 6. sendInvoiceAdminNotifyEmail (Admin Alert - Minimalist Status Motif)
// ----------------------------------------------------
async function sendInvoiceAdminNotifyEmail({ clientName, invoiceNo, amount, timeStr, link }) {
  const to = process.env.OWNER_EMAIL;
  if (!to) return { ok: false, error: "OWNER_EMAIL not set" };

  const subject = `Auto-Sent Invoice • ${clientName}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; background-color: #f8fafc;">
      <div style="max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08);">
        <img src="cid:logo" alt="Logo" style="height: 30px; margin-bottom: 30px;" />
        
        <div style="display: inline-block; padding: 6px 12px; background: #dcfce7; color: #166534; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 20px;">✓ AUTO-SENT</div>
        
        <h2 style="margin: 0 0 10px; color: #0f172a; font-size: 22px;">Final Invoice Sent</h2>
        <p style="color: #64748b; font-size: 15px; line-height: 1.5; margin: 0 0 30px;">A final invoice has been dispatched to <strong>${clientName}</strong> following full payment confirmation at ${timeStr}.</p>
        
        <div style="background: #f1f5f9; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
          <p style="margin: 0 0 8px; color: #475569; font-size: 13px;">INVOICE NO</p>
          <p style="margin: 0 0 20px; color: #0f172a; font-weight: 600; font-size: 16px;">${invoiceNo}</p>
          <p style="margin: 0 0 8px; color: #475569; font-size: 13px;">AMOUNT</p>
          <p style="margin: 0; color: #0f172a; font-weight: 600; font-size: 16px;">₹${amount}</p>
        </div>
        
        <a href="${link}" style="display: block; width: 100%; text-align: center; padding: 14px 0; background: #0f172a; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 15px;">View PDF Document</a>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({ from: process.env.EMAILSENDER, to, subject, html, attachments: [getLogoAttachment()] });
    return { ok: true };
  } catch (err) {
    console.error("[MAIL ERROR] Admin Invoice Notify:", err.message);
    return { ok: false, error: err.message };
  }
}

// ----------------------------------------------------
// 7. sendRegistrationOtpEmail (Registration OTP)
// ----------------------------------------------------
async function sendRegistrationOtpEmail({ to, otp }) {
  if (!isEmail(to)) return;

  const subject = `Revenue Engine - Registration Verification Code`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; background-color: #f8fafc;">
      <div style="max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08);">
        <img src="cid:logo" alt="Logo" style="height: 30px; margin-bottom: 30px;" />
        
        <h2 style="margin: 0 0 10px; color: #0f172a; font-size: 22px;">Admin Registration OTP</h2>
        <p style="color: #64748b; font-size: 15px; line-height: 1.5; margin: 0 0 30px;">
          You requested to register as an Owner/Admin on Revenue Engine. Use the code below to verify your email address.
        </p>
        
        <div style="background: #f1f5f9; padding: 20px; border-radius: 12px; margin-bottom: 30px; text-align: center;">
          <p style="margin: 0 0 8px; color: #475569; font-size: 13px; text-transform: uppercase;">Verification Code</p>
          <p style="margin: 0; color: #0f172a; font-weight: 700; font-size: 28px; letter-spacing: 4px;">${otp}</p>
        </div>
        
        <p style="color: #64748b; font-size: 14px; margin: 0 0 10px;">This code is valid for <strong>5 minutes</strong>.</p>
        <p style="color: #94a3b8; font-size: 13px; margin: 0;">If you did not request this, please ignore this email.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({ from: process.env.EMAILSENDER, to, subject, html, attachments: [getLogoAttachment()] });
    return { ok: true };
  } catch (err) {
    console.error("[MAIL ERROR] Registration OTP:", err.message);
    return { ok: false, error: err.message };
  }
}

module.exports = {
  sendFinalInvoiceEmail,
  sendProposalEmail,
  sendProposalAdminNotifyEmail,
  sendDailyPaymentSummaryEmail,
  sendPaymentReceivedAlertEmail,
  sendInvoiceAdminNotifyEmail,
  sendRegistrationOtpEmail,
  TZ,
};