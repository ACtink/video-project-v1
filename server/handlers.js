// // disconnect.js
// const { usersQueue, activePairs, sockets } = require("./state");
// const { v4: uuidv4 } = require("uuid");
// const { matchTwoUsers } = require("../utility/utils.js");
// const { success } = require("zod");
// const jwt = require("jsonwebtoken");
// const Message = require("./models/Message");
// const Conversation = require("./models/Conversation");
// const { default: mongoose } = require("mongoose");

// /* ======================================================
//    WEBSOCKET EVENT HANDLERS
// ====================================================== */

// const onlineChatUsers = new Map();

// // }

// function handleConnection(socket, req, wss) {
//   socket.id = uuidv4();

//   socket.lastPartner = null;

//   socket.chatUserId = null;

//   console.log("New client connected:", socket.id);

//   console.log("Total connected clients:--------->", wss.clients.size);

//   console.log("Current active pairs:", activePairs);

//   console.log(
//     "Total users in queue:------------------------>",
//     usersQueue.length,
//   );

//   /* ===============================
//      AUTHENTICATION (SAFE)
//   =============================== */

//   try {
//     const cookies = parseCookies(req.headers?.cookie || "");

//     const token = cookies?.token;

//     if (token) {
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);

//       socket.chatUserId = decoded.id;

//       /* ===============================
//          PREVENT MULTIPLE ACTIVE SOCKETS
//       =============================== */

//       const existingSocket = onlineChatUsers.get(decoded.id);

//       if (
//         existingSocket &&
//         existingSocket !== socket &&
//         existingSocket.readyState === 1
//       ) {
//         console.log("Closing old socket for user:", decoded.id);

//         existingSocket.close();
//       }

//       onlineChatUsers.set(decoded.id, socket);

//       console.log("Chat authenticated:", socket.chatUserId);
//     }
//   } catch (err) {
//     console.log("Invalid token");
//   }

//   /* ===============================
//      STORE SOCKET
//   =============================== */

//   sockets.set(socket.id, socket);

//   /* ===============================
//      CLEANUP ON DISCONNECT
//   =============================== */

//   socket.on("close", () => {
//     sockets.delete(socket.id);

//     if (socket.chatUserId) {
//       onlineChatUsers.delete(socket.chatUserId);
//     }

//     console.log("Socket cleaned:", socket.id);
//   });

//   /* ===============================
//      SEND CONNECT ACK
//   =============================== */

//   if (socket.readyState === 1) {
//     socket.send(
//       JSON.stringify({
//         type: "connected",

//         id: socket.id,
//       }),
//     );
//   }

//   // usersQueue.push(socket.id);

//   // matchTwoUsers();
// }

// function handleMessage(socket, msg) {
//   const data = JSON.parse(msg);
//   if (data.type == "ping") {
//     return;
//   }
//   console.log("Received message from", socket.id, ":", data.type);

//   /* ================= CHAT AUTH ================= */
//   // if (data.type === "chat_auth") {
//   //   console.log("******************Handling chat auth... auth request received********************************");
//   //   return handleChatAuth(socket, data);
//   // }

//   /* ================= CHAT MESSAGE ================= */
//   if (data.type === "chat_message") {
//     console.log("Handling chat message...", data.text);
//     return handleChatMessage(socket, data);
//   }

//   // ── READ RECEIPTS ──────────────────────────────────────
//   if (data.type === "read") {
//     return handleReadReceipt(socket, data);
//   }
//   // ───────────────────────────────────────────────────────

//   if (data.type === "join-queue") {
//     usersQueue.push(socket.id);
//     console.log("*******total users in queue:******", usersQueue.length);
//     socket.send(JSON.stringify({ type: "queued_ack", success: "ok" }));

//     matchTwoUsers();
//     return;
//   }

//   if (data.type === "leave-queue") {
//     const index = usersQueue.indexOf(socket.id);
//     if (index !== -1) {
//       usersQueue.splice(index, 1);
//       console.log("User", socket.id, "left the queue.");
//     }
//     return;
//   }

//   if (data.type === "end-call") {
//     const userA = socket;
//     const userAId = socket.id;

//     const userBId = activePairs.get(userAId);
//     const userB = sockets.get(userBId);

//     console.log("user b first id--->", userBId);

//     // ❗ Break pairing ONLY if it exists
//     if (userBId) {
//       activePairs.delete(userAId);
//       activePairs.delete(userBId);
//     }

//     // Notify partner ONLY if valid & connected
//     if (userB && userB.readyState === 1) {
//       userB.send(
//         JSON.stringify({
//           type: "queued_and_searching_next_for_you",
//           success: "ok",
//         }),
//       );
//     }

//     console.log("user b second id--->", userBId);

//     // ✅ ADD userB to queue ONLY IF valid and not already queued
//     if (userBId && userB && !usersQueue.includes(userBId)) {
//       usersQueue.push(userBId);
//       console.log("usersqueue----dekh", ...usersQueue);
//     }

//     // ❗ REMOVE userA from queue if present
//     const userAIndex = usersQueue.indexOf(userAId);
//     if (userAIndex !== -1) {
//       usersQueue.splice(userAIndex, 1);
//     }

//     // Notify user A
//     if (userA && userA.readyState === 1) {
//       userA.send(
//         JSON.stringify({
//           type: "successfully_ended_call",
//           reason: "You ended Call",
//           success: "ok",
//         }),
//       );
//     }

//     console.log("usersqueue length after clicking close", usersQueue.length);

//     return;
//   }

//   if (data.type === "next") {
//     const userA = socket;
//     const userAId = socket.id;

//     const userBId = activePairs.get(userAId);
//     const userB = sockets.get(userBId);

//     // Break pairing for both
//     activePairs.delete(userAId);
//     activePairs.delete(userBId);

//     // Notify partner that the conversation ended
//     if (userB && userB.readyState === 1) {
//       userB.send(
//         JSON.stringify({
//           type: "queued_and_searching_next_for_you",
//           success: "ok",
//         }),
//       );
//     }

//     // Requeue ONLY the user who clicked next
//     usersQueue.push(userAId);
//     usersQueue.push(userBId);

//     console.log("*******total users in queue:******", usersQueue.length);

//     userA.send(
//       JSON.stringify({
//         type: "queued_and_searching_next_for_you",
//         success: "ok",
//       }),
//     );

