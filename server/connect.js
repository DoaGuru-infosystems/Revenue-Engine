const mysql = require("mysql");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, ".env") });

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "revenue_engine",
  connectTimeout: 10000,
};

let connection = null;
let pingInterval = null;

function handleDisconnect() {
  if (connection) {
    try {
      connection.removeAllListeners();
      connection.destroy();
    } catch (e) {
      // ignore destruction errors on broken sockets
    }
    connection = null;
  }

  connection = mysql.createConnection(dbConfig);

  connection.connect(function (err) {
    if (err) {
      console.error("Error Connecting to database:", err.message);
      setTimeout(handleDisconnect, 2000);
    } else {
      console.log("connected to database!");

      // Start keepalive ping every 30 seconds to prevent idle timeout (PROTOCOL_CONNECTION_LOST)
      if (pingInterval) clearInterval(pingInterval);
      pingInterval = setInterval(() => {
        if (connection && connection.state !== "disconnected") {
          connection.ping((pingErr) => {
            if (pingErr) {
              console.warn("[DB PING] Ping failed, reconnecting:", pingErr.message);
              handleDisconnect();
            }
          });
        }
      }, 30000);
    }
  });

  connection.on("error", function (err) {
    console.error("Database connection error:", err.code || err.message);
    if (
      err.code === "PROTOCOL_CONNECTION_LOST" ||
      err.code === "ECONNRESET" ||
      err.code === "ECONNREFUSED" ||
      err.code === "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR" ||
      err.fatal
    ) {
      handleDisconnect();
    }
  });
}

handleDisconnect();

const db = new Proxy({}, {
  get: function (target, prop) {
    if (connection && typeof connection[prop] === "function") {
      return (...args) => connection[prop](...args);
    }
    return connection ? connection[prop] : undefined;
  }
});

module.exports = { db };

