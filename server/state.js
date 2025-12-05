// state.js
const usersQueue = []; // users waiting to be matched (FIFO queue)
const activePairs = new Map(); // socketId → partnerSocketId
const sockets = new Map();


module.exports = {
  usersQueue,
  activePairs,
  sockets
};
