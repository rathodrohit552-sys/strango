const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
  transports: ["websocket", "polling"]
});

app.use(express.static(path.join(__dirname, "public")));

let waitingUser = null;
let onlineCount = 0;

io.on("connection", (socket) => {
  onlineCount++;
  io.emit("onlineCount", onlineCount);

  // ===== MATCHING SYSTEM (PREVENT SELF CONNECT) =====
  if (waitingUser && waitingUser.id !== socket.id) {
    const partner = waitingUser;

    socket.partner = partner.id;
    partner.partner = socket.id;

    socket.emit("connected");
    partner.emit("connected");

    waitingUser = null;
  } else {
    waitingUser = socket;
  }

  // ===== MESSAGE RELAY =====
  socket.on("message", (msg) => {
    if (socket.partner) {
      io.to(socket.partner).emit("message", msg);
    }
  });

  // ===== NEXT BUTTON =====
  socket.on("next", () => {
    if (socket.partner) {
      io.to(socket.partner).emit("strangerDisconnected");
      const partnerSocket = io.sockets.sockets.get(socket.partner);
      if (partnerSocket) partnerSocket.partner = null;
      socket.partner = null;
    }

    if (!waitingUser) waitingUser = socket;
  });

  // ===== DISCONNECT =====
  socket.on("disconnect", () => {
    onlineCount--;
    io.emit("onlineCount", onlineCount);

    if (waitingUser && waitingUser.id === socket.id) {
      waitingUser = null;
    }

    if (socket.partner) {
      io.to(socket.partner).emit("strangerDisconnected");
      const partnerSocket = io.sockets.sockets.get(socket.partner);
      if (partnerSocket) partnerSocket.partner = null;
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running on port " + PORT));
