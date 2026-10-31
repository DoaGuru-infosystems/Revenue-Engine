-- Migration: Revenue Engine to SF Sync and Outbox/Inbox
-- Date: 2026-10-31

CREATE TABLE IF NOT EXISTS `re_project_sync` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `proforma_id` INT(11) NOT NULL,
  `txn_id` VARCHAR(255) DEFAULT NULL,
  `sf_project_id` VARCHAR(100) DEFAULT NULL,
  `assigned_by_employee_id` INT(11) NOT NULL,
  `assigned_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `current_status` VARCHAR(100) DEFAULT 'assigned',
  `last_status_update_at` TIMESTAMP NULL DEFAULT NULL,
  `last_status_payload` LONGTEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_proforma` (`proforma_id`),
  CONSTRAINT `fk_rps_proforma` FOREIGN KEY (`proforma_id`) REFERENCES `re_proposal_proforma` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rps_employee` FOREIGN KEY (`assigned_by_employee_id`) REFERENCES `re_revenue_engine_employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `re_webhook_outbox` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `event_type` VARCHAR(100) NOT NULL,
  `payload` LONGTEXT NOT NULL,
  `status` ENUM('pending','sent','failed') DEFAULT 'pending',
  `attempts` INT(11) DEFAULT 0,
  `last_error` TEXT DEFAULT NULL,
  `idempotency_key` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sent_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_idempotency` (`idempotency_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `re_webhook_inbox_log` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `event_type` VARCHAR(100) NOT NULL,
  `idempotency_key` VARCHAR(255) NOT NULL,
  `payload` LONGTEXT NOT NULL,
  `received_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `processed` TINYINT(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_in_idempotency` (`idempotency_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

