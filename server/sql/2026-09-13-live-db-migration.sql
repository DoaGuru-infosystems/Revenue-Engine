-- ==============================================================================
-- Live Database Migration Script
-- Date: 2026-09-13
-- Purpose: Schema updates for Proforma Numbering, Balance Proformas & Statuses
-- Safe to execute: Uses 'IF NOT EXISTS' and 'INSERT IGNORE'
-- ==============================================================================

-- 1. Create table: re_balance_proforma (for partial payment balance proforma records)
CREATE TABLE IF NOT EXISTS re_balance_proforma (
  id                           INT AUTO_INCREMENT PRIMARY KEY,
  balance_number               INT NOT NULL,
  balance_proforma_number      VARCHAR(50) NOT NULL,
  source_proforma_id           INT NOT NULL,
  client_id                    INT NOT NULL,
  is_gst                       TINYINT(1) DEFAULT 0,
  pricing_snapshot             LONGTEXT,
  ads_snapshot                 LONGTEXT,
  discount_snapshot            TEXT,
  notes_snapshot               LONGTEXT,
  terms_snapshot               LONGTEXT,
  remarks_snapshot             TEXT,
  client_instructions_snapshot TEXT,
  duration_start_date          DATE,
  duration_end_date            DATE,
  show_google_ad               TINYINT(1) DEFAULT 1,
  show_meta_ad                 TINYINT(1) DEFAULT 1,
  total_amount                 DECIMAL(12,2) DEFAULT 0.00,
  received_amount              DECIMAL(12,2) DEFAULT 0.00,
  current_balance              DECIMAL(12,2) DEFAULT 0.00,
  created_by                   VARCHAR(200),
  created_at                   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_source_proforma (source_proforma_id),
  INDEX idx_client (client_id),
  INDEX idx_balance_number (balance_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Create table: re_proforma_counters (for concurrency-safe sequential proforma numbering)
CREATE TABLE IF NOT EXISTS re_proforma_counters (
  counter_type   VARCHAR(50) NOT NULL PRIMARY KEY,
  current_number INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Seed initial counters (will not overwrite if already initialized)
INSERT IGNORE INTO re_proforma_counters (counter_type, current_number)
VALUES
  ('PROF',     0),
  ('BAL_PROF', 0);

-- 4. Update table: re_proposal_proforma (add proforma_number and payment_status)
ALTER TABLE re_proposal_proforma
  ADD COLUMN IF NOT EXISTS proforma_number VARCHAR(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';

-- 5. Add index on proforma_number for fast lookup
ALTER TABLE re_proposal_proforma
  ADD INDEX IF NOT EXISTS idx_proforma_number (proforma_number);

-- 6. Update table: re_proposals status ENUM (adds 'partially_paid' to valid statuses)
ALTER TABLE re_proposals
  MODIFY COLUMN status ENUM(
    'draft',
    'approved',
    'sent',
    'proforma_generated',
    'proforma_sent',
    'payment_awaited',
    'payment_received',
    'partially_paid',
    'invoiced',
    'submitted',
    'admin_reviewed',
    'client_sent',
    'client_approved',
    'client_rejected',
    'changes',
    'rejected'
  ) DEFAULT 'draft';

-- 7. Ensure re_notes_bydefault table exists
CREATE TABLE IF NOT EXISTS re_notes_bydefault (
  id INT AUTO_INCREMENT PRIMARY KEY,
  note_text VARCHAR(1000) NOT NULL,
  created_at VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
