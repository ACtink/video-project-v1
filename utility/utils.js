// matchmaking.js
const { usersQueue, activePairs, sockets } = require("../server/state.js");

function matchTwoUsers() {
  console.log("users in queue:", ...usersQueue);

  if (usersQueue.length < 2) return;

  const userAId = usersQueue.shift();
  const userBId = usersQueue.shift();

  const userA = sockets.get(userAId);
  const userB = sockets.get(userBId);

  // If one of them disconnected
  if (!userA || !userB) {
    if (userA) usersQueue.push(userAId);
    if (userB) usersQueue.push(userBId);
    matchTwoUsers();
    return;
  }

  // ❗ CHECK BEFORE SETTING lastPartner
  if (userA.lastPartner === userBId || userB.lastPartner === userAId) {
    console.log("Skipping rematch:", userAId, "<->", userBId);

    usersQueue.push(userAId);
    usersQueue.push(userBId);
    return;
  }

  // ✅ NOW they are allowed to match
  activePairs.set(userAId, userBId);
  activePairs.set(userBId, userAId);

  // ✅ SET lastPartner ONLY AFTER SUCCESSFUL MATCH
  userA.lastPartner = userBId;
  userB.lastPartner = userAId;

  // Send match event
  userA.send(
    JSON.stringify({
      type: "matched_ack",
      success: "ok",
      role: "caller",
      partner: userBId,
    })
  );

  userB.send(
    JSON.stringify({
      type: "matched_ack",
      success: "ok",
      role: "receiver",
      partner: userAId,
    })
  );

  console.log("users queue after matching", usersQueue.length);
}

module.exports = { matchTwoUsers };
