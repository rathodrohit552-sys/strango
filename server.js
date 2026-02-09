const express = require("express");
const path = require("path");

const app = express();

// serve static files from public folder
app.use(express.static(path.join(__dirname, "public")));

// EMI calculator route
app.get("/emi", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "emi-calculator.html"));
});

// home route (optional)
app.get("/", (req, res) => {
  res.send("Server is running 🚀 Go to /emi");
});

// PORT for Render
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
