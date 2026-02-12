const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let waitingUser = null;
let onlineUsers = 0;
const pairs = {};

function updateOnline() {
  io.emit("onlineCount", onlineUsers);
}

io.on("connection", (socket) => {
  onlineUsers++;
  updateOnline();

  socket.emit("status", "Waiting for stranger...");

  socket.on("join", () => {
    if (waitingUser && waitingUser !== socket.id) {
      const partner = waitingUser;
      waitingUser = null;

      pairs[socket.id] = partner;
      pairs[partner] = socket.id;

      io.to(socket.id).emit("status", "Connected to stranger");
      io.to(partner).emit("status", "Connected to stranger");
    } else {
      waitingUser = socket.id;
      socket.emit("status", "Waiting for stranger...");
    }
  });

  socket.on("message", (msg) => {
    const partner = pairs[socket.id];
    if (!partner) return; // ⭐ prevent self messages

    io.to(partner).emit("message", msg);
  });

  socket.on("typing", () => {
    const partner = pairs[socket.id];
    if (!partner) return;

    io.to(partner).emit("typing");
  });

  socket.on("next", () => {
    const partner = pairs[socket.id];

    if (partner) {
      io.to(partner).emit("status", "Stranger disconnected");
      delete pairs[partner];
    }

    delete pairs[socket.id];
    waitingUser = socket.id;
    socket.emit("status", "Waiting for stranger...");
  });

  socket.on("disconnect", () => {
    onlineUsers--;
    updateOnline();

    const partner = pairs[socket.id];

    if (partner) {
      io.to(partner).emit("status", "Stranger disconnected");
      delete pairs[partner];
    }

    if (waitingUser === socket.id) waitingUser = null;

    delete pairs[socket.id];
  });
});

server.listen(3000, () => {
  console.log("Strango running on port 3000");
});
