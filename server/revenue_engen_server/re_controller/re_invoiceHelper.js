// LOCAL CODE 

const { db } = require("../../connect");

const checkInvoiceGenerated = (txn_id) => {
  return new Promise((resolve, reject) => {
    if (!txn_id) return resolve(false);
    const q = `
      SELECT i.id 
      FROM re_invoice i
      JOIN re_proposal_proforma p ON i.proforma_id = p.id
      WHERE p.txn_id = ?
      LIMIT 1
    `;
    db.query(q, [txn_id], (err, rows) => {
      if (err) return reject(err);
      if (rows && rows.length > 0) return resolve(true);
      resolve(false);
    });
  });
};

module.exports = { checkInvoiceGenerated };