//     // userA.send(JSON.stringify({ type: "force-disconnect" , reason: "searchingNextForYou"}));

//     // Try matching again
//     matchTwoUsers();
//     return;
//   }

//   // Relay signaling messages
//   const partnerId = activePairs.get(socket.id);
//   const partnerSocket = sockets.get(partnerId);

//   if (partnerSocket && partnerSocket.readyState === 1) {
//     partnerSocket.send(
//       JSON.stringify({
//         type: data.type,
//         offer: data.offer,
//         answer: data.answer,
//         candidate: data.candidate,
//       }),
//     );
//   }
// }

// function handleDisconnect(socket, wss) {
//   console.log("Client disconnected:", socket.id);

//   console.log(
//     "Total connected clients after disconnect:--------->",
//     wss.clients.size,
//   );
//   // Remove from socket map
//   sockets.delete(socket.id);

//   // Check if user had a partner
//   const partnerId = activePairs.get(socket.id);

//   if (partnerId) {
//     const partnerSocket = sockets.get(partnerId);

//     // Notify partner that their peer disconnected
//     if (partnerSocket && partnerSocket.readyState === 1) {
//       partnerSocket.send(JSON.stringify({ type: "partner-disconnected-websocket-connection" }));
//         partnerSocket.send(
//           JSON.stringify({
//             type: "queued_and_searching_next_for_you",
//             success: "ok",
//           })
//         );

//     }

//       usersQueue.push(partnerId);

//     // Remove both sides of the pairing
//     activePairs.delete(socket.id);
//     activePairs.delete(partnerId);
//   } else {
//     // User was not matched → remove from queue
//     const index = usersQueue.indexOf(socket.id);
//     if (index !== -1) {
//       usersQueue.splice(index, 1);
//     }
//   }
// }

// function parseCookies(cookieHeader = "") {
//   const cookies = {};
//   cookieHeader.split("; ").forEach((cookie) => {
//     const [key, value] = cookie.split("=");
//     if (key && value) cookies[key] = value;
//   });
//   return cookies;
// }

// async function handleChatMessage(socket, data) {
//   console.log("ye socket hai socket:", socket.chatUserId);
//   if (!socket.chatUserId) {
//     console.warn("Unauthenticated chat message ignored");
//     return;
//   }

//   const { messageId, to, text, createdAt } = data;

//   if (!messageId || !to || !text) {
//     console.warn("Invalid chat message payload");
//     return;
//   }

//   try {
//     const senderId = socket.chatUserId;
//     const receiverId = to;

//     // 1️⃣ Find existing conversation
//     let conversation = await Conversation.findOne({
//       participants: { $all: [senderId, receiverId] },
//     });
//     console.log("Existing conversation found:", conversation);

//     // 2️⃣ Create conversation if not exists
//     if (!conversation) {
//       conversation = await Conversation.create({
//         participants: [senderId, receiverId],

//         requesterId: senderId,

//         status: "pending",

//         lastMessage: text,

//         lastMessageSenderId: senderId,

//         lastMessageAt: new Date(createdAt),
//       });
//     }

//     // 3️⃣ Save message
//     const savedMessage = await Message.create({
//       messageId,

//       conversationId: conversation._id,

//       senderId,

//       receiverId,

//       text,

//       createdAt: new Date(createdAt),

//       status: "sent",
//     });
//     console.log("Message saved:", savedMessage);

//     // 4️⃣ Update conversation last message
//     await Conversation.updateOne(
//       { _id: conversation._id },

//       {
//         lastMessage: text,

//         lastMessageSenderId: senderId,

//         lastMessageAt: savedMessage.createdAt,
//       },
//     );
//     console.log("Conversation updated with last message");

//     // 5️⃣ ACK sender (message saved)
//     socket.send(
//       JSON.stringify({
//         type: "ack",

//         messageId,

//         conversationId: conversation._id,

//         status: "sent",
//       }),
//     );

//     // 6️⃣ Deliver message if receiver online
//     const receiverSocket = onlineChatUsers.get(receiverId.toString());

//     if (receiverSocket && receiverSocket.readyState === 1) {
//       receiverSocket.send(
//         JSON.stringify({
//           type: "chat_deliver",

//           message: {
//             messageId,

//             conversationId: conversation._id,

//             from: senderId,

//             to: receiverId,

//             text,

//             createdAt: savedMessage.createdAt,

//             status: "delivered",
//           },
//         }),
//       );

//       // 7️⃣ Update message status → delivered
//       await Message.updateOne(
//         { messageId },

//         { status: "delivered" },
//       );

//       // 8️⃣ ACK sender (delivered)
//       socket.send(
//         JSON.stringify({
//           type: "ack",

//           messageId,

//           conversationId: conversation._id,

//           status: "delivered",
//         }),
//       );
//     }
//   } catch (err) {
//     console.error("handleChatMessage error:", err);
//   }
// }

// // async function handleReadReceipt(socket, data) {
// //   if (!socket.chatUserId) return;

// //   const { conversationId } = data;
// //   if (!conversationId) return;

// //   try {
// //     const receiverId = socket.chatUserId;

// //     // find all unread messages in this conversation sent to this user
// //     const unreadMessages = await Message.find({
// //       conversationId,
// //       receiverId,
// //       status: { $in: ["sent", "delivered"] },
// //     });

// //     if (unreadMessages.length === 0) return;

// //     // mark them all as read in DB
// //     await Message.updateMany(
// //       { conversationId, receiverId, status: { $in: ["sent", "delivered"] } },
// //       { $set: { status: "read" } },
// //     );

// //     // notify the sender for each message
// //     for (const msg of unreadMessages) {
// //       const senderSocket = onlineChatUsers.get(msg.senderId.toString());
// //       if (senderSocket && senderSocket.readyState === WebSocket.OPEN) {
// //       senderSocket.send(
// //         JSON.stringify({
// //           type: "read_ack",
// //           messageId: msg.messageId,
// //           conversationId: msg.conversationId.toString(),
// //           status: "read",
// //         }),
// //       );
// //       }
// //     }
// //   } catch (err) {
// //     console.error("handleReadReceipt error:", err);
// //   }
// // }

// async function handleReadReceipt(socket, data) {
//   if (!socket.chatUserId) return;

