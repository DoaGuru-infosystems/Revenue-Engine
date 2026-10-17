-- Migration: Add missing previous balance and carry forward columns
-- Date: 2026-10-17

-- 1. Proforma Table
ALTER TABLE re_proposal_proforma 
  ADD COLUMN IF NOT EXISTS previous_balance_amount DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_carried_forward TINYINT(1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS carried_into_proforma_id INT(11) DEFAULT NULL;

-- 2. Invoice Table
ALTER TABLE re_invoice 
  ADD COLUMN IF NOT EXISTS previous_balance_amount DECIMAL(10,2) DEFAULT 0;

-- 3. Balance Proforma Table
ALTER TABLE re_balance_proforma 
  ADD COLUMN IF NOT EXISTS previous_balance_amount DECIMAL(10,2) DEFAULT 0;
