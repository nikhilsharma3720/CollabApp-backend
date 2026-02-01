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

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "http://localhost:5173",
  "https://collab-app-mesa.vercel.app"
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);

app.use(express.json());
app.use(cookieParser());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(authRouter);
app.use(loadRouter);
app.use(boardRouter);
app.use(teamRouter);

app.get("/", (req, res) => res.send("Backend is running!"));

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { io, server };
