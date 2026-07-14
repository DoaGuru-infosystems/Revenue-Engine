-- ============================================================
-- Migration: 2026-06-29 — Proposal-to-Legacy-Invoice wiring
-- Adds txn_id to proposals and proposal_proforma tables.
-- invoice table already has invoice_source and proforma_id
-- from a prior migration (2026-06-27-invoice-proposal-columns.sql).
-- ============================================================

-- Add txn_id to proposals table
-- Generated once on the frontend (Date.now().toString()) at proposal creation
ALTER TABLE proposals
  ADD COLUMN txn_id VARCHAR(255) DEFAULT NULL AFTER client_id;

-- Add txn_id to proposal_proforma table
-- Copied from proposals.txn_id when proforma is created
ALTER TABLE proposal_proforma
  ADD COLUMN txn_id VARCHAR(255) DEFAULT NULL AFTER client_id;

-- NOTE: invoice.invoice_source and invoice.proforma_id already exist.
-- No changes needed to the invoice table.
