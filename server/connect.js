const mysql = require("mysql");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, ".env") });

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "revenue_engine",
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  connectTimeout: 10000,
};

const pool = mysql.createPool(dbConfig);

pool.on("error", function (err) {
  console.error("[DB POOL ERROR]", err);
});

// Verify connection on startup
pool.getConnection((err, connection) => {
  if (err) {
    console.error("Error Connecting to database pool:", err);
  } else {
    console.log("connected to database pool!");
    connection.release();
  }
});

module.exports = { db: pool };

