const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
  transports: ["websocket","polling"]
});

app.use(express.static("public"));

/* =========================
   STRANGO MATCH ENGINE
========================= */

let waitingQueue = [];
let partners = {};
let online = 0;

/* ===== MATCH FUNCTION ===== */
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

io.on("connection",(socket)=>{

  online++;
  io.emit("online",online);

  /* ADD TO QUEUE */
  waitingQueue.push(socket);
  socket.emit("waiting");

  /* TRY AUTO MATCH */
  tryMatch();

  /* ===== MESSAGE ===== */
  socket.on("message",(msg)=>{
    const partnerId = partners[socket.id];
    if(partnerId){
      io.to(partnerId).emit("message",msg);
    }
  });
/* ===== NEXT EVENT (FIX SELF MATCH) ===== */

  const partnerId = partners[socket.id];

  // remove old partner link
  if(partnerId){
    const partnerSocket = io.sockets.sockets.get(partnerId);

    if(partnerSocket){
      delete partners[partnerSocket.id];
      partnerSocket.emit("waiting");
      waitingQueue.push(partnerSocket);
    }

    delete partners[socket.id];
  }

  // add current user back to queue
  waitingQueue.push(socket);
  socket.emit("waiting");

  tryMatch();

  /* ===== TYPING ===== */
  socket.on("typing",()=>{
    const partnerId = partners[socket.id];
    if(partnerId){
      io.to(partnerId).emit("typing");
    }
  });

  /* ===== NEXT ===== */
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

    waitingQueue = waitingQueue.filter(s=>s.id !== socket.id);

    const partnerId = partners[socket.id];

    if(partnerId){
      io.to(partnerId).emit("strangerDisconnected");
      delete partners[partnerId];
    }

    delete partners[socket.id];
  });

});

server.listen(process.env.PORT || 3000,()=>{
  console.log("Strango server running");
});