//   const { conversationId } = data;
//   if (!conversationId) return;

//   console.log("handleReadReceipt called:", {
//     conversationId,
//     receiverId: socket.chatUserId,
//   });

//   try {
//     const receiverId = new mongoose.Types.ObjectId(socket.chatUserId); // ← convert to ObjectId

//     const unreadMessages = await Message.find({
//       conversationId: new mongoose.Types.ObjectId(conversationId), // ← convert to ObjectId
//       receiverId,
//       status: { $in: ["sent", "delivered"] },
//     });

//     console.log("Unread messages found:", unreadMessages.length);

//     if (unreadMessages.length === 0) return;

//     await Message.updateMany(
//       {
//         conversationId: new mongoose.Types.ObjectId(conversationId),
//         receiverId,
//         status: { $in: ["sent", "delivered"] },
//       },
//       { $set: { status: "read" } },
//     );

//     for (const msg of unreadMessages) {
//       const senderSocket = onlineChatUsers.get(msg.senderId.toString());
//       console.log(
//         "Notifying sender:",
//         msg.senderId.toString(),
//         "socket found:",
//         !!senderSocket,
//       );
//       if (senderSocket && senderSocket.readyState === WebSocket.OPEN) {
//         senderSocket.send(
//           JSON.stringify({
//             type: "read_ack",
//             messageId: msg.messageId,
//             conversationId: msg.conversationId.toString(),
//             status: "read",
//           }),
//         );
//       }
//     }
//   } catch (err) {
//     console.error("handleReadReceipt error:", err);
//   }
// }

// module.exports = { handleDisconnect, handleConnection, handleMessage };

// disconnect.js
// const { usersQueue, activePairs, sockets } = require("./state");
// const { v4: uuidv4 } = require("uuid");
// const { matchTwoUsers } = require("../utility/utils.js");
// const { success } = require("zod");
// const jwt = require("jsonwebtoken");
// const Message = require("./models/Message");
// const Conversation = require("./models/Conversation");
// const User = require("./models/User"); // ← added
// const { default: mongoose } = require("mongoose");

// const onlineChatUsers = new Map();

// function handleConnection(socket, req, wss) {
//   socket.id = uuidv4();
//   socket.lastPartner = null;
//   socket.chatUserId = null;

//   console.log("New client connected:", socket.id);
//   console.log("Total connected clients:--------->", wss.clients.size);
//   console.log("Current active pairs:", activePairs);
//   console.log("Total users in queue:------------------------>", usersQueue.length);

//   try {
//     const cookies = parseCookies(req.headers?.cookie || "");
//     const token = cookies?.token;

//     if (token) {
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       socket.chatUserId = decoded.id;

//       const existingSocket = onlineChatUsers.get(decoded.id);
//       if (existingSocket && existingSocket !== socket && existingSocket.readyState === 1) {
//         console.log("Closing old socket for user:", decoded.id);
//         existingSocket.close();
//       }

//       onlineChatUsers.set(decoded.id, socket);
//       console.log("Chat authenticated:", socket.chatUserId);
//     }
//   } catch (err) {
//     console.log("Invalid token");
//   }

//   sockets.set(socket.id, socket);

//   socket.on("close", () => {
//     sockets.delete(socket.id);
//     if (socket.chatUserId) {
//       onlineChatUsers.delete(socket.chatUserId);
//     }
//     console.log("Socket cleaned:", socket.id);
//   });

//   if (socket.readyState === 1) {
//     socket.send(JSON.stringify({ type: "connected", id: socket.id }));
//   }
// }

// function handleMessage(socket, msg) {
//   const data = JSON.parse(msg);
//   if (data.type == "ping") return;

//   console.log("Received message from", socket.id, ":", data.type);

//   if (data.type === "chat_message") {
//     console.log("Handling chat message...", data.text);
//     return handleChatMessage(socket, data);
//   }

//   if (data.type === "read") {
//     return handleReadReceipt(socket, data);
//   }

//   if (data.type === "join-queue") {
//     usersQueue.push(socket.id);
//     console.log("*******total users in queue:******", usersQueue.length);
//     socket.send(JSON.stringify({ type: "queued_ack", success: "ok" }));
//     matchTwoUsers();
//     return;
//   }

//   if (data.type === "leave-queue") {
//     const index = usersQueue.indexOf(socket.id);
//     if (index !== -1) {
//       usersQueue.splice(index, 1);
//       console.log("User", socket.id, "left the queue.");
//     }
//     return;
//   }

//   if (data.type === "end-call") {
//     const userA = socket;
//     const userAId = socket.id;
//     const userBId = activePairs.get(userAId);
//     const userB = sockets.get(userBId);

//     console.log("user b first id--->", userBId);

//     if (userBId) {
//       activePairs.delete(userAId);
//       activePairs.delete(userBId);
//     }

//     if (userB && userB.readyState === 1) {
//       userB.send(JSON.stringify({ type: "queued_and_searching_next_for_you", success: "ok" }));
//     }

//     console.log("user b second id--->", userBId);

//     if (userBId && userB && !usersQueue.includes(userBId)) {
//       usersQueue.push(userBId);
//       console.log("usersqueue----dekh", ...usersQueue);
//     }

//     const userAIndex = usersQueue.indexOf(userAId);
//     if (userAIndex !== -1) {
//       usersQueue.splice(userAIndex, 1);
//     }

//     if (userA && userA.readyState === 1) {
//       userA.send(JSON.stringify({ type: "successfully_ended_call", reason: "You ended Call", success: "ok" }));
//     }

//     console.log("usersqueue length after clicking close", usersQueue.length);
//     return;
//   }

//   if (data.type === "next") {
//     const userA = socket;
//     const userAId = socket.id;
//     const userBId = activePairs.get(userAId);
//     const userB = sockets.get(userBId);

//     activePairs.delete(userAId);
//     activePairs.delete(userBId);

//     if (userB && userB.readyState === 1) {
//       userB.send(JSON.stringify({ type: "queued_and_searching_next_for_you", success: "ok" }));
//     }

//     usersQueue.push(userAId);
//     usersQueue.push(userBId);

//     console.log("*******total users in queue:******", usersQueue.length);

//     userA.send(JSON.stringify({ type: "queued_and_searching_next_for_you", success: "ok" }));

