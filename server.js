// ===== STRANGO REALTIME SERVER (CLEAN VERSION) =====

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ===== SERVE FRONTEND =====
app.use(express.static(path.join(__dirname, "public"))); 
// if your index.html is in root, change to:
// app.use(express.static(__dirname));


// ===== MATCHING ENGINE =====
let waitingUser = null;
let onlineCount = 0;

io.on("connection", (socket) => {

console.log("User connected:", socket.id);

onlineCount++;
io.emit("onlineCount", onlineCount);

socket.emit("waiting");

// ===== MATCH USERS =====
if (waitingUser) {

const partner = waitingUser;
waitingUser = null;

socket.partner = partner.id;
partner.partner = socket.id;

socket.emit("matched");
partner.emit("matched");

console.log("Matched:", socket.id, "with", partner.id);

} else {
waitingUser = socket;
}

// ===== MESSAGE =====
socket.on("message", (msg) => {

if (socket.partner) {
io.to(socket.partner).emit("message", msg);
}

});

// ===== NEXT BUTTON =====
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

// ===== DISCONNECT =====
socket.on("disconnect", () => {

console.log("User disconnected:", socket.id);

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

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
console.log("Strango running on port", PORT);
});
