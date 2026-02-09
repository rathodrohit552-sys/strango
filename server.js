const express = require("express");
const path = require("path");

const app = express();

// absolute path to public folder
const publicDir = path.join(__dirname, "public");

// serve static files
app.use(express.static(publicDir));

// root route
app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "emi-calculator.html"));
});

// explicit emi route
app.get("/emi", (req, res) => {
  res.sendFile(path.join(publicDir, "emi-calculator.html"));
});

// fallback — NO wildcards, Express 5 safe
app.use((req, res) => {
  res.redirect("/");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
