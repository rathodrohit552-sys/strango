const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// ✅ SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ✅ SERVE FRONTEND FILES
app.use(express.static(path.join(__dirname, "public")));

// ✅ ROOT URL SHOULD LOAD index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ================= SOCKET LOGIC =================
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});
// =================================================

// ✅ START SERVER (RENDER SAFE)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Strango running on port ${PORT}`);
});
