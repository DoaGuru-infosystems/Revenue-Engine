-- Migration: Add adjustment_amount and adjustment_snapshot to proforma, balance proforma, and invoice tables

ALTER TABLE re_proposal_proforma 
  ADD COLUMN IF NOT EXISTS adjustment_amount DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS adjustment_snapshot TEXT DEFAULT NULL;

ALTER TABLE re_balance_proforma 
  ADD COLUMN IF NOT EXISTS adjustment_amount DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS adjustment_snapshot TEXT DEFAULT NULL;

ALTER TABLE re_invoice 
  ADD COLUMN IF NOT EXISTS adjustment_amount DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS adjustment_snapshot TEXT DEFAULT NULL;
