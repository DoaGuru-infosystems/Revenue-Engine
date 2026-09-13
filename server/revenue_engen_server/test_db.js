require('dotenv').config({ path: '../.env' });
const { db } = require('../connect.js');

const txn_id = "1789302296465";

db.query("UPDATE re_proposal_proforma SET discount_snapshot = 'NONE' WHERE txn_id = ?", [txn_id], (err2, result) => {
  if (err2) {
    console.error("Error updating proforma discount_snapshot:", err2);
  } else {
    console.log("Update success:", result);
  }
  
  // Re-query to verify
  db.query("SELECT discount_snapshot FROM re_proposal_proforma WHERE txn_id = ?", [txn_id], (err3, rows) => {
    console.log("After update:", rows);
    process.exit();
  });
});
