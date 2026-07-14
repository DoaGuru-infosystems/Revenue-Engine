-- Migration: 2026-06-30 - Add txn_id column to proposal_payment_records
-- This column stores the unique milestone invoice txn_id for each payment snapshot
-- Run this once on the live database

ALTER TABLE `proposal_payment_records`
  ADD COLUMN `txn_id` varchar(255) DEFAULT NULL COMMENT 'Unique milestone invoice txn_id for this payment snapshot'
  AFTER `notes`;

-- Also add an index for faster lookups
ALTER TABLE `proposal_payment_records`
  ADD INDEX `idx_txn_id` (`txn_id`);
