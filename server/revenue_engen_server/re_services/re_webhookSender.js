const axios = require("axios");
const axiosRetry = require("axios-retry").default || require("axios-retry");
const { db } = require("../../connect");
const moment = require("moment-timezone");
const dotenv = require("dotenv");
dotenv.config();

const TZ = process.env.TZ || "Asia/Kolkata";

// Configure axios instance with axios-retry
const httpClient = axios.create({
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosRetry(httpClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    // Retry on network errors, idempotent errors, or server 5xx errors
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response && error.response.status >= 500)
    );
  },
});

/**
 * Processes up to 20 pending events from re_webhook_outbox.
 */
async function processPendingOutboxEvents() {
  const sfWebhookUrl = process.env.SF_WEBHOOK_URL;
  const sfWebhookSecret = process.env.SF_WEBHOOK_SECRET;

  if (!sfWebhookUrl) {
    // If webhook endpoint is not configured in .env, do not waste DB updates
    return {
      processed: 0,
      message: "SF_WEBHOOK_URL not configured. Outbox processing skipped.",
    };
  }

  return new Promise((resolve, reject) => {
    const fetchSQL = `
      SELECT id, event_type, payload, attempts, idempotency_key
      FROM re_webhook_outbox
      WHERE status = 'pending'
      ORDER BY id ASC
      LIMIT 20
    `;

    db.query(fetchSQL, async (err, rows) => {
      if (err) {
        console.error("[re_webhookSender] Error fetching pending outbox records:", err.message);
        return reject(err);
      }

      if (!rows || rows.length === 0) {
        return resolve({ processed: 0 });
      }

      let successCount = 0;
      let failureCount = 0;

      for (const row of rows) {
        const now = moment().tz(TZ).format("YYYY-MM-DD HH:mm:ss");
        let parsedPayload = null;
        try {
          parsedPayload = typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
        } catch (_) {
          parsedPayload = row.payload;
        }

        try {
          await httpClient.post(sfWebhookUrl, parsedPayload, {
            headers: {
              "Content-Type": "application/json",
              "x-webhook-secret": sfWebhookSecret || "",
              "x-idempotency-key": row.idempotency_key || "",
            },
          });

          // Mark as sent
          const updateSuccessSQL = `
            UPDATE re_webhook_outbox
            SET 
              status = 'sent',
              sent_at = ?,
              attempts = attempts + 1
            WHERE id = ?
          `;
          await new Promise((resQ) => {
            db.query(updateSuccessSQL, [now, row.id], () => resQ());
          });
          successCount++;
        } catch (postErr) {
          const errorMessage = postErr?.response?.data
            ? JSON.stringify(postErr.response.data).slice(0, 500)
            : postErr.message;

          console.error(
            `[re_webhookSender] Failed to dispatch outbox event #${row.id} (${row.event_type}):`,
            errorMessage
          );

          // Mark as failed and update attempts and last error
          const updateFailSQL = `
            UPDATE re_webhook_outbox
            SET 
              status = 'failed',
              attempts = attempts + 1,
              last_error = ?
            WHERE id = ?
          `;
          await new Promise((resQ) => {
            db.query(updateFailSQL, [errorMessage, row.id], () => resQ());
          });
          failureCount++;
        }
      }

      return resolve({
        processed: rows.length,
        success: successCount,
        failed: failureCount,
      });
    });
  });
}

module.exports = {
  processPendingOutboxEvents,
};

