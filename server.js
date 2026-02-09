
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let waitingUser = null;

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.partner = null;

  // Match users
  if (waitingUser) {
    socket.partner = waitingUser;
    waitingUser.partner = socket;

    socket.emit("connected");
    waitingUser.emit("connected");

    waitingUser = null;
  } else {
    waitingUser = socket;
    socket.emit("waiting");
  }

  // Message handling
  socket.on("message", (msg) => {
    if (socket.partner) {
      socket.partner.emit("message", msg);
    }
  });

  // Next button
  socket.on("next", () => {
    if (socket.partner) {
      socket.partner.emit("partner_left");
      socket.partner.partner = null;
    }
    socket.partner = null;
    waitingUser = socket;
    socket.emit("waiting");
  });

  // Disconnect handling
  socket.on("disconnect", () => {
    if (waitingUser === socket) {
      waitingUser = null;
    }
    if (socket.partner) {
      socket.partner.emit("partner_left");
      socket.partner.partner = null;
    }
    console.log("User disconnected:", socket.id);
  });
});

// ✅ IMPORTANT FOR DEPLOYMENT
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
