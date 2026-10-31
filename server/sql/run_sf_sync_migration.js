/**
 * Migration runner for 2026-10-31-re-sf-sync.sql
 * Run manually via: node server/sql/run_sf_sync_migration.js
 */
const { db } = require('../connect');

const createProjectSyncSQL = `
CREATE TABLE IF NOT EXISTS re_project_sync (
  id INT(11) NOT NULL AUTO_INCREMENT,
  proforma_id INT(11) NOT NULL,
  txn_id VARCHAR(255) DEFAULT NULL,
  sf_project_id VARCHAR(100) DEFAULT NULL,
  assigned_by_employee_id INT(11) NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  current_status VARCHAR(100) DEFAULT 'assigned',
  last_status_update_at TIMESTAMP NULL DEFAULT NULL,
  last_status_payload LONGTEXT DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_proforma (proforma_id),
  CONSTRAINT fk_rps_proforma FOREIGN KEY (proforma_id) REFERENCES re_proposal_proforma (id) ON DELETE CASCADE,
  CONSTRAINT fk_rps_employee FOREIGN KEY (assigned_by_employee_id) REFERENCES re_revenue_engine_employees (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

const createOutboxSQL = `
CREATE TABLE IF NOT EXISTS re_webhook_outbox (
  id INT(11) NOT NULL AUTO_INCREMENT,
  event_type VARCHAR(100) NOT NULL,
  payload LONGTEXT NOT NULL,
  status ENUM('pending','sent','failed') DEFAULT 'pending',
  attempts INT(11) DEFAULT 0,
  last_error TEXT DEFAULT NULL,
  idempotency_key VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_idempotency (idempotency_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

const createInboxLogSQL = `
CREATE TABLE IF NOT EXISTS re_webhook_inbox_log (
  id INT(11) NOT NULL AUTO_INCREMENT,
  event_type VARCHAR(100) NOT NULL,
  idempotency_key VARCHAR(255) NOT NULL,
  payload LONGTEXT NOT NULL,
  received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed TINYINT(1) DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_in_idempotency (idempotency_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

async function run() {
  console.log('[MIGRATION] Running re-sf-sync tables migration...');

  db.query(createProjectSyncSQL, (err1) => {
    if (err1) {
      console.error('[MIGRATION ERROR] re_project_sync creation failed:', err1.message);
      process.exit(1);
    }
    console.log('[MIGRATION SUCCESS] re_project_sync ready.');

    db.query(createOutboxSQL, (err2) => {
      if (err2) {
        console.error('[MIGRATION ERROR] re_webhook_outbox creation failed:', err2.message);
        process.exit(1);
      }
      console.log('[MIGRATION SUCCESS] re_webhook_outbox ready.');

      db.query(createInboxLogSQL, (err3) => {
        if (err3) {
          console.error('[MIGRATION ERROR] re_webhook_inbox_log creation failed:', err3.message);
          process.exit(1);
        }
        console.log('[MIGRATION SUCCESS] re_webhook_inbox_log ready.');
        console.log('[MIGRATION COMPLETE] All SF sync tables created successfully.');
        process.exit(0);
      });
    });
  });
}

run();

