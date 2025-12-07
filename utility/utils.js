// matchmaking.js
const { usersQueue, activePairs, sockets } = require("../server/state.js");

function matchTwoUsers() {
  // Need at least 2 users

  console.log("users in queue:", ...usersQueue);
  if (usersQueue.length < 2) return;

  const userAId = usersQueue.shift();
  const userBId = usersQueue.shift();

  const userA = sockets.get(userAId);
  const userB = sockets.get(userBId);



  // console.log(userA, userB)

  if(userA && userB){

     userA.lastPartner = userB.id;
     userB.lastPartner = userA.id;

  }
 


  // If one of them disconnected after entering queue
  if (!userA || !userB) {
    // retry matching
    matchTwoUsers();
    return;
  }


  // if (userA.lastPartner === userBId || userB.lastPartner === userAId) {
  //   // Skip this match, try again
  //   console.log("Skipping rematch:", userAId, "<->", userBId);

  //   // Put them back and reshuffle
  //   usersQueue.push(userAId);
  //   usersQueue.push(userBId);
  //   // matchTwoUsers(); // retry
  //   return;
  // }


  // Pair them
  activePairs.set(userAId, userBId);
  activePairs.set(userBId, userAId);

  // Send match event
  userA.send(
    JSON.stringify({ type: "matched", role: "caller", partner: userBId })
  );
  userB.send(
    JSON.stringify({ type: "matched", role: "receiver", partner: userAId })
  );
}

module.exports = { matchTwoUsers };
