const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let waitingUser = null;
let onlineUsers = 0;

/* ===== CONNECTION ===== */

io.on("connection", (socket) => {

  onlineUsers++;
  io.emit("online", onlineUsers);

  socket.partner = null;

  /* ===== MATCHING ENGINE ===== */

  function findPartner() {

    // someone already waiting
    if (waitingUser && waitingUser !== socket) {

      socket.partner = waitingUser;
      waitingUser.partner = socket;

      socket.emit("matched");
      waitingUser.emit("matched");

      socket.emit("strangerConnected");
      waitingUser.emit("strangerConnected");

      waitingUser = null;
      return;
    }

    // otherwise wait
    waitingUser = socket;
    socket.emit("waiting");
  }

  findPartner();

  /* ===== MESSAGE RELAY ===== */

  socket.on("message", (msg) => {
    if (socket.partner) {
      socket.partner.emit("message", msg);
    }
  });

  /* ===== TYPING RELAY ===== */

  socket.on("typing", () => {
    if (socket.partner) {
      socket.partner.emit("typing");
    }
  });

  socket.on("stopTyping", () => {
    if (socket.partner) {
      socket.partner.emit("stopTyping");
    }
  });

  /* ===== NEXT STRANGER ===== */

  socket.on("next", () => {

    if (socket.partner) {
      socket.partner.partner = null;
      socket.partner.emit("waiting");
    }

    socket.partner = null;
    findPartner();
  });

  /* ===== DISCONNECT ===== */

  socket.on("disconnect", () => {

    onlineUsers--;
    io.emit("online", onlineUsers);

    if (socket.partner) {
      socket.partner.partner = null;
      socket.partner.emit("system", "❌ Stranger disconnected.");
      socket.partner.emit("waiting");
    }

    if (waitingUser === socket) {
      waitingUser = null;
    }
  });

});

/* ===== START SERVER ===== */

server.listen(3000, () => {
  console.log("Strango server running...");
});
