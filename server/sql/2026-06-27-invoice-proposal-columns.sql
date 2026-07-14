-- ============================================================
-- Migration: 2026-06-27 — Add proposal flow columns to invoice table
-- SAFE: All new columns default to NULL / 'calculator'
-- Existing calculator invoices are 100% unaffected.
-- ============================================================

ALTER TABLE `invoice`
  ADD COLUMN IF NOT EXISTS `invoice_source` ENUM('calculator','proposal') NOT NULL DEFAULT 'calculator'
      COMMENT 'calculator = old txn flow, proposal = new proposal flow'
      AFTER `id`,

  ADD COLUMN IF NOT EXISTS `proposal_id` INT(11) DEFAULT NULL
      COMMENT 'FK to proposals table (only for proposal flow)'
      AFTER `invoice_source`,

  ADD COLUMN IF NOT EXISTS `proforma_id` INT(11) DEFAULT NULL
      COMMENT 'FK to proposal_proforma table (only for proposal flow)'
      AFTER `proposal_id`,

  ADD COLUMN IF NOT EXISTS `base_amount` DECIMAL(12,2) DEFAULT NULL
      COMMENT 'Net amount before GST — proposal flow only'
      AFTER `bill_type`,

  ADD COLUMN IF NOT EXISTS `gst_rate` DECIMAL(5,2) DEFAULT NULL
      COMMENT 'GST rate e.g. 18.00 — proposal flow only'
      AFTER `base_amount`,

  ADD COLUMN IF NOT EXISTS `gst_amount` DECIMAL(12,2) DEFAULT NULL
      COMMENT 'GST amount — proposal flow only'
      AFTER `gst_rate`,

  ADD COLUMN IF NOT EXISTS `payment_date` DATE DEFAULT NULL
      COMMENT 'Date payment was received'
      AFTER `payment_mode`,

  ADD COLUMN IF NOT EXISTS `payment_reference` VARCHAR(255) DEFAULT NULL
      COMMENT 'UTR / Cheque number / Transaction ID'
      AFTER `payment_date`,

  ADD COLUMN IF NOT EXISTS `pricing_snapshot` LONGTEXT DEFAULT NULL
      COMMENT 'JSON of line items copied from proposal_proforma.pricing_snapshot'
      AFTER `previous_amt`,

  ADD COLUMN IF NOT EXISTS `notes_snapshot` LONGTEXT DEFAULT NULL
      COMMENT 'JSON notes copied from proposal_proforma.notes_snapshot'
      AFTER `pricing_snapshot`,

  ADD COLUMN IF NOT EXISTS `terms_snapshot` LONGTEXT DEFAULT NULL
      COMMENT 'JSON terms copied from proposal_proforma.terms_snapshot'
      AFTER `notes_snapshot`;

-- Foreign Keys (run separately if above succeeds)
ALTER TABLE `invoice`
  ADD CONSTRAINT `fk_invoice_proposal_id`
      FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_invoice_proforma_id`
      FOREIGN KEY (`proforma_id`) REFERENCES `proposal_proforma`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
