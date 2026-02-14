const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
  transports: ["websocket","polling"]
});

app.use(express.static(path.join(__dirname, "public")));

let waitingQueue = [];   // users waiting for stranger
let onlineCount = 0;

io.on("connection", (socket) => {

  onlineCount++;
  io.emit("onlineCount", onlineCount);

  socket.partner = null;

  // ===== ADD USER TO WAITING QUEUE =====
  addToQueue(socket);

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

      const p = io.sockets.sockets.get(socket.partner);
      if (p) p.partner = null;

      socket.partner = null;
    }

    addToQueue(socket);
  });

  // ===== DISCONNECT =====
  socket.on("disconnect", () => {

    onlineCount--;
    io.emit("onlineCount", onlineCount);

    waitingQueue = waitingQueue.filter(s => s.id !== socket.id);

    if (socket.partner) {
      io.to(socket.partner).emit("strangerDisconnected");

      const p = io.sockets.sockets.get(socket.partner);
      if (p) p.partner = null;
    }
  });
});

// ===== AUTO MATCH FUNCTION =====
function addToQueue(socket){

  // prevent duplicates
  waitingQueue = waitingQueue.filter(s => s.id !== socket.id);
  waitingQueue.push(socket);

  tryMatch();
}

function tryMatch(){

  // AUTO CONNECT WHEN TWO WAITING
  while (waitingQueue.length >= 2){

    const user1 = waitingQueue.shift();
    const user2 = waitingQueue.shift();

    if(!user1 || !user2) return;
    if(user1.id === user2.id) continue;

    user1.partner = user2.id;
    user2.partner = user1.id;

    user1.emit("connected");
    user2.emit("connected");
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running on " + PORT));
