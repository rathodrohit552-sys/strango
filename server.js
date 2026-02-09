const express = require("express");
const path = require("path");

const app = express();

// Serve all files inside "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Optional home route
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// Render provides PORT automatically
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
