const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let onlineUsers = 0;

/* ⭐ WAITING QUEUE */
let waitingQueue = [];

/* ⭐ ACTIVE PAIRS */
const pairs = {};

function updateOnline(){
  io.emit("onlineCount", onlineUsers);
}

/* ⭐ MATCH ONLY FROM QUEUE */
function tryMatch(){
  while(waitingQueue.length >= 2){
    const user1 = waitingQueue.shift();
    const user2 = waitingQueue.shift();

    pairs[user1] = user2;
    pairs[user2] = user1;

    io.to(user1).emit("newMatch");
    io.to(user2).emit("newMatch");

    io.to(user1).emit("status","Connected to stranger");
    io.to(user2).emit("status","Connected to stranger");
  }
}

let waitingUser = null;
let onlineCount = 0;

io.on("connection", (socket) => {

onlineCount++;
io.emit("onlineCount", onlineCount);

socket.emit("waiting");

if (waitingUser) {

const partner = waitingUser;
waitingUser = null;

socket.partner = partner.id;
partner.partner = socket.id;

socket.emit("matched");
partner.emit("matched");

} else {
waitingUser = socket;
}

socket.on("message", (msg) => {

if (socket.partner) {
io.to(socket.partner).emit("message", msg);
}

});

socket.on("next", () => {

if (socket.partner) {
io.to(socket.partner).emit("partnerDisconnected");

const partnerSocket = io.sockets.sockets.get(socket.partner);
if (partnerSocket) partnerSocket.partner = null;

socket.partner = null;
}

socket.emit("waiting");

if (waitingUser && waitingUser.id !== socket.id) {

const partner = waitingUser;
waitingUser = null;

socket.partner = partner.id;
partner.partner = socket.id;

socket.emit("matched");
partner.emit("matched");

} else {
waitingUser = socket;
}

});

socket.on("disconnect", () => {

onlineCount--;
io.emit("onlineCount", onlineCount);

if (waitingUser && waitingUser.id === socket.id) {
waitingUser = null;
}

if (socket.partner) {
io.to(socket.partner).emit("partnerDisconnected");
}

});

});

