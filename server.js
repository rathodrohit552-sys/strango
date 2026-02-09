const express = require("express");
const path = require("path");

const app = express();

// ✅ VERY IMPORTANT: serve public folder
app.use(express.static(path.join(__dirname, "public")));

// EMI page route
app.get("/emi", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "emi-calculator.html"));
});

// Home route (test)
app.get("/", (req, res) => {
  res.send("Server is running 🚀 Go to /emi");
});

// Port for Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
