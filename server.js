const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
  transports: ["websocket", "polling"]
});

app.use(express.static("public"));

/* =========================
   STRANGO MATCH SYSTEM
========================= */

let waitingUser = null;
let online = 0;
const partners = {};

io.on("connection", (socket) => {

  online++;
  io.emit("online", online);

  /* ===== AUTO MATCH ===== */
  if (waitingUser && waitingUser.id !== socket.id) {

    partners[socket.id] = waitingUser.id;
    partners[waitingUser.id] = socket.id;

    socket.emit("connected");
    waitingUser.emit("connected");

    waitingUser = null;

  } else {
    waitingUser = socket;
    socket.emit("waiting");
  }

  /* ===== MESSAGE ===== */
  socket.on("message", (msg) => {
    const partnerId = partners[socket.id];
    if (partnerId) {
      io.to(partnerId).emit("message", msg);
    }
  });

  /* ===== TYPING ===== */
  socket.on("typing", () => {
    const partnerId = partners[socket.id];
    if (partnerId) {
      io.to(partnerId).emit("typing");
    }
  });

  /* ===== NEXT ===== */
  socket.on("next", () => {

    const partnerId = partners[socket.id];

    if (partnerId) {
      io.to(partnerId).emit("strangerDisconnected");
      delete partners[partnerId];
    }

    delete partners[socket.id];

    waitingUser = socket;
    socket.emit("waiting");
  });

  /* ===== DISCONNECT ===== */
  socket.on("disconnect", () => {

    online--;
    io.emit("online", online);

    const partnerId = partners[socket.id];

    if (partnerId) {
      io.to(partnerId).emit("strangerDisconnected");
      delete partners[partnerId];
    }

    if (waitingUser && waitingUser.id === socket.id) {
      waitingUser = null;
    }

    delete partners[socket.id];
  });

});

server.listen(process.env.PORT || 3000, () => {
  console.log("Strango server running");
});
