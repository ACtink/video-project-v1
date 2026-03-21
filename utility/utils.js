// // matchmaking.js
// const { usersQueue, activePairs, sockets } = require("../server/state.js");

// function matchTwoUsers() {
//   console.log("users in queue:", ...usersQueue);

//   if (usersQueue.length < 2) return;

//   const userAId = usersQueue.shift();
//   const userBId = usersQueue.shift();

//   const userA = sockets.get(userAId);
//   const userB = sockets.get(userBId);

//   // If one of them disconnected
//   if (!userA || !userB) {
//     if (userA) usersQueue.push(userAId);
//     if (userB) usersQueue.push(userBId);
//     matchTwoUsers();
//     return;
//   }

//   // ❗ CHECK BEFORE SETTING lastPartner
//   if (userA.lastPartner === userBId || userB.lastPartner === userAId) {
//     console.log("Skipping rematch:", userAId, "<->", userBId);

//     usersQueue.push(userAId);
//     usersQueue.push(userBId);
//     return;
//   }

//   // ✅ NOW they are allowed to match
//   activePairs.set(userAId, userBId);
//   activePairs.set(userBId, userAId);

//   // ✅ SET lastPartner ONLY AFTER SUCCESSFUL MATCH
//   userA.lastPartner = userBId;
//   userB.lastPartner = userAId;

//   // Send match event
//   userA.send(
//     JSON.stringify({
//       type: "matched_ack",
//       success: "ok",
//       role: "caller",
//       partner: userBId,
//     })
//   );

//   userB.send(
//     JSON.stringify({
//       type: "matched_ack",
//       success: "ok",
//       role: "receiver",
//       partner: userAId,
//     })
//   );

//   console.log("users queue after matching", usersQueue.length);
// }

// module.exports = { matchTwoUsers };







// matchmaking.js
const { usersQueue, activePairs, sockets } = require("../server/state.js");

// Guards against concurrent calls stomping each other
let isMatching = false;

function matchTwoUsers() {
  // Prevent reentrant calls — schedule a retry instead
  if (isMatching) {
    setImmediate(matchTwoUsers);
    return;
  }

  isMatching = true;
  try {
    _runMatchLoop();
  } finally {
    isMatching = false;
  }
}

function _runMatchLoop() {
  // Iterative instead of recursive — no stack overflow risk
  // even if the entire queue is composed of recent pairs
  let skippedPairs = []; // collect skipped pairs to re-queue after one full pass

  while (usersQueue.length >= 2) {
    const userAId = usersQueue.shift();
    const userBId = usersQueue.shift();

    // Self-match guard (should never happen, but be safe)
    if (userAId === userBId) {
      console.warn(`[matchmaking] Self-match detected for ${userAId}, re-queuing.`);
      _safeEnqueue(userAId);
      continue;
    }

    // Duplicate-in-queue guard: if either is already in an active pair, drop them from queue
    if (activePairs.has(userAId)) {
      console.warn(`[matchmaking] ${userAId} is already in an active pair, dropping from queue.`);
      _safeEnqueue(userBId); // put B back
      continue;
    }
    if (activePairs.has(userBId)) {
      console.warn(`[matchmaking] ${userBId} is already in an active pair, dropping from queue.`);
      _safeEnqueue(userAId); // put A back
      continue;
    }

    const userA = sockets.get(userAId);
    const userB = sockets.get(userBId);

    // Handle disconnected users
    if (!userA && !userB) {
      // Both gone — nothing to re-queue
      console.log(`[matchmaking] Both ${userAId} and ${userBId} disconnected, dropping.`);
      continue;
    }
    if (!userA) {
      console.log(`[matchmaking] ${userAId} disconnected, re-queuing ${userBId}.`);
      _safeEnqueue(userBId);
      continue;
    }
    if (!userB) {
      console.log(`[matchmaking] ${userBId} disconnected, re-queuing ${userAId}.`);
      _safeEnqueue(userAId);
      continue;
    }

    // Rematch guard — skip this pair for this pass, try other combinations first
    if (userA.lastPartner === userBId || userB.lastPartner === userAId) {
      console.log(`[matchmaking] Skipping recent rematch: ${userAId} <-> ${userBId}`);
      skippedPairs.push(userAId, userBId);
      continue;
    }

    // ✅ Valid match — register and notify
    _registerMatch(userAId, userBId, userA, userB);
  }

  // Re-queue skipped pairs — they go to the back so other users get priority
  // Only re-queue if there's actually someone else they could match with later
  for (const id of skippedPairs) {
    _safeEnqueue(id);
  }

  console.log(`[matchmaking] Queue size after pass: ${usersQueue.length}`);
}

/**
 * Enqueue a user only if they aren't already in the queue or an active pair.
 */
function _safeEnqueue(userId) {
  if (activePairs.has(userId)) return; // already matched
  if (usersQueue.includes(userId)) return; // already queued (duplicate guard)
  usersQueue.push(userId);
}

/**
 * Finalise a valid match between two users.
 */
function _registerMatch(userAId, userBId, userA, userB) {
  activePairs.set(userAId, userBId);
  activePairs.set(userBId, userAId);

  userA.lastPartner = userBId;
  userB.lastPartner = userAId;

  const send = (socket, payload) => {
    try {
      if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify(payload));
      } else {
        console.warn(`[matchmaking] Socket not open for user, skipping send.`);
      }
    } catch (err) {
      console.error(`[matchmaking] Send error:`, err);
    }
  };

  send(userA, {
    type: "matched_ack",
    success: "ok",
    role: "caller",
    partner: userBId,
  });

  send(userB, {
    type: "matched_ack",
    success: "ok",
    role: "receiver",
    partner: userAId,
  });

  console.log(`[matchmaking] Matched: ${userAId} (caller) <-> ${userBId} (receiver)`);
}

module.exports = { matchTwoUsers };