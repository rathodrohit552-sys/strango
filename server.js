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

app.use(express.static(path.join(__dirname,"public")));

let waitingUser = null;
let onlineCount = 0;

io.on("connection", (socket) => {

  console.log("Connected:", socket.id);
  onlineCount++;
  io.emit("online", onlineCount);

  socket.partner = null;

  // ===== AUTO MATCH =====
  if (waitingUser && waitingUser.id !== socket.id) {

    socket.partner = waitingUser;
    waitingUser.partner = socket;

    socket.emit("status","Stranger connected");
    waitingUser.emit("status","Stranger connected");

    waitingUser = null;

  } else {
    waitingUser = socket;
    socket.emit("status","Looking for stranger...");
  }

  // ===== MESSAGE =====
  socket.on("message",(msg)=>{
    if(!socket.partner) return;
    socket.partner.emit("message",msg);
  });

  // ===== NEXT BUTTON =====
  socket.on("next",()=>{

    if(socket.partner){
      socket.partner.emit("status","Stranger disconnected");
      socket.partner.partner=null;
    }

    socket.partner=null;

    if(waitingUser && waitingUser.id!==socket.id){
      socket.partner=waitingUser;
      waitingUser.partner=socket;

      socket.emit("status","Stranger connected");
      waitingUser.emit("status","Stranger connected");

      waitingUser=null;
    }else{
      waitingUser=socket;
      socket.emit("status","Looking for stranger...");
    }

  });

  // ===== DISCONNECT =====
  socket.on("disconnect",()=>{

    onlineCount--;
    io.emit("online", onlineCount);

    if(waitingUser && waitingUser.id===socket.id){
      waitingUser=null;
    }

    if(socket.partner){
      socket.partner.emit("status","Stranger disconnected");
      socket.partner.partner=null;
    }

  });

});

server.listen(process.env.PORT || 3000, ()=>{
  console.log("Server running");
});
