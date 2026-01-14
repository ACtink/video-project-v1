const dotenv = require("dotenv");
dotenv.config();

console.log(process.env.MONGO_URI);

console.log(process.env.MODE);

console.log(process.env.PORT);

const connectDB = require("./config/db");



connectDB();

const PORT = process.env.PORT || 3000;

const express = require("express");
const http = require("http");
const { WebSocketServer } = require("ws");
const cors = require("cors");


// const path = require("path");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");

const chatRoutes = require("./routes/chat");


const cookieParser = require("cookie-parser");




const {
  handleDisconnect,
  handleConnection,
  handleMessage,
  handleChatAuth,
} = require("./handlers");
const authMiddleware = require("./middlewares/auth");
// const { sign } = require("crypto");

const app = express();



// ---------- Middleware ----------
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://boomless-plushed-paisley.ngrok-free.dev",
    ],
    credentials: true,
  })
);


app.use(express.json());

app.use(cookieParser());



app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);




// ---------- REST API ----------
app.get("/api/status", (req, res) => {
  res.json({ ok: true, message: "API working!" });
});


app.get("/api/protected", authMiddleware, (req, res) => {
  res.status(401).json({
    message: "Protected data",
  });
})




// app.post("/api/auth/join", joinHandler);

// app.post("/api/auth/login", loginHandler);







app.get("/", (req, res) => {
  res.json({ message: "Hello from server!" });
});

// ---------- HTTP + WebSocket ----------
const server = http.createServer(app);

const wss = new WebSocketServer({ server });





wss.on("connection", (socket, req) => {
  handleConnection(socket, wss);
  handleChatAuth(socket, req); // 👈 HERE

  socket.on("message", (msg) => {
    handleMessage(socket, msg);
  });

  socket.on("close", () => handleDisconnect(socket));
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

