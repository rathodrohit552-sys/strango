const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let waitingQueue = [];
let onlineCount = 0;

io.on("connection", (socket) => {

onlineCount++;
io.emit("onlineCount", onlineCount);

socket.partner = null;

/* ================= MATCH FUNCTION ================= */

function tryMatch(user){

if(waitingQueue.length > 0){

const partner = waitingQueue.shift();

if(partner.id === user.id){
waitingQueue.push(user);
return;
}

user.partner = partner.id;
partner.partner = user.id;

user.emit("matched");
partner.emit("matched");

}else{
waitingQueue.push(user);
user.emit("waiting");
}
}

/* FIRST MATCH */
tryMatch(socket);

/* ================= MESSAGE ================= */

socket.on("message",(msg)=>{
if(socket.partner){
io.to(socket.partner).emit("message",msg);
}
});

/* ================= TYPING ================= */

socket.on("typing",()=>{
if(socket.partner){
io.to(socket.partner).emit("typing");
}
});

/* ================= NEXT ================= */

socket.on("next",()=>{

if(socket.partner){
const p = io.sockets.sockets.get(socket.partner);
if(p){
p.partner=null;
p.emit("disconnectUser");
}
socket.partner=null;
}

waitingQueue = waitingQueue.filter(s=>s.id!==socket.id);

tryMatch(socket);

});

/* ================= DISCONNECT ================= */

socket.on("disconnect",()=>{

onlineCount--;
io.emit("onlineCount", onlineCount);

if(socket.partner){
const p = io.sockets.sockets.get(socket.partner);
if(p){
p.partner=null;
p.emit("disconnectUser");
}
}

waitingQueue = waitingQueue.filter(s=>s.id!==socket.id);

});

});

server.listen(3000,()=>{
console.log("🚀 Strango running on port 3000");
});
