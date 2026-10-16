const { db } = require('../connect');

db.query("SELECT * FROM message_notification WHERE role = 'owner'", (err, rows) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  if (rows.length === 0) {
    db.query(
      "INSERT INTO message_notification (role, name, email, phone_number) VALUES (?, ?, ?, ?)",
      ['owner', 'Owner', process.env.OWNER_EMAIL || 'doaguruinfosystems@gmail.com', process.env.OWNER_MOBILE_NUMBER || '7000102121'],
      (err2) => {
        if (err2) console.error(err2);
        else console.log('Seeded default owner into message_notification');
        process.exit(0);
      }
    );
  } else {
    console.log('Owner already configured.');
    process.exit(0);
  }
});
