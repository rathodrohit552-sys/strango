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

    const room = socket.room;

    // Notify partner only
    socket.to(room).emit("status","Stranger disconnected");

    const clients = io.sockets.adapter.rooms.get(room);

    if(clients){
      clients.forEach(id=>{
        const s = io.sockets.sockets.get(id);
        if(!s) return;

        s.leave(room);
        s.room = null;

        // ⭐ ONLY partner goes to waiting queue
        if(s.id !== socket.id){
          waitingQueue.push(s);
          s.emit("status","Waiting for stranger...");
        }
      });
    }

    // ⭐ NEXT clicker gets priority (front of queue)
    waitingQueue.unshift(socket);
    socket.emit("status","Waiting for stranger...");

  }else{
    waitingQueue.unshift(socket);
    socket.emit("status","Waiting for stranger...");
  }

  tryMatch();
});

  socket.on("disconnect",()=>{

    onlineCount--;
    io.emit("onlineCount",onlineCount);
    /* SAFE JOIN DELAY (prevents ghost sockets on refresh) */
setTimeout(()=>{

  if(!socket.connected) return; // ignore ghost reconnects

  waitingQueue.push(socket);
  socket.emit("status","Waiting for stranger...");
  tryMatch();

},300);

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
