const jwt = require("jsonwebtoken");
const { db } = require("../connect");
const dotenv = require("dotenv");
dotenv.config();

const verifyAdminToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const query = "SELECT * FROM re_revenue_engine_employees WHERE id = ?";
    const params = [decoded.id];

    return new Promise((resolve, reject) => {
      db.query(query, params, (error, results) => {
        if (error) return reject(error);
        if (!results.length) return resolve(null);

        resolve(results[0]);
      });
    });
  } catch (error) {
    console.error("JWT Error:", error.message);
    return null;
  }
};

module.exports = verifyAdminToken;
