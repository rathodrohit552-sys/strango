const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let waitingSocket = null;
let onlineUsers = 0;

io.on("connection", (socket) => {
  onlineUsers++;
  io.emit("online", onlineUsers);

  socket.partner = null;

  if (waitingSocket) {
    socket.partner = waitingSocket;
    waitingSocket.partner = socket;

    socket.emit("connected");
    waitingSocket.emit("connected");

    waitingSocket = null;
  } else {
    waitingSocket = socket;
    socket.emit("waiting");
  }

  socket.on("message", (msg) => {
    if (socket.partner) {
      socket.partner.emit("message", msg);
    }
  });

  socket.on("typing", () => {
    if (socket.partner) {
      socket.partner.emit("typing");
    }
  });

  socket.on("next", () => {
    if (socket.partner) {
      socket.partner.emit("stranger_left");
      socket.partner.partner = null;
      socket.partner = null;
    }

    if (!waitingSocket) {
      waitingSocket = socket;
      socket.emit("waiting");
    }
  });

  socket.on("disconnect", () => {
    onlineUsers--;
    io.emit("online", onlineUsers);

    if (waitingSocket === socket) waitingSocket = null;

    if (socket.partner) {
      socket.partner.emit("stranger_left");
      socket.partner.partner = null;
    }
  });
});

server.listen(3000, () => {
  console.log("✅ Strango running at http://localhost:3000");
});
