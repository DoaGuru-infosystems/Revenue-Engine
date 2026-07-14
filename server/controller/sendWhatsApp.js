const axios = require("axios");

// ENV
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID; // e.g. 123456789012345
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

// ─────────────────────────────────────────────────────────────
// INVOICE WHATSAPP
// ─────────────────────────────────────────────────────────────
async function sendInvoiceWhatsApp({ toPhone, clientName, txnId, link }) {
  const components = [
    {
      type: "body",
      parameters: [
        { type: "text", text: String(clientName || "N/A") },
        { type: "text", text: String(txnId || "N/A") },
        { type: "text", text: String(link || "-") },
      ],
    },
  ];

  return sendWhatsAppTemplate({
    to: toPhone,
    templateName: "client_payment_invoice",
    components,
    lang: "en",
  });
}

// ─────────────────────────────────────────────────────────────
// PROPOSAL WHATSAPP
// ─────────────────────────────────────────────────────────────
async function sendProposalWhatsApp({
  toPhone,
  clientName,
  clientId,
  proposalId,
  link,
}) {
  const components = [
    {
      type: "body",
      parameters: [
        { type: "text", text: String(clientName || "N/A") },
        { type: "text", text: String(clientId || "N/A") },
        { type: "text", text: String(proposalId || "N/A") },
        { type: "text", text: String(link || "-") },
      ],
    },
  ];

  return sendWhatsAppTemplate({
    to: toPhone,
    templateName: "client_marketing_dm",
    components,
    lang: "en",
  });
}

// If you're unsure which translation exists, we can try the list below in order
const DEFAULT_LANG_FALLBACK = ["en_US", "en", "hi"];

function normalizeMsisdn(v) {
  if (!v) return null;
  const digits = String(v).replace(/\D/g, "");
  if (!digits) return null;
  // If Indian 10-digit, prefix 91
  if (digits.length === 10) return `91${digits}`;
  // If already looks like E.164 without '+', pass through (e.g., 91xxxxxxxxxx)
  return digits;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function postToGraph(payload) {
  const url = `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`;

  console.log("WhatsApp URL:", url);
  console.log("Payload:", JSON.stringify(payload, null, 2));

  const https = require("https");
  return axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    timeout: 15000,
    validateStatus: () => true,
    httpsAgent: new https.Agent({ family: 4 }), // Force IPv4 resolution
  });
}

async function sendOnce({ to, templateName, components, lang }) {
  const msisdn = normalizeMsisdn(to);
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    return {
      ok: false,
      error: new Error("Missing PHONE_NUMBER_ID/ACCESS_TOKEN"),
    };
  }
  if (!msisdn) return { ok: false, error: new Error("Invalid phone number") };

  const payload = {
    messaging_product: "whatsapp",
    to: msisdn,
    type: "template",
    template: {
      name: templateName,
      language: { code: lang },
      components: components || [],
    },
  };

  const res = await postToGraph(payload);
  if (res.status >= 200 && res.status < 300 && res.data?.messages) {
    return { ok: true, data: res.data };
  }

  // Useful error logs
  const e = res?.data?.error;
  if (e?.code === 190) {
    console.error(
      "[WA] TOKEN ERROR 190:",
      e?.error_subcode,
      e?.error_subcode === 467
        ? "Access token invalidated (use System User token)."
        : "Access token expired/invalid.",
    );
  } else if (e) {
    console.error("[WA] error:", JSON.stringify(e));
  } else {
    console.error("[WA] non-success:", res.status, res?.data);
  }

  return {
    ok: false,
    error: e || new Error(`HTTP ${res.status}`),
    data: res?.data,
  };
}

async function sendWhatsAppTemplate({
  to,
  templateName,
  components,
  lang, // preferred language
  preferLangs, // array of langs to try; falls back to DEFAULT_LANG_FALLBACK
  maxRetries = 2,
}) {
  if (!templateName) throw new Error("templateName required");

  const langs = preferLangs?.length
    ? preferLangs
    : lang
      ? [lang, ...DEFAULT_LANG_FALLBACK.filter((l) => l !== lang)]
      : DEFAULT_LANG_FALLBACK;

  let lastErr = null;

  for (const attemptLang of langs) {
    let attempt = 0;
    while (attempt <= maxRetries) {
      const res = await sendOnce({
        to,
        templateName,
        components,
        lang: attemptLang,
      });
      if (res.ok) {
        const wamid = res?.data?.messages?.[0]?.id;
        console.log(
          `[WA] sent ok: template=${templateName} lang=${attemptLang} to=${to} wamid=${
            wamid || "n/a"
          }`,
        );
        return { ok: true, langUsed: attemptLang, wamid, raw: res.data };
      }

      // Retry only on rate limits / transient errors
      const errCode = res?.data?.error?.code;
      const httpMsg = res?.error?.message || "";
      const isRateOrServer =
        errCode === 4 || // rate limiting
        errCode === 17 || // user rate limit
        /HTTP 5\d{2}/.test(String(httpMsg));

      if (isRateOrServer && attempt < maxRetries) {
        const backoff = 500 * Math.pow(2, attempt); // 500ms, 1000ms, 2000ms...
        console.warn(
          `[WA] retrying (attempt ${
            attempt + 1
          }) after ${backoff}ms for lang=${attemptLang}`,
        );
        await sleep(backoff);
        attempt++;
        continue;
      }

      // If template translation missing (132001), break & try next lang
      const e = res?.data?.error;
      if (e?.code === 132001) {
        console.warn(
          `[WA] template translation missing for lang=${attemptLang}; trying next...`,
        );
        lastErr = res?.error || new Error("Template translation missing");
        break;
      }

      // Other errors: stop trying this lang
      lastErr = res?.error || new Error("Unknown WA error");
      break;
    }
  }

  return { ok: false, error: lastErr };
}

