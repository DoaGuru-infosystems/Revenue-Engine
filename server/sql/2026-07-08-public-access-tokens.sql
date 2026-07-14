-- ============================================================
-- Public Access Tokens for Invoice/Proforma
-- Date: 2026-07-08
-- Stores SHA-256 hash of JWT (not the raw token)
-- ============================================================

ALTER TABLE `invoice`
  ADD COLUMN IF NOT EXISTS `public_token_hash` VARCHAR(64) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `public_token_expires` DATETIME DEFAULT NULL;

ALTER TABLE `proposal_proforma`
  ADD COLUMN IF NOT EXISTS `public_token_hash` VARCHAR(64) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `public_token_expires` DATETIME DEFAULT NULL;
