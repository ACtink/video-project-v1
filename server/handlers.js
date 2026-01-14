// disconnect.js
const { usersQueue, activePairs, sockets } = require("./state");
const { v4: uuidv4 } = require("uuid");
const { matchTwoUsers } = require("../utility/utils.js");
const { success } = require("zod");
const jwt = require("jsonwebtoken");
const Message = require("./models/Message");

/* ======================================================
   WEBSOCKET EVENT HANDLERS
====================================================== */ 




const onlineChatUsers = new Map();



function handleConnection(socket, wss) {
  socket.id = uuidv4();
  socket.lastPartner = null;
  socket.chatUserId = null;



  console.log("New client connected:", socket.id);
  console.log("Total connected clients:", wss.clients.size);
  console.log("Current active pairs:", activePairs);
    console.log("Total users in queue:", usersQueue.length);



  // Store socket
  sockets.set(socket.id, socket);


  socket.send(JSON.stringify({ type: "connected", id: socket.id }));

  // Add to queue
  // usersQueue.push(socket.id);

  // matchTwoUsers(); // try to match users
}




function handleMessage(socket, msg) {
  const data = JSON.parse(msg);
  if (data.type == "ping") {
    return;
  }
  console.log("Received message from", socket.id, ":", data.type);

  /* ================= CHAT AUTH ================= */
  if (data.type === "chat_auth") {
    return handleChatAuth(socket, data);
  }

  /* ================= CHAT MESSAGE ================= */
  if (data.type === "chat_message") {
    return handleChatMessage(socket, data);
  }

  if (data.type === "join-queue") {
    usersQueue.push(socket.id);
    console.log("*******total users in queue:******", usersQueue.length);
    socket.send(JSON.stringify({ type: "queued_ack", success: "ok" }));

    matchTwoUsers();
    return;
  }

  if (data.type === "leave-queue") {
    const index = usersQueue.indexOf(socket.id);
    if (index !== -1) {
      usersQueue.splice(index, 1);
      console.log("User", socket.id, "left the queue.");
    }
    return;
  }

  if (data.type === "end-call") {
    const userA = socket;
    const userAId = socket.id;

    const userBId = activePairs.get(userAId);
    const userB = sockets.get(userBId);

    console.log("user b first id--->", userBId);

    // ❗ Break pairing ONLY if it exists
    if (userBId) {
      activePairs.delete(userAId);
      activePairs.delete(userBId);
    }

    // Notify partner ONLY if valid & connected
    if (userB && userB.readyState === 1) {
      userB.send(
        JSON.stringify({
          type: "queued_and_searching_next_for_you",
          success: "ok",
        })
      );
    }

    console.log("user b second id--->", userBId);

    // ✅ ADD userB to queue ONLY IF valid and not already queued
    if (userBId && userB && !usersQueue.includes(userBId)) {
      usersQueue.push(userBId);
      console.log("usersqueue----dekh", ...usersQueue);
    }

    // ❗ REMOVE userA from queue if present
    const userAIndex = usersQueue.indexOf(userAId);
    if (userAIndex !== -1) {
      usersQueue.splice(userAIndex, 1);
    }

    // Notify user A
    if (userA && userA.readyState === 1) {
      userA.send(
        JSON.stringify({
          type: "successfully_ended_call",
          reason: "You ended Call",
          success: "ok",
        })
      );
    }

    console.log("usersqueue length after clicking close", usersQueue.length);

    return;
  }

  if (data.type === "next") {
    const userA = socket;
    const userAId = socket.id;

    const userBId = activePairs.get(userAId);
    const userB = sockets.get(userBId);

    // Break pairing for both
    activePairs.delete(userAId);
    activePairs.delete(userBId);

    // Notify partner that the conversation ended
    if (userB && userB.readyState === 1) {
      userB.send(
        JSON.stringify({
          type: "queued_and_searching_next_for_you",
          success: "ok",
        })
      );
    }

    // Requeue ONLY the user who clicked next
    usersQueue.push(userAId);
    usersQueue.push(userBId);

    console.log("*******total users in queue:******", usersQueue.length);

    userA.send(
      JSON.stringify({
        type: "queued_and_searching_next_for_you",
        success: "ok",
      })
    );

    // userA.send(JSON.stringify({ type: "force-disconnect" , reason: "searchingNextForYou"}));

    // Try matching again
    matchTwoUsers();
    return;
  }

  // Relay signaling messages
  const partnerId = activePairs.get(socket.id);
  const partnerSocket = sockets.get(partnerId);

  if (partnerSocket && partnerSocket.readyState === 1) {
    partnerSocket.send(
      JSON.stringify({
        type: data.type,
        offer: data.offer,
        answer: data.answer,
        candidate: data.candidate,
      })
    );
  }
}



  
 



