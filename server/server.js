const dotenv = require("dotenv");
dotenv.config({
  path: process.env.NODE_ENV === "production" ? ".env" : ".env.local",
});
const connectDB = require("./config/db");
connectDB();

const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");


const passport = require("passport");
require("./config/passport");


const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const uploadRoutes = require("./routes/upload.routes");
const chatRoutes = require("./routes/chat");
const postRoutes = require("./routes/post.routes");
const notifyRoutes = require("./routes/notifications"); 
const googleAuthRoutes = require("./routes/auth.routes");


const authMiddleware = require("./middlewares/auth");
const { setupWebSocketServer } = require("./wsServer");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(passport.initialize()); // add this with your other middlewares

/* -------------------- CORS -------------------- */

const allowedOrigins = [
  "http://localhost:5173",
  // "https://boomless-plushed-paisley.ngrok-free.dev",
  "https://video-project-v1-frontend-app.onrender.com",
  "https://app.weblinkup.online",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  }),
);

/* -------------------- MIDDLEWARE -------------------- */

app.use(express.json());
app.use(cookieParser());

/* -------------------- ROUTES -------------------- */
app.use("/auth", googleAuthRoutes); // ✅ makes /auth/google work
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/posts", postRoutes);

app.use("/api/notifications", notifyRoutes);
/* -------------------- HEALTH -------------------- */

app.get("/api/status", (req, res) => {
  res.json({ ok: true, message: "API working!" });
});

app.get("/api/protected", authMiddleware, (req, res) => {
  res.status(200).json({
    message: "Protected data",
  });
});

app.get("/", (req, res) => {
  res.json({ message: "Hello from server!" });
});

/* -------------------- HTTP + WS -------------------- */

const server = http.createServer(app);

setupWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
