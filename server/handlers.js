// disconnect.js
const { usersQueue, activePairs, sockets } = require("./state");
const { v4: uuidv4 } = require("uuid");
const { matchTwoUsers } = require("../utility/utils.js");







function handleConnection(socket) {
  socket.id = uuidv4();
  socket.lastPartner = null;


  console.log("New client connected:", socket.id);

  // Store socket
  sockets.set(socket.id, socket);


  socket.send(JSON.stringify({ type: "connected", id: socket.id }));

  // Add to queue
  // usersQueue.push(socket.id);

  // matchTwoUsers(); // try to match users
}




function handleMessage(socket, msg) {
  const data = JSON.parse(msg);

console.log("Received message from", socket.id, ":", data.type);
  if (data.type === "join-queue") {
    usersQueue.push(socket.id);
    console.log("*******total users in queue:******", usersQueue.length);
   socket.send(JSON.stringify({ type: "queued" }));

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

    // Break pairing for both
    activePairs.delete(userAId);
    activePairs.delete(userBId);

    // Notify partner that the conversation ended
    if (userB && userB.readyState === 1) {
      userB.send(JSON.stringify({ type: "partner-ended-call", reason: "peerEndedCall" }));
    }

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
    userB.send(JSON.stringify({ type: "force-disconnect" }));
  }

  // Requeue ONLY the user who clicked next
  usersQueue.push(userAId);

      console.log("*******total users in queue:******", usersQueue.length);

  userA.send(JSON.stringify({ type: "queued" }));
  userA.send(JSON.stringify({ type: "force-disconnect" , reason: "searchingNextForYou"}));

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
      partnerSocket.send(JSON.stringify({ type: "partner-disconnected" }));
    }

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






















module.exports = { handleDisconnect, handleConnection , handleMessage };
