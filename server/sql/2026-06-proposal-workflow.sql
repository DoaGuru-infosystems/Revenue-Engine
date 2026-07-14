-- ============================================================
-- DM Calculator — Proposal Workflow Tables
-- Date: 2026-06-15
-- Run this migration once on your MySQL database
-- ============================================================

-- 1. Proposals table — stores the 13-section proposal data
CREATE TABLE IF NOT EXISTS proposals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  proposal_type ENUM('development', 'digital_marketing') NOT NULL,
  billing_type ENUM('monthly', 'yearly', 'custom') NOT NULL,
  billing_start_date DATE DEFAULT NULL,
  billing_end_date DATE DEFAULT NULL,

  -- All 13 sections stored as structured JSON
  -- Keys: cover_page, executive_summary, about_us, client_problem,
  --        proposed_solution, scope_of_work, strategy_overview,
  --        timeline, expected_results, pricing_investment,
  --        terms_conditions, why_choose_us, approval_acceptance
  sections_json JSON NOT NULL DEFAULT ('{}'),

  -- Optional section toggles
  optional_toggles JSON NOT NULL DEFAULT ('{"strategy_overview":false,"expected_results":false,"why_choose_us":false}'),

  -- Pricing table (array of {service, quantity, unit_price, total_price})
  pricing_table_json JSON NOT NULL DEFAULT ('[]'),
  grand_total_excl_gst DECIMAL(12,2) DEFAULT 0,

  -- Terms & Conditions — stores selected note IDs or text
  terms_notes_json JSON DEFAULT NULL,

  -- Status workflow
  status ENUM('draft','submitted','admin_reviewed','client_sent','client_approved','client_rejected') DEFAULT 'draft',

  -- PDF path (after generation)
  pdf_path VARCHAR(500) DEFAULT NULL,

  created_by VARCHAR(200),
  updated_by VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_client (client_id),
  INDEX idx_status (status),
  INDEX idx_created (created_at)
);

-- 2. Proforma invoices generated from proposals
CREATE TABLE IF NOT EXISTS proposal_proforma (
  id INT AUTO_INCREMENT PRIMARY KEY,
  proposal_id INT NOT NULL,
  client_id INT NOT NULL,
  is_gst BOOLEAN DEFAULT FALSE,
  gst_rate DECIMAL(5,2) DEFAULT 18.00,
  base_amount DECIMAL(12,2) DEFAULT 0,
  gst_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  status ENUM('generated','sent','partially_paid','paid') DEFAULT 'generated',
  pdf_path VARCHAR(500) DEFAULT NULL,
  created_by VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_proposal (proposal_id),
  INDEX idx_client (client_id),
  FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
);

-- 3. Payment records with TDS support
CREATE TABLE IF NOT EXISTS proposal_payment_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  proforma_id INT NOT NULL,
  proposal_id INT NOT NULL,
  client_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  is_gst BOOLEAN DEFAULT FALSE,
  tds_applicable BOOLEAN DEFAULT FALSE,
  tds_percentage DECIMAL(6,2) DEFAULT 0,
  tds_amount DECIMAL(12,2) DEFAULT 0,
  final_amount DECIMAL(12,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_mode VARCHAR(50),
  transaction_reference VARCHAR(255),
  status ENUM('pending_approval','approved','rejected') DEFAULT 'pending_approval',
  approved_by VARCHAR(200),
  remark TEXT,
  created_by VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_proforma (proforma_id),
  INDEX idx_proposal (proposal_id),
  INDEX idx_client (client_id),
  FOREIGN KEY (proforma_id) REFERENCES proposal_proforma(id) ON DELETE CASCADE,
  FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
);

-- ============================================================
-- DONE — Restart server after running this migration
-- ============================================================
