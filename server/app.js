
const express = require("express");
const bodyParser = require("body-parser");
const { Server } = require("socket.io");

const io = new Server({ cors: true });
const app = express();


console.log(process.env) // 
const port = process.env.PORT || 5000;

app.use(bodyParser.json());

const emailToSocketMapping = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Handling user joining the room
  socket.on("join-room", (data) => {
    const { email, roomId } = data;
    console.log(`User ${email} joined room ${roomId}`);
    emailToSocketMapping.set(email, socket.id); // Map email to socket ID
    socket.join(roomId); // Join the room
    socket.broadcast.to(roomId).emit("user-connected", email); // Notify other users in the room
  });

  // Handling call initiation
  socket.on("call-user", (data) => {
    const { email, offer } = data;
    console.log(`Calling user ${email}`);
    const calleeSocketId = emailToSocketMapping.get(email);
    if (calleeSocketId) {
      socket.to(calleeSocketId).emit("incoming-call", {
        offer,
        socket: socket.id,
      });
    } else {
      console.log(`User ${email} is not available`);
    }
  });

  // Handling call acceptance
  socket.on("call-accepted", (data) => {
    const { answer, socket: callerSocketId } = data;
    console.log(`Call accepted by ${callerSocketId}`);
    socket.to(callerSocketId).emit("call-accepted", answer);
  });
});

// Basic route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Start the Express server
app.listen(port, () => {
  console.log(`Express server is running on port ${port}`);
});

// Start the Socket.io server on a different port
io.listen(5001);
