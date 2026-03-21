// disconnect.js
const { usersQueue, activePairs, sockets } = require("./state");
const { v4: uuidv4 } = require("uuid");
const { matchTwoUsers } = require("../utility/utils.js");
const { success } = require("zod");
const jwt = require("jsonwebtoken");
const Message = require("./models/Message");
const Conversation = require("./models/Conversation");
const { default: mongoose } = require("mongoose");

/* ======================================================
   WEBSOCKET EVENT HANDLERS
====================================================== */ 




const onlineChatUsers = new Map();




// }


function handleConnection(socket, req, wss) {
  socket.id = uuidv4();

  socket.lastPartner = null;

  socket.chatUserId = null;

  console.log("New client connected:", socket.id);

  console.log("Total connected clients:--------->", wss.clients.size);

  console.log("Current active pairs:", activePairs);

  console.log(
    "Total users in queue:------------------------>",
    usersQueue.length,
  );

  /* ===============================
     AUTHENTICATION (SAFE)
  =============================== */

  try {
    const cookies = parseCookies(req.headers?.cookie || "");

    const token = cookies?.token;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      socket.chatUserId = decoded.id;

      /* ===============================
         PREVENT MULTIPLE ACTIVE SOCKETS
      =============================== */

      const existingSocket = onlineChatUsers.get(decoded.id);

      if (
        existingSocket &&
        existingSocket !== socket &&
        existingSocket.readyState === 1
      ) {
        console.log("Closing old socket for user:", decoded.id);

        existingSocket.close();
      }

      onlineChatUsers.set(decoded.id, socket);

      console.log("Chat authenticated:", socket.chatUserId);
    }
  } catch (err) {
    console.log("Invalid token");
  }

  /* ===============================
     STORE SOCKET
  =============================== */

  sockets.set(socket.id, socket);

  /* ===============================
     CLEANUP ON DISCONNECT
  =============================== */

  socket.on("close", () => {
    sockets.delete(socket.id);

    if (socket.chatUserId) {
      onlineChatUsers.delete(socket.chatUserId);
    }

    console.log("Socket cleaned:", socket.id);
  });

  /* ===============================
     SEND CONNECT ACK
  =============================== */

  if (socket.readyState === 1) {
    socket.send(
      JSON.stringify({
        type: "connected",

        id: socket.id,
      }),
    );
  }

  // usersQueue.push(socket.id);

  // matchTwoUsers();
}



function handleMessage(socket, msg) {
  const data = JSON.parse(msg);
  if (data.type == "ping") {
    return;
  }
  console.log("Received message from", socket.id, ":", data.type);

  /* ================= CHAT AUTH ================= */
  // if (data.type === "chat_auth") {
  //   console.log("******************Handling chat auth... auth request received********************************");
  //   return handleChatAuth(socket, data);
  // }

  /* ================= CHAT MESSAGE ================= */
  if (data.type === "chat_message") {
    console.log("Handling chat message...", data.text);
    return handleChatMessage(socket, data);
  }

  // ── READ RECEIPTS ──────────────────────────────────────
  if (data.type === "read") {
    return handleReadReceipt(socket, data);
  }
  // ───────────────────────────────────────────────────────

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
        }),
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
        }),
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
        }),
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
      }),
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
      }),
    );
  }
}



  
 