//     matchTwoUsers();
//     return;
//   }

//   // Relay signaling messages
//   const partnerId = activePairs.get(socket.id);
//   const partnerSocket = sockets.get(partnerId);

//   if (partnerSocket && partnerSocket.readyState === 1) {
//     partnerSocket.send(
//       JSON.stringify({
//         type: data.type,
//         offer: data.offer,
//         answer: data.answer,
//         candidate: data.candidate,
//       }),
//     );
//   }
// }

// function handleDisconnect(socket, wss) {
//   console.log("Client disconnected:", socket.id);
//   console.log("Total connected clients after disconnect:--------->", wss.clients.size);

//   sockets.delete(socket.id);

//   const partnerId = activePairs.get(socket.id);

//   if (partnerId) {
//     const partnerSocket = sockets.get(partnerId);

//     if (partnerSocket && partnerSocket.readyState === 1) {
//       partnerSocket.send(JSON.stringify({ type: "partner-disconnected-websocket-connection" }));
//       partnerSocket.send(JSON.stringify({ type: "queued_and_searching_next_for_you", success: "ok" }));
//     }

//     usersQueue.push(partnerId);
//     activePairs.delete(socket.id);
//     activePairs.delete(partnerId);
//   } else {
//     const index = usersQueue.indexOf(socket.id);
//     if (index !== -1) {
//       usersQueue.splice(index, 1);
//     }
//   }
// }

// function parseCookies(cookieHeader = "") {
//   const cookies = {};
//   cookieHeader.split("; ").forEach((cookie) => {
//     const [key, value] = cookie.split("=");
//     if (key && value) cookies[key] = value;
//   });
//   return cookies;
// }

// async function handleChatMessage(socket, data) {
//   console.log("ye socket hai socket:", socket.chatUserId);
//   if (!socket.chatUserId) {
//     console.warn("Unauthenticated chat message ignored");
//     return;
//   }

//   const { messageId, to, text, createdAt } = data;

//   if (!messageId || !to || !text) {
//     console.warn("Invalid chat message payload");
//     return;
//   }

//   try {
//     const senderId = socket.chatUserId;
//     const receiverId = to;

//     // ── BLOCK CHECK ──────────────────────────────────────
//     const receiver = await User.findById(receiverId).select("blockedUsers");
//     const sender = await User.findById(senderId).select("blockedUsers");

//     if (!receiver || !sender) {
//       console.warn("Sender or receiver not found");
//       return;
//     }

//     const receiverBlockedSender = receiver.blockedUsers
//       .map(String)
//       .includes(String(senderId));

//     const senderBlockedReceiver = sender.blockedUsers
//       .map(String)
//       .includes(String(receiverId));

//     if (receiverBlockedSender || senderBlockedReceiver) {
//       socket.send(
//         JSON.stringify({
//           type: "message_blocked",
//           messageId,
//           reason: receiverBlockedSender
//             ? "You have been blocked by this user"
//             : "You have blocked this user",
//         }),
//       );
//       return;
//     }
//     // ─────────────────────────────────────────────────────

//     // 1️⃣ Find existing conversation
//     let conversation = await Conversation.findOne({
//       participants: { $all: [senderId, receiverId] },
//     });
//     console.log("Existing conversation found:", conversation);

//     // 2️⃣ Create conversation if not exists
//     if (!conversation) {
//       conversation = await Conversation.create({
//         participants: [senderId, receiverId],
//         requesterId: senderId,
//         status: "pending",
//         lastMessage: text,
//         lastMessageSenderId: senderId,
//         lastMessageAt: new Date(createdAt),
//       });
//     }

//     // 3️⃣ Save message
//     const savedMessage = await Message.create({
//       messageId,
//       conversationId: conversation._id,
//       senderId,
//       receiverId,
//       text,
//       createdAt: new Date(createdAt),
//       status: "sent",
//     });
//     console.log("Message saved:", savedMessage);

//     // 4️⃣ Update conversation last message
//     await Conversation.updateOne(
//       { _id: conversation._id },
//       {
//         lastMessage: text,
//         lastMessageSenderId: senderId,
//         lastMessageAt: savedMessage.createdAt,
//       },
//     );
//     console.log("Conversation updated with last message");

//     // 5️⃣ ACK sender (message saved)
//     socket.send(
//       JSON.stringify({
//         type: "ack",
//         messageId,
//         conversationId: conversation._id,
//         status: "sent",
//       }),
//     );

//     // 6️⃣ Deliver message if receiver online
//     const receiverSocket = onlineChatUsers.get(receiverId.toString());

//     if (receiverSocket && receiverSocket.readyState === 1) {
//       receiverSocket.send(
//         JSON.stringify({
//           type: "chat_deliver",
//           message: {
//             messageId,
//             conversationId: conversation._id,
//             from: senderId,
//             to: receiverId,
//             text,
//             createdAt: savedMessage.createdAt,
//             status: "delivered",
//           },
//         }),
//       );

//       // 7️⃣ Update message status → delivered
//       await Message.updateOne({ messageId }, { status: "delivered" });

//       // 8️⃣ ACK sender (delivered)
//       socket.send(
//         JSON.stringify({
//           type: "ack",
//           messageId,
//           conversationId: conversation._id,
//           status: "delivered",
//         }),
//       );
//     }
//   } catch (err) {
//     console.error("handleChatMessage error:", err);
//   }
// }

// async function handleReadReceipt(socket, data) {
//   if (!socket.chatUserId) return;

//   const { conversationId } = data;
//   if (!conversationId) return;

//   console.log("handleReadReceipt called:", {
//     conversationId,
//     receiverId: socket.chatUserId,
//   });

//   try {
//     const receiverId = new mongoose.Types.ObjectId(socket.chatUserId);

//     const unreadMessages = await Message.find({
//       conversationId: new mongoose.Types.ObjectId(conversationId),
//       receiverId,
//       status: { $in: ["sent", "delivered"] },
//     });

//     console.log("Unread messages found:", unreadMessages.length);

//     if (unreadMessages.length === 0) return;

//     await Message.updateMany(
//       {
//         conversationId: new mongoose.Types.ObjectId(conversationId),
//         receiverId,
//         status: { $in: ["sent", "delivered"] },
//       },
//       { $set: { status: "read" } },
//     );

