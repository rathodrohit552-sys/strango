const express = require("express");
const path = require("path");

const app = express();

// Serve public folder
app.use(express.static(path.join(__dirname, "public")));

// ✅ Explicit route (IMPORTANT FIX)
app.get("/emi-calculator.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "emi-calculator.html"));
});

// Home route
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// Render port
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
