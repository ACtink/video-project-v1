// const { WebSocketServer } = require("ws");

// const {
//   handleDisconnect,
//   handleConnection,
//   handleMessage,
//   handleChatAuth,
// } = require("./handlers");

// function setupWebSocketServer(server) {
//   const wss = new WebSocketServer({ server });

//   wss.on("connection", (socket, req) => {
//     // ---- INITIAL STATE ----
//     socket.isAlive = true;

//     // ---- PONG HANDLER (NO `this`) ----
//     socket.on("pong", () => {
//       socket.isAlive = true;
//     });

//     // ---- AUTH (early) ----
//     // try {
//     //   handleChatAuth(socket, req);
//     // } catch (err) {
//     //   socket.close(4001, "Unauthorized");
//     //   return;
//     // }

//     // ---- CONNECT ----
//     handleConnection(socket, req, wss);

//     // ---- MESSAGE ----
//     socket.on("message", (data) => {
//       try {
//         handleMessage(socket, data);
//       } catch (err) {
//         console.error("WS message error:", err);
//         if (socket.readyState === socket.OPEN) {
//           socket.send(
//             JSON.stringify({
//               type: "error",
//               message: "Invalid message",
//             }),
//           );
//         }
//       }
//     });

//     // ---- CLOSE ----
//     socket.on("close", () => {
//       handleDisconnect(socket, wss);
//     });

//     // ---- ERROR ----
//     socket.on("error", (err) => {
//       console.error("WebSocket error:", err);
//     });
//   });

//   // ---- HEARTBEAT INTERVAL ----
//   const interval = setInterval(() => {
//     wss.clients.forEach((socket) => {
//       if (socket.isAlive === false) {
//         return socket.terminate();
//       }

//       socket.isAlive = false;
//       socket.ping();
//     });
//   }, 30000);

//   // ---- CLEAN SHUTDOWN ----
//   wss.on("close", () => {
//     clearInterval(interval);
//   });

//   return wss;
// }

// module.exports = { setupWebSocketServer };

const { WebSocket, WebSocketServer } = require("ws");

const {
  handleDisconnect,
  handleConnection,
  handleMessage,
  handleChatAuth,
} = require("./handlers");

function setupWebSocketServer(server) {
  const wss = new WebSocketServer({ server });

  // ---- SERVER-LEVEL ERROR ----
  wss.on("error", (err) => {
    console.error("WSS server error:", err);
  });

  wss.on("connection", (socket, req) => {
    // ---- INITIAL STATE ----
    socket.isAlive = true;

    // ---- PONG HANDLER ----
    socket.on("pong", () => {
      socket.isAlive = true;
    });

    // ---- AUTH (early) ----
    // TODO: Uncomment before going to production
    // try {
    //   handleChatAuth(socket, req);
    // } catch (err) {
    //   socket.close(4001, "Unauthorized");
    //   return;
    // }

    // ---- CONNECT ----
    handleConnection(socket, req, wss);

    // ---- MESSAGE ----
    socket.on("message", (data) => {
      try {
        handleMessage(socket, data);
      } catch (err) {
        console.error("WS message error:", err);
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(
            JSON.stringify({
              type: "error",
              message: "Invalid message",
            }),
          );
        }
      }
    });

    // ---- CLOSE ----
    socket.on("close", () => {
      handleDisconnect(socket, wss);
    });

    // ---- ERROR ----
    socket.on("error", (err) => {
      console.error("WebSocket error:", err);
    });
  });

  // ---- HEARTBEAT INTERVAL ----
  const interval = setInterval(() => {
    wss.clients.forEach((client) => {
      if (client.isAlive === false) {
        return client.terminate();
      }

      client.isAlive = false;
      client.ping();
    });
  }, 30000);

  // ---- CLEAN SHUTDOWN ----
  wss.on("close", () => {
    clearInterval(interval);
  });

  return wss;
}

module.exports = { setupWebSocketServer };