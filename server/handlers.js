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


  if (data.type === "join-queue") {
    usersQueue.push(socket.id);
    console.log("total users in queue:", usersQueue.length);
   socket.send(JSON.stringify({ type: "queued" }));

    matchTwoUsers();
    return;
  }

  // if(data.type==="force-disconnect"){
  //   console.log(socket.id, "force disconnected their partner");

  //   const partnerId = activePairs.get(socket.id);

  //   if (partnerId) {
  //     const partnerSocket = sockets.get(partnerId);

  //     // Notify partner
  //     if (partnerSocket && partnerSocket.readyState === 1) {
  //       partnerSocket.send(JSON.stringify({ type: "partner-disconnected" }));
  //     }

  //     // Remove pair from activePairs
  //     activePairs.delete(socket.id);
  //     activePairs.delete(partnerId);

  //     console.log("Removed pairing due to force-disconnect:", socket.id, "<->", partnerId);
  //   }

  //   return;
  // }



  if (data.type ==="next") {
    console.log(socket.id, "clicked NEXT");

    // 1. Remove old partner if any
    const partnerId = activePairs.get(socket.id);

    if (partnerId) {
      const partnerSocket = sockets.get(partnerId);

      // Notify partner
      if (partnerSocket && partnerSocket.readyState === 1) {
        partnerSocket.send(JSON.stringify({ type: "partner-disconnected" }));
      }

          partnerSocket.send(JSON.stringify({ type: "matching-to-next" }));

          socket.send(JSON.stringify({ type: "matching-to-next" }));


      // Remove pair from activePairs
      activePairs.delete(socket.id);
      activePairs.delete(partnerId);

      console.log("Removed old pairing:", socket.id, "<->", partnerId);
    }

    // 2. Place user back in queue
    usersQueue.push(partnerId);
    console.log("Queue size:", usersQueue.length);

    // 3. Let client know they are queued again

    // 4. Try matching again
    // matchTwoUsers();

    return;
  }



  const partnerId = activePairs.get(socket.id);
  if (!partnerId) return;

  const partnerSocket = sockets.get(partnerId);
  if (partnerSocket && partnerSocket.readyState === 1) {
    partnerSocket.send(JSON.stringify(data));
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
