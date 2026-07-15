require("dns").setDefaultResultOrder("ipv4first");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const re_apiRouter = require("./revenue_engen_server/re_router/re_router");
dotenv.config();

const app = express();

app.use(morgan("dev"));
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/auth/api/re_calculator", re_apiRouter);

require("./revenue_engen_server/re_controller/re_reminders");

app.get("/", (req, res) => {
  res.send("Welcome to the Calculator API");
});

process.on("unhandledRejection", (reason) => {
  console.error("[UNHANDLED REJECTION]", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[UNCAUGHT EXCEPTION]", err);
});

// 404 handler
// app.use("*", (req, res) => {
//   res.status(404).json({ error: "Route not found" });
// });

const port = process.env.PORT || 5555;

app.listen(port, () => {
  console.log(`Server Run on PORT : ${port}`);
});
