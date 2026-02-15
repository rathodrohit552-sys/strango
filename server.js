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

let waitingQueue = [];
let onlineCount = 0;

io.on("connection", (socket) => {

  onlineCount++;
  io.emit("onlineCount", onlineCount);

  socket.partner = null;

  // ⭐ auto join queue
  addToQueue(socket);

  // ===== MESSAGE RELAY =====
  socket.on("message", (msg) => {
    if (socket.partner) {
      io.to(socket.partner).emit("message", msg);

      // ⭐ STOP TYPING WHEN MESSAGE SENT
      io.to(socket.partner).emit("stopTyping");
    }
  });

  // ===== TYPING RELAY =====
  socket.on("typing", () => {
    if(socket.partner){
      io.to(socket.partner).emit("typing");
    }
  });

  // ⭐ NEW: STOP TYPING RELAY
  socket.on("stopTyping", () => {
    if(socket.partner){
      io.to(socket.partner).emit("stopTyping");
    }
  });

  // ===== NEXT BUTTON =====
  socket.on("next", () => {

    if (socket.partner) {
      io.to(socket.partner).emit("strangerDisconnected");
      io.to(socket.partner).emit("stopTyping"); // ⭐ clear dots

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
      io.to(socket.partner).emit("stopTyping"); // ⭐ clear dots

      const p = io.sockets.sockets.get(socket.partner);
      if (p) p.partner = null;
    }
  });
});


// ===== AUTO MATCH =====
function addToQueue(socket){
  waitingQueue = waitingQueue.filter(s => s.id !== socket.id);
  waitingQueue.push(socket);
  tryMatch();
}

function tryMatch(){

  while(waitingQueue.length >= 2){

    const user1 = waitingQueue.shift();
    const user2 = waitingQueue.shift();

    if(!user1 || !user2) return;
    if(user1.id === user2.id) continue;

    user1.partner = user2.id;
    user2.partner = user1.id;

    user1.emit("strangerConnected");
    user2.emit("strangerConnected");

    // ⭐ clear typing on new match
    user1.emit("stopTyping");
    user2.emit("stopTyping");
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running on " + PORT));