//     for (const msg of unreadMessages) {
//       const senderSocket = onlineChatUsers.get(msg.senderId.toString());
//       console.log("Notifying sender:", msg.senderId.toString(), "socket found:", !!senderSocket);
//       if (senderSocket && senderSocket.readyState === WebSocket.OPEN) {
//         senderSocket.send(
//           JSON.stringify({
//             type: "read_ack",
//             messageId: msg.messageId,
//             conversationId: msg.conversationId.toString(),
//             status: "read",
//           }),
//         );
//       }
//     }
//   } catch (err) {
//     console.error("handleReadReceipt error:", err);
//   }
// }

// module.exports = { handleDisconnect, handleConnection, handleMessage };

// const { usersQueue, activePairs, sockets } = require("./state");
// const { v4: uuidv4 } = require("uuid");
// const { matchTwoUsers } = require("../utility/utils.js");
// const { success } = require("zod");
// const jwt = require("jsonwebtoken");
// const Message = require("./models/Message");
// const Conversation = require("./models/Conversation");
// const User = require("./models/User");
// const { default: mongoose } = require("mongoose");

// // ── FIX: WebSocket is a browser global — it does not exist in Node.js.
// // Using WebSocket.OPEN in server code always evaluates to undefined === undefined
// // which is true by accident for some states, or causes silent failures.
// // Use the numeric constant directly: 1 = OPEN, 3 = CLOSED.
// const WS_OPEN = 1;

// const onlineChatUsers = new Map();

// function broadcastOnlineStatus(wss) {
//   const onlineUserIds = Array.from(onlineChatUsers.keys());
//   const message = JSON.stringify({
//     type: "online_users",
//     userIds: onlineUserIds,
//   });

//   wss.clients.forEach((client) => {
//     if (client.readyState === WS_OPEN) {
//       client.send(message);
//     }
//   });
// }

// function handleConnection(socket, req, wss) {
//   socket.id = uuidv4();
//   socket.lastPartner = null;
//   socket.chatUserId = null;

//   console.log("New client connected:", socket.id);
//   console.log("Total connected clients:", wss.clients.size);

//   try {
//     const cookies = parseCookies(req.headers?.cookie || "");
//     const token = cookies?.token;

//     if (token) {
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       socket.chatUserId = decoded.id;

//       const existingSocket = onlineChatUsers.get(decoded.id);
//       if (
//         existingSocket &&
//         existingSocket !== socket &&
//         existingSocket.readyState === WS_OPEN
//       ) {
//         console.log("Closing old socket for user:", decoded.id);
//         existingSocket.close();
//       }

//       onlineChatUsers.set(decoded.id, socket);
//       console.log("Chat authenticated:", socket.chatUserId);
//       broadcastOnlineStatus(wss); // ← here
//     }
//   } catch (err) {
//     console.log("Invalid token");
//   }

//   sockets.set(socket.id, socket);

//   socket.on("close", () => {
//     sockets.delete(socket.id);
//     if (socket.chatUserId) {
//       onlineChatUsers.delete(socket.chatUserId);
//       broadcastOnlineStatus(wss); // ← here
//     }
//     console.log("Socket cleaned:", socket.id);
//   });

//   if (socket.readyState === WS_OPEN) {
//     socket.send(JSON.stringify({ type: "connected", id: socket.id }));
//   }
// }

// function handleMessage(socket, msg) {
//   const data = JSON.parse(msg);
//   if (data.type === "ping") return;

//   console.log("Received message from", socket.id, ":", data.type);

//   if (data.type === "chat_message") {
//     return handleChatMessage(socket, data);
//   }

//   if (data.type === "ack") {
//     return handleClientAck(socket, data);
//   }

//   if (data.type === "read") {
//     return handleReadReceipt(socket, data);
//   }

//   if (data.type === "join-queue") {
//     usersQueue.push(socket.id);
//     socket.send(JSON.stringify({ type: "queued_ack", success: "ok" }));
//     matchTwoUsers();
//     return;
//   }

//   if (data.type === "leave-queue") {
//     const index = usersQueue.indexOf(socket.id);
//     if (index !== -1) usersQueue.splice(index, 1);
//     return;
//   }

//   if (data.type === "end-call") {
//     const userA = socket;
//     const userAId = socket.id;
//     const userBId = activePairs.get(userAId);
//     const userB = sockets.get(userBId);

//     if (userBId) {
//       activePairs.delete(userAId);
//       activePairs.delete(userBId);
//     }

//     if (userB && userB.readyState === WS_OPEN) {
//       userB.send(
//         JSON.stringify({
//           type: "queued_and_searching_next_for_you",
//           success: "ok",
//         }),
//       );
//     }

//     if (userBId && userB && !usersQueue.includes(userBId)) {
//       usersQueue.push(userBId);
//     }

//     const userAIndex = usersQueue.indexOf(userAId);
//     if (userAIndex !== -1) usersQueue.splice(userAIndex, 1);

//     if (userA && userA.readyState === WS_OPEN) {
//       userA.send(
//         JSON.stringify({
//           type: "successfully_ended_call",
//           reason: "You ended Call",
//           success: "ok",
//         }),
//       );
//     }
//     return;
//   }

//   if (data.type === "next") {
//     const userA = socket;
//     const userAId = socket.id;
//     const userBId = activePairs.get(userAId);
//     const userB = sockets.get(userBId);

//     activePairs.delete(userAId);
//     activePairs.delete(userBId);

//     if (userB && userB.readyState === WS_OPEN) {
//       userB.send(
//         JSON.stringify({
//           type: "queued_and_searching_next_for_you",
//           success: "ok",
//         }),
//       );
//     }

//     usersQueue.push(userAId);
//     usersQueue.push(userBId);

//     userA.send(
//       JSON.stringify({
//         type: "queued_and_searching_next_for_you",
//         success: "ok",
//       }),
//     );

//     matchTwoUsers();
//     return;
//   }

//   // Relay WebRTC signaling messages to the paired partner
//   const partnerId = activePairs.get(socket.id);
//   const partnerSocket = sockets.get(partnerId);

//   if (partnerSocket && partnerSocket.readyState === WS_OPEN) {
//     partnerSocket.send(
//       JSON.stringify({
//         type: data.type,
//         offer: data.offer,
//         answer: data.answer,
//         candidate: data.candidate,
//       }),
//     );
//   }
// }

