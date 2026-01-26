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
const uploadRoutes = require("./routes/upload.routes");

const chatRoutes = require("./routes/chat");
const postRoutes = require("./routes/post.routes");


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
const allowedOrigins = [
  "http://localhost:5173",
  "https://boomless-plushed-paisley.ngrok-free.dev",
  "https://video-project-v1-frontend-app.onrender.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);



app.use(express.json());

app.use(cookieParser());



app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);






app.use("/api/upload", uploadRoutes);

app.use("/api/posts", postRoutes);




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

