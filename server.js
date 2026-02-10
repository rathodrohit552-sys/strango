const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

let waitingUser = null;
let pairs = new Map(); // socket.id -> partner.id

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.emit("online-count", io.engine.clientsCount);

  socket.on("find", () => {
    if (pairs.has(socket.id)) return;

    if (waitingUser && waitingUser !== socket.id) {
      const partner = waitingUser;
      waitingUser = null;

      pairs.set(socket.id, partner);
      pairs.set(partner, socket.id);

      io.to(socket.id).emit("connected");
      io.to(partner).emit("connected");
    } else {
      waitingUser = socket.id;
    }
  });

  socket.on("message", (msg) => {
    const partner = pairs.get(socket.id);
    if (partner) {
      io.to(partner).emit("message", msg);
    }
  });

  socket.on("typing", () => {
    const partner = pairs.get(socket.id);
    if (partner) io.to(partner).emit("typing");
  });

  socket.on("next", () => {
    disconnectPair(socket.id);
    socket.emit("disconnected");
    socket.emit("find");
  });

  socket.on("disconnect", () => {
    disconnectPair(socket.id);
    if (waitingUser === socket.id) waitingUser = null;
    console.log("Disconnected:", socket.id);
  });

  function disconnectPair(id) {
    const partner = pairs.get(id);
    if (partner) {
      pairs.delete(partner);
      io.to(partner).emit("disconnected");
    }
    pairs.delete(id);
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`Strango running on port ${PORT}`)
);
