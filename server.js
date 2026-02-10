const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

let waitingUser = null;
let onlineCount = 0;

function pair(a, b) {
  a.partner = b;
  b.partner = a;
  a.emit("matched");
  b.emit("matched");
}

function clearPartner(socket) {
  if (socket.partner) {
    socket.partner.partner = null;
    socket.partner.emit("partnerDisconnected");
    socket.partner = null;
  }
}

io.on("connection", (socket) => {
  onlineCount++;
  io.emit("onlineCount", onlineCount);

  if (waitingUser) {
    pair(socket, waitingUser);
    waitingUser = null;
  } else {
    waitingUser = socket;
    socket.emit("waiting");
  }

  socket.on("message", (msg) => {
    if (socket.partner) socket.partner.emit("message", msg);
  });

  socket.on("typing", () => {
    if (socket.partner) socket.partner.emit("typing");
  });

  socket.on("stopTyping", () => {
    if (socket.partner) socket.partner.emit("stopTyping");
  });

  socket.on("skip", () => {
    clearPartner(socket);
    if (waitingUser === socket) waitingUser = null;

    if (waitingUser) {
      pair(socket, waitingUser);
      waitingUser = null;
    } else {
      waitingUser = socket;
      socket.emit("waiting");
    }
  });

  socket.on("disconnect", () => {
    onlineCount--;
    io.emit("onlineCount", onlineCount);
    clearPartner(socket);
    if (waitingUser === socket) waitingUser = null;
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Strango running on port ${PORT}`);
});
