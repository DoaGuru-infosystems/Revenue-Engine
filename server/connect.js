const mysql = require("mysql");
const dotenv = require("dotenv");
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

let connection;

function handleDisconnect() {
  connection = mysql.createConnection(dbConfig);

  connection.connect(function (err) {
    if (err) {
      console.log("Error Connecting to database:", err);
      setTimeout(handleDisconnect, 2000);
    } else {
      console.log("connected to database!");
    }
  });

  connection.on("error", function (err) {
    console.log("db error", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST" || err.code === "ECONNRESET") {
      handleDisconnect();
    } else {
      throw err;
    }
  });
}

handleDisconnect();

const db = new Proxy({}, {
  get: function (target, prop) {
    if (typeof connection[prop] === "function") {
      return connection[prop].bind(connection);
    }
    return connection[prop];
  }
});

module.exports = { db };
