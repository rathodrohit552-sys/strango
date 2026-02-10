const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("Strango server is running 🚀");
});

// ===============================
// STRANGER CHAT LOGIC (FINAL)
// ===============================

let waitingUser = null;

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Pairing logic
  if (waitingUser === null) {
    waitingUser = socket;
    socket.emit("status", "Waiting for stranger...");
  } else {
    const partner = waitingUser;
    waitingUser = null;

    socket.partner = partner;
    partner.partner = socket;

    socket.emit("status", "Connected to a stranger");
    partner.emit("status", "Connected to a stranger");
  }

  // Message handling
  socket.on("message", (msg) => {
    if (socket.partner) {
      socket.partner.emit("message", msg);
    }
  });

  // NEXT button logic
  socket.on("next", () => {
    if (socket.partner) {
      socket.partner.emit("status", "Stranger disconnected");
      socket.partner.partner = null;
      socket.partner = null;
    }

    if (waitingUser === null) {
      waitingUser = socket;
      socket.emit("status", "Waiting for stranger...");
    }
  });

  // Disconnect handling
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    if (socket.partner) {
      socket.partner.emit("status", "Stranger disconnected");
      socket.partner.partner = null;
    }

    if (waitingUser === socket) {
      waitingUser = null;
    }
  });
});

// ===============================
// START SERVER (RENDER SAFE)
// ===============================

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Strango running on port ${PORT}`);
});
