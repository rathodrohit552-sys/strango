const express = require("express");
const path = require("path");
const app = express();

/* Serve static files */
app.use(express.static(path.join(__dirname, "public")));

/* EMI route */
app.get("/emi", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "emi-calculator.html"));
});

/* Health check */
app.get("/test", (req, res) => {
  res.send("TEST OK");
});

/* Fallback → Strango home */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* Render port */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