// function handleDisconnect(socket, wss) {
//   console.log("Client disconnected:", socket.id);

//   sockets.delete(socket.id);

//   const partnerId = activePairs.get(socket.id);

//   if (partnerId) {
//     const partnerSocket = sockets.get(partnerId);

//     if (partnerSocket && partnerSocket.readyState === WS_OPEN) {
//       partnerSocket.send(
//         JSON.stringify({ type: "partner-disconnected-websocket-connection" }),
//       );
//       partnerSocket.send(
//         JSON.stringify({
//           type: "queued_and_searching_next_for_you",
//           success: "ok",
//         }),
//       );
//     }

//     usersQueue.push(partnerId);
//     activePairs.delete(socket.id);
//     activePairs.delete(partnerId);
//   } else {
//     const index = usersQueue.indexOf(socket.id);
//     if (index !== -1) usersQueue.splice(index, 1);
//   }
// }

// function parseCookies(cookieHeader = "") {
//   const cookies = {};
//   cookieHeader.split("; ").forEach((cookie) => {
//     const [key, value] = cookie.split("=");
//     if (key && value) cookies[key] = value;
//   });
//   return cookies;
// }

// /* ============================================================
//    HANDLE CLIENT ACK
//    The client sends { type: "ack", messageId, status: "delivered" }
//    when it receives a chat_deliver. We don't need to do anything
//    with this on the server beyond logging — the delivery update
//    is already handled inside handleChatMessage. This handler
//    exists to prevent the message from falling through to the
//    WebRTC relay logic at the bottom of handleMessage.
// ============================================================ */
// function handleClientAck(socket, data) {
//   // No-op: delivery status is updated in handleChatMessage.
//   // Kept as a named handler so it's easy to extend later.
//   console.log("Client ACK received:", data.messageId, data.status);
// }

// /* ============================================================
//    HANDLE CHAT MESSAGE
// ============================================================ */
// async function handleChatMessage(socket, data) {
//   if (!socket.chatUserId) {
//     console.warn("Unauthenticated chat message ignored");
//     return;
//   }

//   const { messageId, to, text, createdAt } = data;

//   if (!messageId || !to || !text) {
//     console.warn("Invalid chat message payload");
//     return;
//   }

//   try {
//     const senderId = socket.chatUserId;
//     const receiverId = to;

//     // ── Block check ──────────────────────────────────────────────────────
//     const [receiver, sender] = await Promise.all([
//       User.findById(receiverId).select("blockedUsers"),
//       User.findById(senderId).select("blockedUsers"),
//     ]);

//     if (!receiver || !sender) {
//       console.warn("Sender or receiver not found");
//       return;
//     }

//     const receiverBlockedSender = receiver.blockedUsers
//       .map(String)
//       .includes(String(senderId));
//     const senderBlockedReceiver = sender.blockedUsers
//       .map(String)
//       .includes(String(receiverId));

//     if (receiverBlockedSender || senderBlockedReceiver) {
//       socket.send(
//         JSON.stringify({
//           type: "message_blocked",
//           messageId,
//           reason: receiverBlockedSender
//             ? "You have been blocked by this user"
//             : "You have blocked this user",
//         }),
//       );
//       return;
//     }

//     // ── Upsert conversation ──────────────────────────────────────────────
//     let conversation = await Conversation.findOne({
//       participants: { $all: [senderId, receiverId] },
//     });

//     if (!conversation) {
//       conversation = await Conversation.create({
//         participants: [senderId, receiverId],
//         requesterId: senderId,
//         status: "pending",
//         lastMessage: text,
//         lastMessageSenderId: senderId,
//         lastMessageAt: new Date(createdAt),
//       });
//     }

//     // ── Save message ─────────────────────────────────────────────────────
//     const savedMessage = await Message.create({
//       messageId,
//       conversationId: conversation._id,
//       senderId,
//       receiverId,
//       text,
//       createdAt: new Date(createdAt),
//       status: "sent",
//     });

//     // ── Update conversation last message ─────────────────────────────────
//     await Conversation.updateOne(
//       { _id: conversation._id },
//       {
//         lastMessage: text,
//         lastMessageSenderId: senderId,
//         lastMessageAt: savedMessage.createdAt,
//       },
//     );

//     // ── ACK sender: "sent" (single grey tick) ────────────────────────────
//     socket.send(
//       JSON.stringify({
//         type: "ack",
//         messageId,
//         conversationId: conversation._id,
//         status: "sent",
//       }),
//     );

//     // ── Deliver to receiver if online ────────────────────────────────────
//     const receiverSocket = onlineChatUsers.get(receiverId.toString());

//     if (receiverSocket && receiverSocket.readyState === WS_OPEN) {
//       receiverSocket.send(
//         JSON.stringify({
//           type: "chat_deliver",
//           message: {
//             messageId,
//             conversationId: conversation._id,
//             from: senderId,
//             to: receiverId,
//             text,
//             createdAt: savedMessage.createdAt,
//             status: "delivered",
//           },
//         }),
//       );

//       // Update DB and ACK sender with "delivered" (double grey ticks).
//       // We do NOT await the DB write before ACKing — the client UI update
//       // should not wait on a DB round-trip.
//       Message.updateOne({ messageId }, { status: "delivered" }).catch((err) =>
//         console.error("Failed to update message to delivered:", err),
//       );

//       socket.send(
//         JSON.stringify({
//           type: "ack",
//           messageId,
//           conversationId: conversation._id,
//           status: "delivered",
//         }),
//       );
//     }
//   } catch (err) {
//     console.error("handleChatMessage error:", err);
//   }
// }

// /* ============================================================
//    HANDLE READ RECEIPT

//    Called when the receiver opens a conversation. Marks all
//    unread messages in that conversation as "read" in the DB,
//    then notifies each unique sender with a single read_ack per
//    conversation (not one per message) so the sender gets blue
//    ticks without a flood of signals.

//    FIX: Was using `WebSocket.OPEN` which is undefined in Node.js,
//    so the `senderSocket.readyState === WebSocket.OPEN` check was
//    always false — the read_ack was never sent, meaning blue ticks
//    only appeared after a page refresh (when messages were
//    re-fetched from the DB with status "read" already set).
//    Now uses the numeric constant WS_OPEN = 1.
// ============================================================ */
// async function handleReadReceipt(socket, data) {
//   if (!socket.chatUserId) return;

