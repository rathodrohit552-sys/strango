const express = require("express");
const path = require("path");

const app = express();

/* 🔴 THIS WAS MISSING — REQUIRED */
app.use(express.static(path.join(__dirname, "public")));

/* Root test */
app.get("/", (req, res) => {
  res.send("Server is running 🚀 Go to /emi or /test");
});

/* EMI page */
app.get("/emi", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "emi-calculator.html"));
});

/* Test route */
app.get("/test", (req, res) => {
  res.send("TEST OK");
});

/* Render port */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