function handleDisconnect(socket, wss) {
  console.log("Client disconnected:", socket.id);

  console.log(
    "Total connected clients after disconnect:--------->",
    wss.clients.size,
  );
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




async function handleChatMessage(socket, data) {
  console.log("ye socket hai socket:", socket.chatUserId);
  if (!socket.chatUserId) {
    console.warn("Unauthenticated chat message ignored");
    return;
  }

  const { messageId, to, text, createdAt } = data;

  if (!messageId || !to || !text) {
    console.warn("Invalid chat message payload");
    return;
  }

  try {
    const senderId = socket.chatUserId;
    const receiverId = to;

    // 1️⃣ Find existing conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });
    console.log("Existing conversation found:", conversation);

    // 2️⃣ Create conversation if not exists
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],

        requesterId: senderId,

        status: "pending",

        lastMessage: text,

        lastMessageSenderId: senderId,

        lastMessageAt: new Date(createdAt),
      });
    }

    // 3️⃣ Save message
    const savedMessage = await Message.create({
      messageId,

      conversationId: conversation._id,

      senderId,

      receiverId,

      text,

      createdAt: new Date(createdAt),

      status: "sent",
    });
    console.log("Message saved:", savedMessage);

    // 4️⃣ Update conversation last message
    await Conversation.updateOne(
      { _id: conversation._id },

      {
        lastMessage: text,

        lastMessageSenderId: senderId,

        lastMessageAt: savedMessage.createdAt,
      },
    );
    console.log("Conversation updated with last message");

    // 5️⃣ ACK sender (message saved)
    socket.send(
      JSON.stringify({
        type: "ack",

        messageId,

        conversationId: conversation._id,

        status: "sent",
      }),
    );

    // 6️⃣ Deliver message if receiver online
    const receiverSocket = onlineChatUsers.get(receiverId.toString());

    if (receiverSocket && receiverSocket.readyState === 1) {
      receiverSocket.send(
        JSON.stringify({
          type: "chat_deliver",

          message: {
            messageId,

            conversationId: conversation._id,

            from: senderId,

            to: receiverId,

            text,

            createdAt: savedMessage.createdAt,

            status: "delivered",
          },
        }),
      );

      // 7️⃣ Update message status → delivered
      await Message.updateOne(
        { messageId },

        { status: "delivered" },
      );

      // 8️⃣ ACK sender (delivered)
      socket.send(
        JSON.stringify({
          type: "ack",

          messageId,

          conversationId: conversation._id,

          status: "delivered",
        }),
      );
    }
  } catch (err) {
    console.error("handleChatMessage error:", err);
  }
}




// async function handleReadReceipt(socket, data) {
//   if (!socket.chatUserId) return;

//   const { conversationId } = data;
//   if (!conversationId) return;

//   try {
//     const receiverId = socket.chatUserId;

//     // find all unread messages in this conversation sent to this user
//     const unreadMessages = await Message.find({
//       conversationId,
//       receiverId,
//       status: { $in: ["sent", "delivered"] },
//     });

//     if (unreadMessages.length === 0) return;

//     // mark them all as read in DB
//     await Message.updateMany(
//       { conversationId, receiverId, status: { $in: ["sent", "delivered"] } },
//       { $set: { status: "read" } },
//     );

//     // notify the sender for each message
//     for (const msg of unreadMessages) {
//       const senderSocket = onlineChatUsers.get(msg.senderId.toString());
//       if (senderSocket && senderSocket.readyState === WebSocket.OPEN) {
//       senderSocket.send(
//         JSON.stringify({
//           type: "read_ack",
//           messageId: msg.messageId,
//           conversationId: msg.conversationId.toString(),
//           status: "read",
//         }),
//       );
//       }
//     }
//   } catch (err) {
//     console.error("handleReadReceipt error:", err);
//   }
// }


async function handleReadReceipt(socket, data) {
  if (!socket.chatUserId) return;

  const { conversationId } = data;
  if (!conversationId) return;

  console.log("handleReadReceipt called:", {
    conversationId,
    receiverId: socket.chatUserId,
  });

  try {
    const receiverId = new mongoose.Types.ObjectId(socket.chatUserId); // ← convert to ObjectId

    const unreadMessages = await Message.find({
      conversationId: new mongoose.Types.ObjectId(conversationId), // ← convert to ObjectId
      receiverId,
      status: { $in: ["sent", "delivered"] },
    });

    console.log("Unread messages found:", unreadMessages.length);

    if (unreadMessages.length === 0) return;

    await Message.updateMany(
      {
        conversationId: new mongoose.Types.ObjectId(conversationId),
        receiverId,
        status: { $in: ["sent", "delivered"] },
      },
      { $set: { status: "read" } },
    );

    for (const msg of unreadMessages) {
      const senderSocket = onlineChatUsers.get(msg.senderId.toString());
      console.log(
        "Notifying sender:",
        msg.senderId.toString(),
        "socket found:",
        !!senderSocket,
      );
      if (senderSocket && senderSocket.readyState === WebSocket.OPEN) {
        senderSocket.send(
          JSON.stringify({
            type: "read_ack",
            messageId: msg.messageId,
            conversationId: msg.conversationId.toString(),
            status: "read",
          }),
        );
      }
    }
  } catch (err) {
    console.error("handleReadReceipt error:", err);
  }
}






module.exports = { handleDisconnect, handleConnection, handleMessage };