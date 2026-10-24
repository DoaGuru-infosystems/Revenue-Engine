-- ==============================================================================
-- Quotation Flow Migration
-- Date: 2026-10-24
-- Purpose: Add re_quotation, re_quotation_services, re_quotation_ads tables.
--          Make re_proposal_proforma.proposal_id nullable and add quotation_id.
-- Safe to execute: Uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS / INSERT IGNORE
-- ==============================================================================

-- 1. Main quotation header table
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
  public_token_hash    VARCHAR(64) DEFAULT NULL,
  public_token_expires DATETIME DEFAULT NULL,
  public_snapshot_json LONGTEXT DEFAULT NULL,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_qtn_client (client_id),
  INDEX idx_qtn_status (status),
  INDEX idx_qtn_txn    (txn_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Quotation services (one row per graphic/SEO calculator entry)
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Quotation ads (one row per ads campaign calculator entry)
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Seed QTN counter (idempotent — INSERT IGNORE skips if already exists)
INSERT IGNORE INTO re_proforma_counters (counter_type, current_number)
VALUES ('QTN', 0);

-- 5. Make proposal_id nullable on re_proposal_proforma
--    (Existing rows keep their proposal_id value; NULL means quotation-sourced)
ALTER TABLE re_proposal_proforma
  MODIFY COLUMN proposal_id INT DEFAULT NULL;

-- 6. Add nullable quotation_id column + index
ALTER TABLE re_proposal_proforma
  ADD COLUMN IF NOT EXISTS quotation_id INT DEFAULT NULL,
  ADD INDEX IF NOT EXISTS idx_pf_quotation_id (quotation_id);

-- ==============================================================================
-- DONE — Run once on MySQL. Server restart not required for schema-only changes.
-- ==============================================================================
