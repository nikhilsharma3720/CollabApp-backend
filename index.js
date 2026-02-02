require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const connectDB = require("./database");
const authRouter = require("./routes/authRouter");
const boardRouter = require("./routes/boardRouter");
const loadRouter = require("./routes/laodRouter");
const teamRouter = require("./routes/teamRouter");

// Connect to Database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Configuration for CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:4173",
  "https://collab-app-mesa.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

/* ================= SOCKET.IO HANDLERS ================= */

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // Handle joining a team room
  socket.on("joinTeam", (data) => {
    // Handle both object {teamId} and string formats
    const teamId = typeof data === "string" ? data : data.teamId;

    // Ensure room name consistency (e.g., "team:67a0...")
    const roomName = teamId.startsWith("team:") ? teamId : `team:${teamId}`;

    socket.join(roomName);
    console.log(`👤 User ${socket.id} joined room: ${roomName}`);

    // Update online count for this specific room
    const members = io.sockets.adapter.rooms.get(roomName);
    io.to(roomName).emit("team-users-count", members ? members.size : 0);
  });

  // Handle user disconnecting
  socket.on("disconnecting", () => {
    // Update counts for all rooms the user was in before they leave
    socket.rooms.forEach((room) => {
      if (room.startsWith("team:")) {
        const members = io.sockets.adapter.rooms.get(room);
        // We subtract 1 because the user is still in the Set until "disconnect"
        io.to(room).emit("team-users-count", members ? members.size - 1 : 0);
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

/* ================= MIDDLEWARE & ROUTES ================= */

// Pass io instance to all requests so controllers can use req.io
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use(authRouter);
app.use(loadRouter);
app.use(boardRouter);
app.use(teamRouter);

app.get("/", (req, res) => res.send("Backend is running!"));

// Start Server (Use server.listen, NOT app.listen)
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = { io, server };
