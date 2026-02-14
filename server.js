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

const users = [];

io.on("connection", (socket) => {

  console.log("User connected:", socket.id);

  socket.partner = null;

  // ===== AUTO MATCHING =====
  const waiting = users.find(u => !u.partner);

  if (waiting) {
    socket.partner = waiting;
    waiting.partner = socket;

    socket.emit("status","Stranger connected");
    waiting.emit("status","Stranger connected");

  } else {
    users.push(socket);
    socket.emit("status","Looking for stranger...");
  }

  // ===== MESSAGE SYSTEM =====
  socket.on("message", (msg) => {
    if (!socket.partner) return;
    socket.partner.emit("message", msg);
  });

  // ===== DISCONNECT =====
  socket.on("disconnect", () => {

    if (socket.partner) {
      socket.partner.partner = null;
      socket.partner.emit("status","Stranger disconnected");
    }

    const i = users.indexOf(socket);
    if (i !== -1) users.splice(i,1);

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
