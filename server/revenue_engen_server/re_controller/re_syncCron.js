const cron = require("node-cron");
const { processPendingOutboxEvents } = require("../re_services/re_webhookSender");

// Every 2 minutes, attempt to drain the outbox
cron.schedule("*/2 * * * *", () => {
  processPendingOutboxEvents().catch((err) => {
    console.error("[CRON ERROR] Outbox processor failed:", err.message);
  });
});

module.exports = { processPendingOutboxEvents };