//   const { conversationId } = data;
//   if (!conversationId) return;

//   try {
//     const receiverId = new mongoose.Types.ObjectId(socket.chatUserId);
//     const convObjId = new mongoose.Types.ObjectId(conversationId);

//     // Find all unread messages sent TO this user in this conversation
//     const unreadMessages = await Message.find({
//       conversationId: convObjId,
//       receiverId,
//       status: { $in: ["sent", "delivered"] },
//     }).lean();

//     if (unreadMessages.length === 0) return;

//     // Bulk update in one query
//     await Message.updateMany(
//       {
//         conversationId: convObjId,
//         receiverId,
//         status: { $in: ["sent", "delivered"] },
//       },
//       { $set: { status: "read" } },
//     );

//     // Notify each unique sender once with a single read_ack for the whole
//     // conversation. Sending one ack per message causes a flood of state
//     // updates on the client for no benefit — the client bulk-flips by
//     // conversationId anyway.
//     const notifiedSenders = new Set();

//     for (const msg of unreadMessages) {
//       const senderIdStr = msg.senderId.toString();
//       if (notifiedSenders.has(senderIdStr)) continue;
//       notifiedSenders.add(senderIdStr);

//       const senderSocket = onlineChatUsers.get(senderIdStr);

//       // FIX: was `WebSocket.OPEN` (undefined in Node.js) — now `WS_OPEN` (1)
//       if (senderSocket && senderSocket.readyState === WS_OPEN) {
//         senderSocket.send(
//           JSON.stringify({
//             type: "read_ack",
//             conversationId: conversationId.toString(),
//             status: "read",
//           }),
//         );
//         console.log("read_ack sent to sender:", senderIdStr);
//       } else {
//         console.log(
//           "Sender not online, skipping read_ack for:",
//           senderIdStr,
//           "readyState:",
//           senderSocket?.readyState,
//         );
//       }
//     }
//   } catch (err) {
//     console.error("handleReadReceipt error:", err);
//   }
// }

// module.exports = { handleDisconnect, handleConnection, handleMessage };

const { usersQueue, activePairs, sockets } = require("./state");
const { v4: uuidv4 } = require("uuid");
const { matchTwoUsers } = require("../utility/utils.js");
const { success } = require("zod");
const jwt = require("jsonwebtoken");
const Message = require("./models/Message");
const Conversation = require("./models/Conversation");
const User = require("./models/User");
const { default: mongoose } = require("mongoose");

const WS_OPEN = 1;

const onlineChatUsers = new Map();

function broadcastOnlineStatus(wss) {
  const onlineUserIds = Array.from(onlineChatUsers.keys());
  const message = JSON.stringify({
    type: "online_users",
    userIds: onlineUserIds,
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WS_OPEN) {
      client.send(message);
    }
  });
}

// ── Heartbeat: detect dead connections (network drop, WiFi off, etc.) ────────
// When a connection drops abruptly, no WebSocket close frame is sent.
// We ping every 15s — if a client doesn't pong back, we terminate it
// and immediately broadcast the updated online status.
// function startHeartbeat(wss) {
//   const HEARTBEAT_INTERVAL = 15000;

//   const timer = setInterval(() => {
//     wss.clients.forEach((socket) => {
//       if (!socket.isAlive) {
//         // No pong received since last ping — connection is dead
//         if (socket.chatUserId) {
//           onlineChatUsers.delete(socket.chatUserId);
//           broadcastOnlineStatus(wss);
//         }
//         return socket.terminate();
//       }

//       socket.isAlive = false; // reset — will be set true on pong
//       socket.ping();
//     });
//   }, HEARTBEAT_INTERVAL);

//   wss.on("close", () => clearInterval(timer));
// }

function handleConnection(socket, req, wss) {
  socket.id = uuidv4();
  socket.lastPartner = null;
  socket.chatUserId = null;
  socket.isAlive = true; // ← heartbeat init

  // Mark alive whenever client responds to ping
  socket.on("pong", () => {
    socket.isAlive = true;
  });

  console.log("New client connected:", socket.id);
  console.log("Total connected clients:", wss.clients.size);

  try {
    const cookies = parseCookies(req.headers?.cookie || "");
    const token = cookies?.token;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.chatUserId = decoded.id;

      const existingSocket = onlineChatUsers.get(decoded.id);
      if (
        existingSocket &&
        existingSocket !== socket &&
        existingSocket.readyState === WS_OPEN
      ) {
        console.log("Closing old socket for user:", decoded.id);
        existingSocket.close();
      }

      onlineChatUsers.set(decoded.id, socket);
      console.log("Chat authenticated:", socket.chatUserId);
      broadcastOnlineStatus(wss);
    }
  } catch (err) {
    console.log("Invalid token");
  }

  sockets.set(socket.id, socket);

  socket.on("close", () => {
    sockets.delete(socket.id);
    if (socket.chatUserId) {
      onlineChatUsers.delete(socket.chatUserId);
      broadcastOnlineStatus(wss);
    }
    console.log("Socket cleaned:", socket.id);
  });

  if (socket.readyState === WS_OPEN) {
    socket.send(JSON.stringify({ type: "connected", id: socket.id }));
  }
}

