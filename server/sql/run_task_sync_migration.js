/**
 * Migration runner for Task 7:
 * 1. Creates re_project_sync_tasks table
 * 2. Adds is_active TINYINT(1) DEFAULT 1 to re_project_sync if not already present
 *
 * Run manually via: node server/sql/run_task_sync_migration.js
 */
const { db } = require('../connect');

const createTasksSQL = `
CREATE TABLE IF NOT EXISTS \`re_project_sync_tasks\` (
  \`id\` INT(11) NOT NULL AUTO_INCREMENT,
  \`project_sync_id\` INT(11) NOT NULL,
  \`sf_task_id\` VARCHAR(100) DEFAULT NULL,
  \`task_name\` VARCHAR(255) NOT NULL,
  \`task_description\` TEXT DEFAULT NULL,
  \`assigned_to_name\` VARCHAR(255) DEFAULT NULL,
  \`assigned_to_role\` VARCHAR(100) DEFAULT NULL,
  \`deadline\` DATE DEFAULT NULL,
  \`status\` VARCHAR(100) DEFAULT 'pending',
  \`last_updated_at\` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_project_sync\` (\`project_sync_id\`),
  CONSTRAINT \`fk_rpst_project_sync\` FOREIGN KEY (\`project_sync_id\`)
    REFERENCES \`re_project_sync\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

async function run() {
  console.log('[MIGRATION Task 7] Running per-project tasks migration...');

  // 1. Create table
  db.query(createTasksSQL, (err1) => {
    if (err1) {
      console.error('[MIGRATION ERROR] re_project_sync_tasks creation failed:', err1.message);
      process.exit(1);
    }
    console.log('[MIGRATION SUCCESS] re_project_sync_tasks ready.');

    // 2. Check if is_active exists in re_project_sync
    const checkColSQL = `
      SELECT COUNT(*) AS cnt 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 're_project_sync' 
        AND COLUMN_NAME = 'is_active'
    `;

    db.query(checkColSQL, (err2, rows) => {
      if (err2) {
        console.error('[MIGRATION ERROR] Column check failed:', err2.message);
        process.exit(1);
      }

      if (rows && rows[0]?.cnt > 0) {
        console.log('[MIGRATION NOTICE] is_active column already exists in re_project_sync.');
        console.log('[MIGRATION COMPLETE] Task 7 migration finished successfully.');
        process.exit(0);
      }

      const addColSQL = `
        ALTER TABLE \`re_project_sync\`
          ADD COLUMN \`is_active\` TINYINT(1) DEFAULT 1 AFTER \`current_status\`;
      `;

      db.query(addColSQL, (err3) => {
        if (err3) {
          console.error('[MIGRATION ERROR] Failed to add is_active column:', err3.message);
          process.exit(1);
        }
        console.log('[MIGRATION SUCCESS] Added is_active column to re_project_sync.');
        console.log('[MIGRATION COMPLETE] Task 7 migration finished successfully.');
        process.exit(0);
      });
    });
  });
}

run();

