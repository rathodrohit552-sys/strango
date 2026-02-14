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

let waitingQueue = [];
let onlineCount = 0;

io.on("connection",(socket)=>{

  onlineCount++;
  io.emit("onlineCount",onlineCount);

  socket.partner=null;

  // ===== NEXT / MATCH =====
  socket.on("next",()=>{

    if(socket.partner){
      io.to(socket.partner).emit("strangerDisconnected");
      const old = io.sockets.sockets.get(socket.partner);
      if(old) old.partner=null;
      socket.partner=null;
    }

    waitingQueue = waitingQueue.filter(s=>s.id!==socket.id);

    if(waitingQueue.length>0){

      const partner = waitingQueue.shift();

      socket.partner = partner.id;
      partner.partner = socket.id;

      socket.emit("strangerConnected");
      partner.emit("strangerConnected");

    }else{
      waitingQueue.push(socket);
      socket.emit("waiting");
    }
  });

  // ===== MESSAGE =====
  socket.on("message",(msg)=>{
    if(socket.partner){
      io.to(socket.partner).emit("message",msg);
    }
  });

  // ===== TYPING INDICATOR =====
  socket.on("typing",()=>{
    if(socket.partner){
      io.to(socket.partner).emit("strangerTyping");
    }
  });

  // ===== DISCONNECT =====
  socket.on("disconnect",()=>{
    onlineCount--;
    io.emit("onlineCount",onlineCount);

    waitingQueue = waitingQueue.filter(s=>s.id!==socket.id);

    if(socket.partner){
      io.to(socket.partner).emit("strangerDisconnected");
      const p = io.sockets.sockets.get(socket.partner);
      if(p) p.partner=null;
    }
  });

});

server.listen(process.env.PORT||3000,()=>{
  console.log("Strango server running");
});