function handleDisconnect(socket) {
  console.log("Client disconnected:", socket.id);

  // Remove from socket map
  sockets.delete(socket.id);

  // Check if user had a partner
  const partnerId = activePairs.get(socket.id);

  if (partnerId) {
    const partnerSocket = sockets.get(partnerId);

    // Notify partner that their peer disconnected
    if (partnerSocket && partnerSocket.readyState === 1) {
      partnerSocket.send(JSON.stringify({ type: "partner-disconnected-websocket-connection" }));
        partnerSocket.send(
          JSON.stringify({
            type: "queued_and_searching_next_for_you",
            success: "ok",
          })
        );

    }

      usersQueue.push(partnerId);


    // Remove both sides of the pairing
    activePairs.delete(socket.id);
    activePairs.delete(partnerId);
  } else {
    // User was not matched → remove from queue
    const index = usersQueue.indexOf(socket.id);
    if (index !== -1) {
      usersQueue.splice(index, 1);
    }
  }
}



function parseCookies(cookieHeader = "") {
  const cookies = {};
  cookieHeader.split("; ").forEach((cookie) => {
    const [key, value] = cookie.split("=");
    if (key && value) cookies[key] = value;
  });
  return cookies;
}



function handleChatAuth(socket, req) {
  try {
    const cookies = parseCookies(req.headers.cookie || "");
    const token = cookies.token;

    if (!token) {
      // Not logged in → allow WebRTC only
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.chatUserId = decoded.id;
    onlineChatUsers.set(decoded.id, socket);

    console.log("Chat authenticated via cookie:", socket.chatUserId);
  } catch (err) {
    console.error("Chat auth failed (invalid token)");
    // ❌ Do NOT close socket — user may still use WebRTC
  }
}



/* ======================================================
   CHAT MESSAGE HANDLER
====================================================== */
async function handleChatMessage(socket, data) {
  if (!socket.chatUserId) {
    console.warn("Unauthenticated chat message ignored");
    return;
  }

  const { messageId, to, text, createdAt } = data;

  try {
    // 1️⃣ Save message
    const saved = await Message.create({
      senderId: socket.chatUserId,
      receiverId: to,
      text,
      createdAt: new Date(createdAt),
    });

    // 2️⃣ ACK sender (saved)
    socket.send(
      JSON.stringify({
        type: "ack",
        messageId,
        status: "sent",
      })
    );

    // 3️⃣ Deliver if receiver online
    const receiverSocket = onlineChatUsers.get(to);
     

    if (receiverSocket && receiverSocket.readyState === 1) {
      receiverSocket.send(
        JSON.stringify({
          type: "chat_deliver",
          message: {
            messageId,
            from: socket.chatUserId,
            text,
            createdAt: saved.createdAt,
          },
        })
      );

      // 4️⃣ ACK delivered
      socket.send(
        JSON.stringify({
          type: "ack",
          messageId,
          status: "delivered",
        })
      );
    }
  } catch (err) {
    console.error("Chat message error:", err);
  }
}


















module.exports = { handleDisconnect, handleConnection , handleMessage , handleChatAuth };
