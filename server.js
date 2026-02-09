const express = require("express");
const path = require("path");

const app = express();

/**
 * 1. Serve public folder
 */
app.use(express.static(path.join(__dirname, "public")));

/**
 * 2. EMI route
 */
app.get("/emi", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "emi-calculator.html"));
});

/**
 * 3. Home route → redirect to EMI
 */
app.get("/", (req, res) => {
  res.redirect("/emi");
});

/**
 * 4. Start server (Render-safe)
 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
