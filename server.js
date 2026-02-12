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

      socket.emit("status","Connected to stranger");
      waitingUser.emit("status","Connected to stranger");

      waitingUser = null;

    }else{
      waitingUser = socket;
      socket.emit("status","Looking for stranger...");
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

  /* ===== NEXT ===== */

  socket.on("next", ()=>{
    if(socket.partner){
      socket.partner.partner = null;
      socket.partner.emit("status","Stranger disconnected");
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
