const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let waitingUser = null;

io.on("connection", (socket) => {

  // MATCH USERS
  if (waitingUser) {
    socket.partner = waitingUser;
    waitingUser.partner = socket;

    socket.emit("matched");
    waitingUser.emit("matched");

    waitingUser = null;
  } else {
    waitingUser = socket;
  }

  // CHAT MESSAGE
  socket.on("message", (msg) => {
    if (socket.partner) {
      socket.partner.emit("message", msg);
    }
  });

  // NEXT BUTTON (THIS IS REQUIRED)
  socket.on("next", () => {
    if (socket.partner) {
      socket.partner.emit("partnerLeft");
      socket.partner.partner = null;
      socket.partner = null;
    }
    waitingUser = socket;
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    if (socket.partner) {
      socket.partner.emit("partnerLeft");
      socket.partner.partner = null;
    }
    if (waitingUser === socket) {
      waitingUser = null;
    }
  });

});

server.listen(3000, () => {
  console.log("Strango running on http://localhost:3000");
});
