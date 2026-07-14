require("dns").setDefaultResultOrder("ipv4first");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const apiRouter = require("./router/router");
dotenv.config();

const app = express();

app.use(morgan("dev"));
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/auth/api/calculator", apiRouter);

require("./controller/reminders");

app.get("/", (req, res) => {
  res.send("Welcome to the Calculator API");
});

// 404 handler
// app.use("*", (req, res) => {
//   res.status(404).json({ error: "Route not found" });
// });

const port = process.env.PORT || 5555;

app.listen(port, () => {
  console.log(`Server Run on PORT : ${port}`);
});
