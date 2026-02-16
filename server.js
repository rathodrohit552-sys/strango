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

let waitingUser = null;
let onlineCount = 0;

io.on("connection",(socket)=>{

  onlineCount++;
  io.emit("onlineCount",onlineCount);

  if(waitingUser){

    const room = waitingUser.id + "#" + socket.id;

    socket.join(room);
    waitingUser.join(room);

    socket.room = room;
    waitingUser.room = room;

    io.to(room).emit("status","Stranger connected");

    waitingUser = null;

  }else{
    waitingUser = socket;
    socket.emit("status","Waiting for stranger...");
  }

  socket.on("message",(msg)=>{
    if(socket.room){
      socket.to(socket.room).emit("message",msg);
    }
  });

  /* ===== TYPING EVENT ===== */
  socket.on("typing",(state)=>{
    if(socket.room){
      socket.to(socket.room).emit("typing",state);
    }
  });

  socket.on("next",()=>{
    if(socket.room){
      io.to(socket.room).emit("status","Stranger disconnected");
    }
    socket.leave(socket.room);
    socket.room = null;
    waitingUser = socket;
    socket.emit("status","Waiting for stranger...");
  });

  socket.on("disconnect",()=>{

    onlineCount--;
    io.emit("onlineCount",onlineCount);

    if(waitingUser && waitingUser.id === socket.id){
      waitingUser = null;
    }

    if(socket.room){
      socket.to(socket.room).emit("status","Stranger disconnected");
    }
  });

});

server.listen(3000,()=>{
  console.log("Server running...");
});
