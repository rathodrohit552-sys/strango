const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let onlineUsers = 0;

/* ⭐ WAITING QUEUE */
let waitingQueue = [];

/* ⭐ ACTIVE PAIRS */
const pairs = {};

function updateOnline(){
  io.emit("onlineCount", onlineUsers);
}

/* ⭐ MATCH ONLY FROM QUEUE */
function tryMatch(){
  while(waitingQueue.length >= 2){
    const user1 = waitingQueue.shift();
    const user2 = waitingQueue.shift();

    pairs[user1] = user2;
    pairs[user2] = user1;

    io.to(user1).emit("newMatch");
    io.to(user2).emit("newMatch");

    io.to(user1).emit("status","Connected to stranger");
    io.to(user2).emit("status","Connected to stranger");
  }
}

io.on("connection",(socket)=>{

  onlineUsers++;
  updateOnline();

  socket.emit("status","Waiting for stranger...");

  /* JOIN QUEUE */
  socket.on("join",()=>{
    if(!waitingQueue.includes(socket.id)){
      waitingQueue.push(socket.id);
    }
    tryMatch();
  });

  /* MESSAGE */
  socket.on("message",(msg)=>{
    const partner = pairs[socket.id];
    if(!partner) return;
    io.to(partner).emit("message",msg);
  });

  /* TYPING */
  socket.on("typing",()=>{
    const partner = pairs[socket.id];
    if(!partner) return;
    io.to(partner).emit("typing");
  });

  /* ⭐ NEXT BUTTON — ONLY CURRENT USER GOES BACK TO QUEUE */
  socket.on("next",()=>{
    const partner = pairs[socket.id];

    if(partner){
      delete pairs[partner];
      delete pairs[socket.id];

      /* partner stays alone — NOT auto matched */
      io.to(partner).emit("status","Stranger disconnected");
      io.to(partner).emit("newMatch"); // clear old chat
    }

    if(!waitingQueue.includes(socket.id)){
      waitingQueue.push(socket.id);
    }

    socket.emit("status","Waiting for stranger...");
    socket.emit("newMatch"); // clear chat for next clicker

    tryMatch();
  });

  /* DISCONNECT */
  socket.on("disconnect",()=>{

    onlineUsers--;
    updateOnline();

    waitingQueue = waitingQueue.filter(id=>id!==socket.id);

    const partner = pairs[socket.id];

    if(partner){
      delete pairs[partner];
      delete pairs[socket.id];

      io.to(partner).emit("status","Stranger disconnected");
      io.to(partner).emit("newMatch"); // clear chat
    }
  });
});

server.listen(3000,()=>{
  console.log("Strango running on port 3000");
});
