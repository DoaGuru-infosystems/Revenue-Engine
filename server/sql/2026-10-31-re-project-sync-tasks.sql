-- 2026-10-31 Task 7: Per-Project Task Calendar & is_active column
-- Table: re_project_sync_tasks

CREATE TABLE IF NOT EXISTS `re_project_sync_tasks` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `project_sync_id` INT(11) NOT NULL,
  `sf_task_id` VARCHAR(100) DEFAULT NULL,
  `task_name` VARCHAR(255) NOT NULL,
  `task_description` TEXT DEFAULT NULL,
  `assigned_to_name` VARCHAR(255) DEFAULT NULL,
  `assigned_to_role` VARCHAR(100) DEFAULT NULL,
  `deadline` DATE DEFAULT NULL,
  `status` VARCHAR(100) DEFAULT 'pending',
  `last_updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_project_sync` (`project_sync_id`),
  CONSTRAINT `fk_rpst_project_sync` FOREIGN KEY (`project_sync_id`)
    REFERENCES `re_project_sync` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

