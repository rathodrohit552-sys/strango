const express = require("express");
const path = require("path");

const app = express();

/* 1️⃣ Serve ALL static files from public folder */
app.use(express.static(path.join(__dirname, "public")));

/* 2️⃣ Test route (guarantee check) */
app.get("/test", (req, res) => {
  res.send("TEST OK");
});

/* 3️⃣ EMI page route */
app.get("/emi", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "emi-calculator.html"));
});

/* 4️⃣ Home route */
app.get("/", (req, res) => {
  res.send("Server is running 🚀 Go to /emi");
});

/* 5️⃣ Render port */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