async function sendProposalAdminNotifyWA({
  clientName,
  clientId,
  proposalId,
  sentOn,
  proposalLink,
}) {
  const toPhone = process.env.OWNER_MOBILE_NUMBER;
  if (!toPhone)
    return {
      ok: false,
      error: new Error("OWNER_MOBILE_NUMBER not set in .env"),
    };

  const components = [
    {
      type: "body",
      parameters: [
        { type: "text", text: String(clientName || "N/A") },
        { type: "text", text: String(clientId || "N/A") },
        { type: "text", text: String(proposalId || "N/A") },
        { type: "text", text: String(sentOn || "N/A") },
        { type: "text", text: String(proposalLink || "N/A") },
      ],
    },
  ];

  return sendWhatsAppTemplate({
    to: toPhone,
    templateName: "admin_notification_dm",
    components,
    lang: "en",
  });
}

async function sendPeriodicPaymentSummaryWA({
  dateStr,
  totalOutstanding,
  clientListStr,
}) {
  const toPhone = process.env.OWNER_MOBILE_NUMBER;
  if (!toPhone)
    return {
      ok: false,
      error: new Error("OWNER_MOBILE_NUMBER not set in .env"),
    };

  const components = [
    {
      type: "body",
      parameters: [
        { type: "text", text: String(dateStr) },
        { type: "text", text: String(totalOutstanding) },
        { type: "text", text: String(clientListStr) },
      ],
    },
  ];

  return sendWhatsAppTemplate({
    to: toPhone,
    templateName: "client_payment_remainder",
    components,
    lang: "en",
  });
}

async function sendPaymentReceivedAlertWA({
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
}) {
  const toPhone = process.env.OWNER_MOBILE_NUMBER;
  if (!toPhone)
    return {
      ok: false,
      error: new Error("OWNER_MOBILE_NUMBER not set in .env"),
    };

  const components = [
    {
      type: "body",
      parameters: [
        { type: "text", text: String(clientName || "N/A") },
        { type: "text", text: String(orgName || "N/A") },
        { type: "text", text: String(clientId || "N/A") },
        { type: "text", text: String(invoiceNo || "N/A") },
        { type: "text", text: String(invoiceDate || "N/A") },
        { type: "text", text: String(paymentDate || "N/A") },
        { type: "text", text: String(amountReceived || 0) },
        { type: "text", text: String(paymentMode || "N/A") },
        { type: "text", text: String(invoiceTotal || 0) },
        { type: "text", text: String(previousBalance || 0) },
        { type: "text", text: String(tdsApplicable || "No") },
        { type: "text", text: String(tdsDeducted || 0) },
        { type: "text", text: String(netCredited || 0) },
        { type: "text", text: String(totalReceivedTillDate || 0) },
        { type: "text", text: String(pendingOutstanding || 0) },
      ],
    },
  ];

  return sendWhatsAppTemplate({
    to: toPhone,
    templateName: "client_payment_recieved",
    components,
    lang: "en",
  });
}

async function sendInvoiceAdminNotifyWA({
  clientName,
  invoiceNo,
  amount,
  timeStr,
  link,
}) {
  const toPhone = process.env.OWNER_MOBILE_NUMBER;
  if (!toPhone)
    return {
      ok: false,
      error: new Error("OWNER_MOBILE_NUMBER not set in .env"),
    };

  const components = [
    {
      type: "body",
      parameters: [
        { type: "text", text: String(clientName || "N/A") },
        { type: "text", text: String(invoiceNo || "N/A") },
        { type: "text", text: String(amount || "N/A") },
        { type: "text", text: String(timeStr || "N/A") },
        { type: "text", text: String(link || "-") },
      ],
    },
  ];

  return sendWhatsAppTemplate({
    to: toPhone,
    templateName: "final_invoice_admin_notify",
    components,
    lang: "en",
  });
}

module.exports = {
  sendWhatsAppTemplate,
  sendInvoiceWhatsApp,
  sendProposalWhatsApp,
  sendProposalAdminNotifyWA,
  sendPeriodicPaymentSummaryWA,
  sendPaymentReceivedAlertWA,
  sendInvoiceAdminNotifyWA,
};
