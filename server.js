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

let waitingUser = null;
let onlineCount = 0;

io.on("connection", (socket) => {

  console.log("User connected:", socket.id);

  onlineCount++;
  io.emit("onlineCount", onlineCount);

  socket.partner = null;

  // ===== NEXT BUTTON =====
  socket.on("next", () => {

    console.log("Next clicked:", socket.id);

    // disconnect old partner
    if(socket.partner){
      io.to(socket.partner).emit("strangerDisconnected");
      const oldPartner = io.sockets.sockets.get(socket.partner);
      if(oldPartner) oldPartner.partner = null;
      socket.partner = null;
    }

    // remove from waiting
    if(waitingUser === socket){
      waitingUser = null;
    }

    // match users
    if(waitingUser && waitingUser.id !== socket.id){

      const partner = waitingUser;
      waitingUser = null;

      socket.partner = partner.id;
      partner.partner = socket.id;

      socket.emit("strangerConnected");
      partner.emit("strangerConnected");

      console.log("Matched:", socket.id, partner.id);

    }else{
      waitingUser = socket;
      socket.emit("waiting");
    }

  });

  // ===== MESSAGE =====
  socket.on("message", (msg)=>{
    if(socket.partner){
      io.to(socket.partner).emit("message", msg);
    }
  });

  // ===== DISCONNECT =====
  socket.on("disconnect", ()=>{
    onlineCount--;
    io.emit("onlineCount", onlineCount);

    if(waitingUser === socket){
      waitingUser = null;
    }

    if(socket.partner){
      io.to(socket.partner).emit("strangerDisconnected");
      const partner = io.sockets.sockets.get(socket.partner);
      if(partner) partner.partner = null;
    }
  });

});

server.listen(process.env.PORT || 3000, ()=>{
  console.log("Server running");
});
