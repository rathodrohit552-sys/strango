const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server,{
  cors:{ origin:"*" },
  transports:["websocket","polling"]
});

app.use(express.static("public"));

/* ====== STRANGO CORE STATE ====== */

let waitingQueue = [];
let partners = {};
let online = 0;

/* ====== MATCHING FUNCTION ====== */
function tryMatch(){

  while(waitingQueue.length >= 2){

    const a = waitingQueue.shift();
    const b = waitingQueue.shift();

    if(!a || !b) return;

    partners[a.id] = b.id;
    partners[b.id] = a.id;

    a.emit("connected");
    b.emit("connected");
  }
}

/* ====== SOCKET CONNECTION ====== */
io.on("connection",(socket)=>{

  online++;
  io.emit("online",online);

  /* ADD USER TO WAITING */
  waitingQueue.push(socket);
  socket.emit("waiting");

  tryMatch();

  /* ===== MESSAGE FORWARD ===== */
  socket.on("message",(msg)=>{

    const partnerId = partners[socket.id];

    if(partnerId){
      io.to(partnerId).emit("message",msg);
    }

  });

  /* ===== NEXT BUTTON ===== */
  socket.on("next",()=>{

    const partnerId = partners[socket.id];

    if(partnerId){

      io.to(partnerId).emit("strangerDisconnected");

      const partnerSocket = io.sockets.sockets.get(partnerId);

      if(partnerSocket){
        partnerSocket.emit("waiting");
        waitingQueue.push(partnerSocket);
      }

      delete partners[partnerId];
    }

    delete partners[socket.id];

    waitingQueue.push(socket);
    socket.emit("waiting");

    tryMatch();
  });

  /* ===== DISCONNECT ===== */
  socket.on("disconnect",()=>{

    online--;
    io.emit("online",online);

    waitingQueue = waitingQueue.filter(s => s.id !== socket.id);

    const partnerId = partners[socket.id];

    if(partnerId){

      io.to(partnerId).emit("strangerDisconnected");

      const partnerSocket = io.sockets.sockets.get(partnerId);

      if(partnerSocket){
        partnerSocket.emit("waiting");
        waitingQueue.push(partnerSocket);
      }

      delete partners[partnerId];
    }

    delete partners[socket.id];
  });

});

/* ===== SERVER START ===== */
const PORT = process.env.PORT || 3000;
server.listen(PORT,()=>{
  console.log("Strango running on port",PORT);
});
