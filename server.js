// ===============================
// STRANGO SERVER — SAFE VERSION
// ===============================

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// ===== SOCKET.IO CONFIG (IMPORTANT FIX) =====
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ["websocket", "polling"]
});

// ===== STATIC FILES =====
app.use(express.static("public"));

// ===== MATCHING SYSTEM =====
let waitingUser = null;
let onlineCount = 0;

io.on("connection", (socket) => {

  console.log("User connected:", socket.id);
  onlineCount++;
  io.emit("onlineCount", onlineCount);

  socket.partner = null;

  // ===============================
  // NEXT BUTTON — FIND STRANGER
  // ===============================
  socket.on("next", () => {

    console.log("Next pressed:", socket.id);

    // Disconnect old partner safely
    if (socket.partner) {
      io.to(socket.partner).emit("strangerDisconnected");
      const oldPartner = io.sockets.sockets.get(socket.partner);
      if (oldPartner) oldPartner.partner = null;
      socket.partner = null;
    }

    // Remove from waiting if already waiting
    if (waitingUser === socket) {
      waitingUser = null;
    }

    // If someone waiting → CONNECT BOTH
    if (waitingUser && waitingUser.id !== socket.id) {

      const partner = waitingUser;
      waitingUser = null;

      socket.partner = partner.id;
      partner.partner = socket.id;

      socket.emit("strangerConnected");
      partner.emit("strangerConnected");

      console.log("Matched:", socket.id, partner.id);

    } else {
      // Otherwise go to waiting queue
      waitingUser = socket;
      socket.emit("waiting");
      console.log("User waiting:", socket.id);
    }
  });

  // ===============================
  // MESSAGE FORWARDING
  // ===============================
  socket.on("message", (msg) => {
    if (socket.partner) {
      io.to(socket.partner).emit("message", msg);
    }
  });

  // ===============================
  // TYPING EVENT (if enabled)
  // ===============================
  socket.on("typing", () => {
    if (socket.partner) {
      io.to(socket.partner).emit("typing");
    }
  });

  // ===============================
  // DISCONNECT HANDLING
  // ===============================
  socket.on("disconnect", () => {

    console.log("User disconnected:", socket.id);
    onlineCount--;
    io.emit("onlineCount", onlineCount);

    if (waitingUser === socket) {
      waitingUser = null;
    }

    if (socket.partner) {
      io.to(socket.partner).emit("strangerDisconnected");
      const partner = io.sockets.sockets.get(socket.partner);
      if (partner) partner.partner = null;
    }
  });

});

// ===== SERVER START =====
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Strango server running on port", PORT);
});
