const { db } = require('../connect');

const createTableSql = `
CREATE TABLE IF NOT EXISTS message_notification (
  id INT(11) NOT NULL AUTO_INCREMENT,
  role ENUM('owner', 'manager', 'team_lead', 'api_config') NOT NULL,
  team_name VARCHAR(255) DEFAULT NULL,
  name VARCHAR(255) DEFAULT NULL,
  email VARCHAR(255) DEFAULT NULL,
  phone_number VARCHAR(50) DEFAULT NULL,
  designation VARCHAR(255) DEFAULT NULL,
  api_endpoint TEXT DEFAULT NULL,
  api_token TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

db.query(createTableSql, (err) => {
  if (err) {
    console.error('Error creating message_notification:', err);
    process.exit(1);
  }
  console.log('message_notification table ready.');

  db.query('SHOW COLUMNS FROM re_proposal_proforma', (err2, cols) => {
    if (err2) {
      console.error('Error checking re_proposal_proforma cols:', err2);
      process.exit(1);
    }
    const names = cols.map((c) => c.Field);
    const alters = [];
    if (!names.includes('assigned_team')) {
      alters.push('ADD COLUMN assigned_team VARCHAR(255) DEFAULT NULL');
    }
    if (!names.includes('meeting_status')) {
      alters.push("ADD COLUMN meeting_status ENUM('pending','done','rescheduled','cancelled') DEFAULT 'pending'");
    }
    if (!names.includes('meeting_rescheduled_date')) {
      alters.push('ADD COLUMN meeting_rescheduled_date DATE DEFAULT NULL');
    }
    if (!names.includes('last_meeting_reminder_sent_at')) {
      alters.push('ADD COLUMN last_meeting_reminder_sent_at DATETIME DEFAULT NULL');
    }

    if (alters.length > 0) {
      db.query(`ALTER TABLE re_proposal_proforma ${alters.join(', ')}`, (err3) => {
        if (err3) {
          console.error('Error altering re_proposal_proforma:', err3);
          process.exit(1);
        }
        console.log('Altered re_proposal_proforma successfully with:', alters);
        process.exit(0);
      });
    } else {
      console.log('re_proposal_proforma already up to date.');
      process.exit(0);
    }
  });
});
