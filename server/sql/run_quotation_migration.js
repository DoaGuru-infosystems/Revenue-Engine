/**
 * Migration runner: Quotation Flow Tables
 * Date: 2026-10-24
 * Run once: node server/sql/run_quotation_migration.js
 */
const { db } = require('../connect');

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

async function migrate() {
  try {
    // ─── 1. re_quotation ──────────────────────────────────────────────────────
    await runQuery(`
      CREATE TABLE IF NOT EXISTS re_quotation (
        id                   INT AUTO_INCREMENT PRIMARY KEY,
        client_id            INT NOT NULL,
        quotation_number     VARCHAR(50) NOT NULL,
        txn_id               VARCHAR(100) NOT NULL,
        status               ENUM(
          'draft','sent','approved','changes','rejected',
          'client_approved','proforma_generated',
          'payment_awaited','partially_paid','paid','invoiced'
        ) DEFAULT 'draft',
        grand_total_excl_gst DECIMAL(12,2) DEFAULT 0.00,
        discount_json        TEXT DEFAULT NULL,
        notes_json           LONGTEXT DEFAULT NULL,
        created_by           VARCHAR(200),
        created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_qtn_client (client_id),
        INDEX idx_qtn_status (status),
        INDEX idx_qtn_txn    (txn_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ re_quotation table ready.');

    // ─── 2. re_quotation_services ─────────────────────────────────────────────
    await runQuery(`
      CREATE TABLE IF NOT EXISTS re_quotation_services (
        id                   INT AUTO_INCREMENT PRIMARY KEY,
        quotation_id         INT NOT NULL,
        service_name         VARCHAR(255) DEFAULT NULL,
        category_name        VARCHAR(255) DEFAULT NULL,
        editing_type_name    VARCHAR(255) DEFAULT NULL,
        editing_type_amount  DECIMAL(12,2) DEFAULT 0.00,
        quantity             INT DEFAULT 1,
        additional_services  LONGTEXT DEFAULT NULL,
        total_amount         DECIMAL(12,2) DEFAULT 0.00,
        source               VARCHAR(50) DEFAULT 'graphic',
        created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_qsvc_quotation (quotation_id),
        CONSTRAINT fk_qsvc_quotation
          FOREIGN KEY (quotation_id) REFERENCES re_quotation(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ re_quotation_services table ready.');

    // ─── 3. re_quotation_ads ──────────────────────────────────────────────────
    await runQuery(`
      CREATE TABLE IF NOT EXISTS re_quotation_ads (
        id                   INT AUTO_INCREMENT PRIMARY KEY,
        quotation_id         INT NOT NULL,
        category_name        VARCHAR(255) DEFAULT NULL,
        budget               DECIMAL(12,2) DEFAULT 0.00,
        percent              DECIMAL(5,2)  DEFAULT 0.00,
        charge               DECIMAL(12,2) DEFAULT 0.00,
        total                DECIMAL(12,2) DEFAULT 0.00,
        created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_qads_quotation (quotation_id),
        CONSTRAINT fk_qads_quotation
          FOREIGN KEY (quotation_id) REFERENCES re_quotation(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ re_quotation_ads table ready.');

    // ─── 4. QTN counter (idempotent) ──────────────────────────────────────────
    await runQuery(
      `INSERT IGNORE INTO re_proforma_counters (counter_type, current_number) VALUES (?, ?)`,
      ['QTN', 0]
    );
    console.log('✅ QTN counter seeded (or already existed).');

    // ─── 5. Make proposal_id nullable on re_proposal_proforma ─────────────────
    // Check current nullability
    const cols = await runQuery(`SHOW COLUMNS FROM re_proposal_proforma LIKE 'proposal_id'`);
    if (cols.length > 0 && cols[0].Null === 'NO') {
      await runQuery(`ALTER TABLE re_proposal_proforma MODIFY COLUMN proposal_id INT DEFAULT NULL`);
      console.log('✅ re_proposal_proforma.proposal_id made nullable.');
    } else {
      console.log('ℹ️  re_proposal_proforma.proposal_id already nullable, skipping.');
    }

    // ─── 6. Add quotation_id column + index ───────────────────────────────────
    const pfCols = await runQuery(`SHOW COLUMNS FROM re_proposal_proforma`);
    const pfColNames = pfCols.map(c => c.Field);

    if (!pfColNames.includes('quotation_id')) {
      await runQuery(`ALTER TABLE re_proposal_proforma ADD COLUMN quotation_id INT DEFAULT NULL`);
      console.log('✅ Added quotation_id column to re_proposal_proforma.');
    } else {
      console.log('ℹ️  quotation_id column already exists.');
    }

    // Add index if missing
    const indexes = await runQuery(`SHOW INDEX FROM re_proposal_proforma WHERE Key_name = 'idx_pf_quotation_id'`);
    if (indexes.length === 0) {
      await runQuery(`ALTER TABLE re_proposal_proforma ADD INDEX idx_pf_quotation_id (quotation_id)`);
      console.log('✅ Added index idx_pf_quotation_id.');
    } else {
      console.log('ℹ️  Index idx_pf_quotation_id already exists.');
    }

    const qtnCols = await runQuery(`SHOW COLUMNS FROM re_quotation`);
    const qtnColNames = qtnCols.map((c) => c.Field);
    if (!qtnColNames.includes('public_token_hash')) {
      await runQuery(`ALTER TABLE re_quotation ADD COLUMN public_token_hash VARCHAR(64) DEFAULT NULL`);
      console.log('✅ Added re_quotation.public_token_hash.');
    }
    if (!qtnColNames.includes('public_token_expires')) {
      await runQuery(`ALTER TABLE re_quotation ADD COLUMN public_token_expires DATETIME DEFAULT NULL`);
      console.log('✅ Added re_quotation.public_token_expires.');
    }
    if (!qtnColNames.includes('public_snapshot_json')) {
      await runQuery(`ALTER TABLE re_quotation ADD COLUMN public_snapshot_json LONGTEXT DEFAULT NULL`);
      console.log('✅ Added re_quotation.public_snapshot_json.');
    }

    console.log('\n🎉 Quotation flow migration complete!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
