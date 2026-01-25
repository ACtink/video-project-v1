

const express = require("express");
const User = require("../models/User");
const authMiddleware = require("../middlewares/auth");
const Message = require("../models/Message");

const router = express.Router();

/**
 * GET /api/chat/contacts
 * Returns users who mutually follow each other
 */
router.get("/contacts", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1️⃣ Get current user's followers & following
    const me = await User.findById(userId).select("followers following");

    if (!me) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2️⃣ Find mutual followers (intersection)
    const mutualIds = me.following.filter((id) => me.followers.includes(id));

    if (mutualIds.length === 0) {
      return res.status(200).json([]);
    }

    // 3️⃣ Fetch chat-safe user data
    const users = await User.find({
      _id: { $in: mutualIds },
    }).select("_id username profilePicture lastSeen");

    res.status(200).json(users);
  } catch (err) {
    console.error("CHAT CONTACTS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


/**
 * GET /api/chat/messages/:userId
 * Fetch chat messages between logged-in user and another user
 */
router.get("/messages/:userId", authMiddleware, async (req, res) => {
  try {
    const myId = req.user.id;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: myId },
      ],
    })
      .sort({ createdAt: 1 }) // oldest → newest
      .select("_id senderId receiverId text createdAt status");

    res.status(200).json(messages);
  } catch (err) {
    console.error("FETCH CHAT MESSAGES ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
