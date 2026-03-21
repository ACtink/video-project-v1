

// const express = require("express");
// const User = require("../models/User");
// const authMiddleware = require("../middlewares/auth");
// const Message = require("../models/Message");
// const Conversation = require("../models/Conversation");

// const router = express.Router();

// /**
//  * GET /api/chat/contacts
//  * Returns users who mutually follow each other
//  */
// router.get("/contacts", authMiddleware, async (req, res) => {
//   try {
//     const userId = req.user.id;

//     // 1️⃣ Get current user's followers & following
//     const me = await User.findById(userId).select("followers following");

//     if (!me) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // 2️⃣ Find mutual followers (intersection)
//     const mutualIds = me.following.filter((id) => me.followers.includes(id));

//     if (mutualIds.length === 0) {
//       return res.status(200).json([]);
//     }

//     // 3️⃣ Fetch chat-safe user data
//     const users = await User.find({
//       _id: { $in: mutualIds },
//     }).select("_id username profilePicture lastSeen");

//     res.status(200).json(users);
//   } catch (err) {
//     console.error("CHAT CONTACTS ERROR:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });


// /**
//  * GET /api/chat/messages/:userId
//  * Fetch chat messages between logged-in user and another user
//  */
// router.get("/messages/:userId", authMiddleware, async (req, res) => {
//   try {
//     const myId = req.user.id;
//     const otherUserId = req.params.userId;

//     const messages = await Message.find({
//       $or: [
//         { senderId: myId, receiverId: otherUserId },
//         { senderId: otherUserId, receiverId: myId },
//       ],
//     })
//       .sort({ createdAt: 1 }) // oldest → newest
//       .select("_id senderId receiverId text createdAt status");

//     res.status(200).json(messages);
//   } catch (err) {
//     console.error("FETCH CHAT MESSAGES ERROR:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });


// router.post(
//   "/start/:userId",
//   authMiddleware,
//   async function startConversation(req, res) {
//     try {
//       const senderId = req.user.id; // from auth middleware
//       const receiverId = req.params.userId;

//       if (!receiverId) {
//         return res.status(400).json({
//           error: "Receiver ID is required",
//         });
//       }
//       console.log("Starting conversation between:", senderId, receiverId);

//       if (senderId.toString() === receiverId.toString()) {
//         return res.status(400).json({
//           error: "Cannot start conversation with yourself",
//         });
//       }

//       // 1️⃣ Check if conversation already exists
//       let conversation = await Conversation.findOne({
//         participants: { $all: [senderId, receiverId] },
//       }).populate("participants", "username profilePicture");

//       // 2️⃣ If exists → return it
//       if (conversation) {
//         return res.json({
//           success: true,

//           conversation,
//         });
//       }

//       // 3️⃣ Else create new conversation
//       conversation = await Conversation.create({
//         participants: [senderId, receiverId],

//         requesterId: senderId,

//         status: "pending",

//         lastMessage: "",

//         lastMessageAt: new Date(),
//       });

//       // populate after creation
//       conversation = await conversation.populate(
//         "participants",
//         "username profilePicture",
//       );

//       // 4️⃣ Return new conversation
//       res.json({
//         success: true,

//         conversation,
//       });
//     } catch (err) {
//       console.error("startConversation error:", err);

//       res.status(500).json({
//         error: "Server error",
//       });
//     }
//   },
// );


// router.get(
//   "/conversations",

//   authMiddleware,

//   async function getConversations(req, res) {
//     try {
//       const myUserId = req.user.id;

//       const conversations = await Conversation.find({
//         participants: myUserId,
//       })

//         .sort({ lastMessageAt: -1 })

//         .populate("participants", "username profilePicture");

//       res.json(conversations);
//     } catch (err) {
//       console.error(err);

//       res.status(500).json({
//         error: "Server error",
//       });
//     }
//   },
// );



// router.get(
//   "/messages/:conversationId",
//   authMiddleware,
//   async function getMessages(req, res) {
//     try {
//       const conversationId = req.params.conversationId;

