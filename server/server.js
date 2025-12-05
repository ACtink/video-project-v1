const express = require("express");
const http = require("http");
const { WebSocketServer } = require("ws");

const path = require("path");


const { handleDisconnect , handleConnection , handleMessage } = require("./handlers");


const app = express();


app.use(express.static(path.join(__dirname, "../client")));


// REST API routes
app.get("/api/status", (req, res) => {
  res.json({ ok: true, message: "API working!" });
});

app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../client/index.html"));
});

const server = http.createServer(app);

// WebSocket Server
const wss = new WebSocketServer({ server });

// Signaling logic
wss.on("connection", (socket) => {
  
    handleConnection(socket);

  socket.on("message", (msg) => {
     handleMessage(socket, msg);
  });

  // On disconnect
socket.on("close", () => handleDisconnect(socket));


})

server.listen(3000, () => {
  console.log("Server running on port 3000");
});
