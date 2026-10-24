-- Migration: Separate Ad Budget and Service Amount
-- Date: 2026-10-24

-- 1. Add service_amount and ad_budget_amount to re_proposal_proforma
ALTER TABLE re_proposal_proforma 
  ADD COLUMN IF NOT EXISTS service_amount DECIMAL(12,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS ad_budget_amount DECIMAL(12,2) DEFAULT 0.00;

-- 2. Add realized_service_amount to re_proposal_payment_records
ALTER TABLE re_proposal_payment_records 
  ADD COLUMN IF NOT EXISTS realized_service_amount DECIMAL(15,2) DEFAULT 0.00;
