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

let waitingQueue = [];
let onlineCount = 0;

function tryMatch(){
  while(waitingQueue.length >= 2){

    const user1 = waitingQueue.shift();
    const user2 = waitingQueue.shift();

    if(!user1 || !user2) return;

    const room = user1.id + "#" + user2.id;

    user1.join(room);
    user2.join(room);

    user1.room = room;
    user2.room = room;

    io.to(room).emit("status","Stranger connected");
  }
}

io.on("connection",(socket)=>{

  onlineCount++;
  io.emit("onlineCount",onlineCount);

  waitingQueue.push(socket);
  socket.emit("status","Waiting for stranger...");
  tryMatch();

  socket.on("message",(msg)=>{
    if(socket.room){
      socket.to(socket.room).emit("message",msg);
    }
  });

  socket.on("typing",(state)=>{
    if(socket.room){
      socket.to(socket.room).emit("typing",state);
    }
  });

  socket.on("next",()=>{

    if(socket.room){

      io.to(socket.room).emit("status","Stranger disconnected");

      const room = socket.room;
      const clients = io.sockets.adapter.rooms.get(room);

      if(clients){
        clients.forEach(id=>{
          const s = io.sockets.sockets.get(id);
          if(s){
            s.leave(room);
            s.room = null;
            waitingQueue.push(s);
            s.emit("status","Waiting for stranger...");
          }
        });
      }

    }else{
      waitingQueue.push(socket);
      socket.emit("status","Waiting for stranger...");
    }

    tryMatch();
  });

  socket.on("disconnect",()=>{

    onlineCount--;
    io.emit("onlineCount",onlineCount);

    waitingQueue = waitingQueue.filter(s=>s.id !== socket.id);

    if(socket.room){

      socket.to(socket.room).emit("status","Stranger disconnected");

      const room = socket.room;
      const clients = io.sockets.adapter.rooms.get(room);

      if(clients){
        clients.forEach(id=>{
          const s = io.sockets.sockets.get(id);
          if(s){
            s.leave(room);
            s.room = null;
            waitingQueue.push(s);
            s.emit("status","Waiting for stranger...");
          }
        });
      }

      tryMatch();
    }
  });

});

server.listen(3000,()=>{
  console.log("Server running...");
});
