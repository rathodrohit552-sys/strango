const express = require("express");
const path = require("path");

const app = express();

// Absolute path to public folder
const publicPath = path.join(__dirname, "public");

// Serve static files
app.use(express.static(publicPath));

// Default route → EMI Calculator
app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "emi-calculator.html"));
});

// Explicit EMI route
app.get("/emi-calculator.html", (req, res) => {
  res.sendFile(path.join(publicPath, "emi-calculator.html"));
});

// Catch-all (VERY IMPORTANT)
app.get("*", (req, res) => {
  res.sendFile(path.join(publicPath, "emi-calculator.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
