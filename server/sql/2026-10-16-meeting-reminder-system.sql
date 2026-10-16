-- Migration: Meeting Reminder System and Message Notification
-- Date: 2026-10-16

CREATE TABLE IF NOT EXISTS `message_notification` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `role` ENUM('owner', 'manager', 'team_lead', 'api_config') NOT NULL,
  `team_name` VARCHAR(255) DEFAULT NULL,
  `name` VARCHAR(255) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `phone_number` VARCHAR(50) DEFAULT NULL,
  `designation` VARCHAR(255) DEFAULT NULL,
  `api_endpoint` TEXT DEFAULT NULL,
  `api_token` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Columns for re_proposal_proforma:
-- assigned_team: Team name to which proforma is assigned
-- meeting_status: Status of the meeting reminder ('pending', 'done', 'rescheduled', 'cancelled')
-- meeting_rescheduled_date: Date set if meeting was rescheduled
-- last_meeting_reminder_sent_at: Timestamp of last reminder dispatch
