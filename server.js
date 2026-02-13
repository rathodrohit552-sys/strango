const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let waitingUser = null;
let onlineUsers = 0;

/* ===== CONNECTION ===== */

io.on("connection", (socket) => {

  onlineUsers++;
  io.emit("online", onlineUsers);

  socket.partner = null;

  /* ===== MATCHING ENGINE ===== */

  function findPartner(){

    // if someone waiting
    if(waitingUser && waitingUser !== socket){

      socket.partner = waitingUser;
      waitingUser.partner = socket;

      socket.emit("connected");
      waitingUser.emit("connected");


      waitingUser = null;

    }else{
      waitingUser = socket;
      socket.emit("waiting");

    }
  }

  // auto search when user joins
  findPartner();

  /* ===== MESSAGE ===== */

  socket.on("message", msg=>{
    if(socket.partner){
      socket.partner.emit("message", msg);
    }
  });
/* ===== STRANGER TYPING ===== */

socket.on("typing", ()=>{
   if(socket.partner){
      socket.partner.emit("typing");
   }
});

socket.on("stopTyping", ()=>{
   if(socket.partner){
      socket.partner.emit("stopTyping");
   }
});

  /* ===== NEXT ===== */

  socket.on("next", ()=>{
    if(socket.partner){
      socket.partner.partner = null;
      socket.partner.emit("stranger-disconnected");
    }
    socket.partner = null;
    findPartner();
  });

  /* ===== DISCONNECT ===== */

  socket.on("disconnect", ()=>{

    onlineUsers--;
    io.emit("online", onlineUsers);

    if(waitingUser === socket){
      waitingUser = null;
    }

    if(socket.partner){
      socket.partner.partner = null;
      socket.partner.emit("status","Stranger disconnected");
    }

  });

});

/* ===== START SERVER ===== */

const PORT = process.env.PORT || 10000;
server.listen(PORT, ()=>{
  console.log("Strango running on port", PORT);
});
