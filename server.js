const express=require("express");
const http=require("http");
const {Server}=require("socket.io");

const app=express();
const server=http.createServer(app);
const io=new Server(server);

app.use(express.static("public"));

let waitingQueue=[];
let onlineCount=0;

io.on("connection",(socket)=>{

onlineCount++;
io.emit("onlineCount",onlineCount);

socket.partner=null;

socket.on("findStranger",()=>{

if(waitingQueue.length>0){

const partner=waitingQueue.shift();

socket.partner=partner;
partner.partner=socket;

socket.emit("matched");
partner.emit("matched");

}else{

waitingQueue.push(socket);
socket.emit("waiting");

}

});

socket.on("message",(msg)=>{
if(socket.partner){
socket.partner.emit("message",msg);
}
});

socket.on("typing",()=>{
if(socket.partner){
socket.partner.emit("typing");
}
});

socket.on("disconnect",()=>{
onlineCount--;
io.emit("onlineCount",onlineCount);

if(socket.partner){
socket.partner.emit("disconnectPartner");
socket.partner.partner=null;
}

waitingQueue=waitingQueue.filter(s=>s.id!==socket.id);
});

});

server.listen(3000,()=>{
console.log("Strango running on port 3000");
});