function handleMessage(socket, msg) {
  const data = JSON.parse(msg);
if (data.type === "ping") {
  socket.isAlive = true;
  return;
}
  console.log("Received message from", socket.id, ":", data.type);

  if (data.type === "chat_message") {
    return handleChatMessage(socket, data);
  }

  if (data.type === "ack") {
    return handleClientAck(socket, data);
  }

  if (data.type === "read") {
    return handleReadReceipt(socket, data);
  }

  if (data.type === "join-queue") {
    usersQueue.push(socket.id);
    socket.send(JSON.stringify({ type: "queued_ack", success: "ok" }));
    matchTwoUsers();
    return;
  }

  if (data.type === "leave-queue") {
    const index = usersQueue.indexOf(socket.id);
    if (index !== -1) usersQueue.splice(index, 1);
    return;
  }

  if (data.type === "end-call") {
    const userA = socket;
    const userAId = socket.id;
    const userBId = activePairs.get(userAId);
    const userB = sockets.get(userBId);

    if (userBId) {
      activePairs.delete(userAId);
      activePairs.delete(userBId);
    }

    if (userB && userB.readyState === WS_OPEN) {
      userB.send(
        JSON.stringify({
          type: "queued_and_searching_next_for_you",
          success: "ok",
        }),
      );
    }

    if (userBId && userB && !usersQueue.includes(userBId)) {
      usersQueue.push(userBId);
    }

    const userAIndex = usersQueue.indexOf(userAId);
    if (userAIndex !== -1) usersQueue.splice(userAIndex, 1);

    if (userA && userA.readyState === WS_OPEN) {
      userA.send(
        JSON.stringify({
          type: "successfully_ended_call",
          reason: "You ended Call",
          success: "ok",
        }),
      );
    }
    return;
  }

  if (data.type === "next") {
    const userA = socket;
    const userAId = socket.id;
    const userBId = activePairs.get(userAId);
    const userB = sockets.get(userBId);

    activePairs.delete(userAId);
    activePairs.delete(userBId);

    if (userB && userB.readyState === WS_OPEN) {
      userB.send(
        JSON.stringify({
          type: "queued_and_searching_next_for_you",
          success: "ok",
        }),
      );
    }

    usersQueue.push(userAId);
    usersQueue.push(userBId);

    userA.send(
      JSON.stringify({
        type: "queued_and_searching_next_for_you",
        success: "ok",
      }),
    );

    matchTwoUsers();
    return;
  }

  // Relay WebRTC signaling messages to the paired partner
  const partnerId = activePairs.get(socket.id);
  const partnerSocket = sockets.get(partnerId);

  if (partnerSocket && partnerSocket.readyState === WS_OPEN) {
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

  sockets.delete(socket.id);

  const partnerId = activePairs.get(socket.id);

  if (partnerId) {
    const partnerSocket = sockets.get(partnerId);

    if (partnerSocket && partnerSocket.readyState === WS_OPEN) {
      partnerSocket.send(
        JSON.stringify({ type: "partner-disconnected-websocket-connection" }),
      );
      partnerSocket.send(
        JSON.stringify({
          type: "queued_and_searching_next_for_you",
          success: "ok",
        }),
      );
    }

    usersQueue.push(partnerId);
    activePairs.delete(socket.id);
    activePairs.delete(partnerId);
  } else {
    const index = usersQueue.indexOf(socket.id);
    if (index !== -1) usersQueue.splice(index, 1);
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

function handleClientAck(socket, data) {
  console.log("Client ACK received:", data.messageId, data.status);
}

async function handleChatMessage(socket, data) {
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

    const [receiver, sender] = await Promise.all([
      User.findById(receiverId).select("blockedUsers"),
      User.findById(senderId).select("blockedUsers"),
    ]);

    if (!receiver || !sender) {
      console.warn("Sender or receiver not found");
      return;
    }

    const receiverBlockedSender = receiver.blockedUsers
      .map(String)
      .includes(String(senderId));
    const senderBlockedReceiver = sender.blockedUsers
      .map(String)
      .includes(String(receiverId));

    if (receiverBlockedSender || senderBlockedReceiver) {
      socket.send(
        JSON.stringify({
          type: "message_blocked",
          messageId,
          reason: receiverBlockedSender
            ? "You have been blocked by this user"
            : "You have blocked this user",
        }),
      );
      return;
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

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

    const savedMessage = await Message.create({
      messageId,
      conversationId: conversation._id,
      senderId,
      receiverId,
      text,
      createdAt: new Date(createdAt),
      status: "sent",
    });

    await Conversation.updateOne(
      { _id: conversation._id },
      {
        lastMessage: text,
        lastMessageSenderId: senderId,
        lastMessageAt: savedMessage.createdAt,
      },
    );

    socket.send(
      JSON.stringify({
        type: "ack",
        messageId,
        conversationId: conversation._id,
        status: "sent",
      }),
    );

    const receiverSocket = onlineChatUsers.get(receiverId.toString());

    if (receiverSocket && receiverSocket.readyState === WS_OPEN) {
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

      Message.updateOne({ messageId }, { status: "delivered" }).catch((err) =>
        console.error("Failed to update message to delivered:", err),
      );

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

async function handleReadReceipt(socket, data) {
  if (!socket.chatUserId) return;

  const { conversationId } = data;
  if (!conversationId) return;

  try {
    const receiverId = new mongoose.Types.ObjectId(socket.chatUserId);
    const convObjId = new mongoose.Types.ObjectId(conversationId);

    const unreadMessages = await Message.find({
      conversationId: convObjId,
      receiverId,
      status: { $in: ["sent", "delivered"] },
    }).lean();

    if (unreadMessages.length === 0) return;

    await Message.updateMany(
      {
        conversationId: convObjId,
        receiverId,
        status: { $in: ["sent", "delivered"] },
      },
      { $set: { status: "read" } },
    );

    const notifiedSenders = new Set();

    for (const msg of unreadMessages) {
      const senderIdStr = msg.senderId.toString();
      if (notifiedSenders.has(senderIdStr)) continue;
      notifiedSenders.add(senderIdStr);

      const senderSocket = onlineChatUsers.get(senderIdStr);

      if (senderSocket && senderSocket.readyState === WS_OPEN) {
        senderSocket.send(
          JSON.stringify({
            type: "read_ack",
            conversationId: conversationId.toString(),
            status: "read",
          }),
        );
        console.log("read_ack sent to sender:", senderIdStr);
      } else {
        console.log(
          "Sender not online, skipping read_ack for:",
          senderIdStr,
          "readyState:",
          senderSocket?.readyState,
        );
      }
    }
  } catch (err) {
    console.error("handleReadReceipt error:", err);
  }
}


function startHeartbeat(wss) {
  const timer = setInterval(() => {
    wss.clients.forEach((socket) => {
      if (!socket.isAlive) {
        if (socket.chatUserId) {
          onlineChatUsers.delete(socket.chatUserId);
          broadcastOnlineStatus(wss);
        }
        return socket.terminate();
      }
      socket.isAlive = false;
      socket.ping();
    });
  }, 30000);

  wss.on("close", () => clearInterval(timer));
}


module.exports = {
  handleDisconnect,
  handleConnection,
  handleMessage,
  startHeartbeat,
};