//       const messages = await Message.find({
//         conversationId,
//       }).sort({ createdAt: 1 });

//       res.json(messages);
//     } catch (err) {
//       console.error(err);

//       res.status(500).json({
//         error: "Server error",
//       });
//     }
//   },
// );

// module.exports = router;



const express = require("express");
const mongoose = require("mongoose");

const User = require("../models/User");
const authMiddleware = require("../middlewares/auth");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

const router = express.Router();

// ============================================================
// GET CONTACTS (mutual followers)
// ============================================================

router.get("/contacts", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const me = await User.findById(userId).select("followers following");

    if (!me) {
      return res.status(404).json({ message: "User not found" });
    }

    const mutualIds = me.following.filter((id) =>
      me.followers.includes(id.toString()),
    );

    if (!mutualIds.length) {
      return res.json([]);
    }

    const users = await User.find({
      _id: { $in: mutualIds },
    }).select("_id username profilePicture lastSeen");

    res.json(users);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// ============================================================
// START OR GET CONVERSATION
// ============================================================

router.post("/start/:userId", authMiddleware, async (req, res) => {
  try {
    const senderId = req.user.id;

    const receiverId = req.params.userId;

    if (senderId === receiverId) {
      return res.status(400).json({
        error: "Cannot chat with yourself",
      });
    }

    // FIND existing

    let conversation = await Conversation.findOne({
      participants: {
        $all: [senderId, receiverId],
      },
    }).populate("participants", "username profilePicture");

    // CREATE if not exists

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],

        requesterId: senderId,

        status: "accepted",

        lastMessage: "",
      });

      conversation = await conversation.populate(
        "participants",
        "username profilePicture",
      );
    }

    res.json(conversation);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Server error",
    });
  }
});

// ============================================================
// GET CONVERSATION LIST
// ============================================================

router.get("/conversations", authMiddleware, async (req, res) => {
  try {
    const myId = req.user.id;

    const conversations = await Conversation.find({
      participants: myId,
    })

      .sort({ lastMessageAt: -1 })

      .populate("participants", "username profilePicture lastSeen");

    res.json(conversations);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Server error",
    });
  }
});



router.delete(
  "/conversations/:conversationId",
  authMiddleware,
  async (req, res) => {
    try {
      const myId = req.user.id;
      const { conversationId } = req.params;

      // make sure the user is actually a participant
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: myId,
      });

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      await Conversation.findByIdAndDelete(conversationId);

      await Message.deleteMany({ conversationId });
      
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  },
);

// ============================================================
// GET MESSAGES BY CONVERSATION
// ============================================================

router.get("/messages/:conversationId", authMiddleware, async (req, res) => {
  try {
    const myId = req.user.id;

    const { conversationId } = req.params;

    const { cursor } = req.query; // pagination

    // SECURITY: verify user is part of conversation

    const conversation = await Conversation.findOne({
      _id: conversationId,

      participants: myId,
    });

    console.log("Conversation found for messages:", conversation);

    if (!conversation) {
      return res.status(403).json({
        error: "Unauthorized",
      });
    }

    // pagination filter

    const filter = {
      conversationId,
    };

    if (cursor) {
      filter.createdAt = {
        $lt: new Date(cursor),
      };
    }

    const messages = await Message.find(filter)

      .sort({ createdAt: -1 })

      .limit(50)

      .select("messageId senderId receiverId text status createdAt");

      console.log("Messages fetched:", messages.length);

    res.json(messages.reverse());
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Server error",
    });
  }
});




// ============================================================
// MARK MESSAGES AS READ
// ============================================================
router.patch("/conversations/:conversationId/read", authMiddleware, async (req, res) => {
  try {
    const myId = req.user.id;
    const { conversationId } = req.params;

    await Message.updateMany(
      {
        conversationId,
        receiverId: myId,
        status: { $in: ["sent", "delivered"] },
      },
      { $set: { status: "read" } }
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});





module.exports = router;
