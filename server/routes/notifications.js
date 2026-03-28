// // routes/notifications.js
// const express = require("express");
// const router = express.Router();
// const Notification = require("../models/Notification");
// const Follow = require("../models/Follow");
// const authMiddleware = require("../middlewares/auth");

// // ─── GET /api/notifications ───────────────────────────────────────────────────
// router.get("/", authMiddleware, async (req, res) => {
//   try {
//     const notifications = await Notification.find({ recipient: req.user.id })
//       .populate("sender", "name username profilePicture")
//       .populate("followRequest")
//       .sort({ createdAt: -1 })
//       .lean();

//     res.json(notifications);
//   } catch (error) {
//     console.error("Error fetching notifications:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// // ─── GET /api/notifications/unread-count ─────────────────────────────────────
// router.get("/unread-count", authMiddleware, async (req, res) => {
//   try {
//     const count = await Notification.countDocuments({
//       recipient: req.user.id,
//       read: false,
//     });
//     res.json({ count });
//   } catch (error) {
//     console.error("Error fetching unread count:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// // ─── PATCH /api/notifications/:id/read ───────────────────────────────────────
// router.patch("/:id/read", authMiddleware, async (req, res) => {
//   try {
//     const notification = await Notification.findOneAndUpdate(
//       { _id: req.params.id, recipient: req.user.id },
//       { read: true },
//       { new: true },
//     );

//     if (!notification) {
//       return res.status(404).json({ error: "Notification not found" });
//     }

//     res.json(notification);
//   } catch (error) {
//     console.error("Error marking notification as read:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// // ─── POST /api/notifications/read-all ────────────────────────────────────────
// // Optionally scope to specific types via ?types=follow_request,follow_accepted
// router.post("/read-all", authMiddleware, async (req, res) => {
//   try {
//     const query = { recipient: req.user.id, read: false };

//     if (req.query.types) {
//       const types = req.query.types
//         .split(",")
//         .map((t) => t.trim())
//         .filter(Boolean);
//       if (types.length > 0) query.type = { $in: types };
//     }

//     await Notification.updateMany(query, { read: true });
//     res.json({ success: true });
//   } catch (error) {
//     console.error("Error marking all as read:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// // ─── POST /api/notifications/:id/accept ──────────────────────────────────────
// router.post("/:id/accept", authMiddleware, async (req, res) => {
//   try {
//     const notification = await Notification.findOneAndUpdate(
//       {
//         _id: req.params.id,
//         recipient: req.user.id,
//         type: "follow_request",
//         status: "pending",
//       },
//       { status: "accepted" },
//       { new: true },
//     );

//     if (!notification) {
//       return res
//         .status(404)
//         .json({ error: "Follow request not found or already processed" });
//     }

//     await Follow.findOneAndUpdate(
//       { follower: notification.sender, following: notification.recipient },
//       { follower: notification.sender, following: notification.recipient },
//       { upsert: true, new: true },
//     );

//     if (notification.followRequest) {
//       const FollowRequest = require("../models/FollowRequest");
//       await FollowRequest.findByIdAndDelete(notification.followRequest);
//     }

//     res.json({ success: true });
//   } catch (error) {
//     console.error("Error accepting follow request:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// // ─── POST /api/notifications/:id/decline ─────────────────────────────────────
// router.post("/:id/decline", authMiddleware, async (req, res) => {
//   try {
//     const notification = await Notification.findOneAndUpdate(
//       {
//         _id: req.params.id,
//         recipient: req.user.id,
//         type: "follow_request",
//         status: "pending",
//       },
//       { status: "declined" },
//       { new: true },
//     );

//     if (!notification) {
//       return res
//         .status(404)
//         .json({ error: "Follow request not found or already processed" });
//     }

//     if (notification.followRequest) {
//       const FollowRequest = require("../models/FollowRequest");
//       await FollowRequest.findByIdAndDelete(notification.followRequest);
//     }

//     res.json({ success: true });
//   } catch (error) {
//     console.error("Error declining follow request:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// // ─── DELETE /api/notifications/:id ───────────────────────────────────────────
// // Delete a single notification.
// router.delete("/:id", authMiddleware, async (req, res) => {
//   try {
//     const notification = await Notification.findOneAndDelete({
//       _id: req.params.id,
//       recipient: req.user.id,
//     });

//     if (!notification) {
//       return res.status(404).json({ error: "Notification not found" });
//     }

//     res.json({ success: true });
//   } catch (error) {
//     console.error("Error deleting notification:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// // ─── DELETE /api/notifications ───────────────────────────────────────────────
// // Delete all notifications, or only those matching specific types.
// //
// // Query param: ?types=follow_request,follow_accepted
// // If omitted, deletes ALL notifications for the user.
// //
// // Example calls:
// //   DELETE /api/notifications              → clear everything
// //   DELETE /api/notifications?types=like   → clear only likes
// //   DELETE /api/notifications?types=follow_request,follow_accepted → clear follows tab
// router.delete("/", authMiddleware, async (req, res) => {
//   try {
//     const query = { recipient: req.user.id };

//     if (req.query.types) {
//       const types = req.query.types
//         .split(",")
//         .map((t) => t.trim())
//         .filter(Boolean);
//       if (types.length > 0) {
//         query.type = { $in: types };
//       }
//     }

//     await Notification.deleteMany(query);
//     res.json({ success: true });
//   } catch (error) {
//     console.error("Error clearing notifications:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// module.exports = router;

// routes/notifications.js
// const express  = require("express");
// const router   = express.Router();
// const Notification   = require("../models/Notification");
// const Follow         = require("../models/Follow");
// const FollowRequest  = require("../models/FollowRequest");
// const authMiddleware = require("../middlewares/auth");

// // ─── GET /api/notifications ───────────────────────────────────────────────────
// router.get("/", authMiddleware, async (req, res) => {
//   try {
//     const notifications = await Notification.find({ recipient: req.user.id })
//       .populate("sender", "username profilePicture")
//       .populate("followRequest")
//       .sort({ createdAt: -1 })
//       .lean();

//     res.json(notifications);
//   } catch (err) {
//     console.error("Error fetching notifications:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// // ─── GET /api/notifications/unread-count ─────────────────────────────────────
// router.get("/unread-count", authMiddleware, async (req, res) => {
//   try {
//     const count = await Notification.countDocuments({
//       recipient: req.user.id,
//       read:      false,
//     });
//     res.json({ count });
//   } catch (err) {
//     console.error("Error fetching unread count:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// // ─── PATCH /api/notifications/:id/read ───────────────────────────────────────
// router.patch("/:id/read", authMiddleware, async (req, res) => {
//   try {
//     const notification = await Notification.findOneAndUpdate(
//       { _id: req.params.id, recipient: req.user.id },
//       { read: true },
//       { new: true }
//     );

//     if (!notification) {
//       return res.status(404).json({ error: "Notification not found" });
//     }

//     res.json(notification);
//   } catch (err) {
//     console.error("Error marking notification as read:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// // ─── POST /api/notifications/read-all ────────────────────────────────────────
// // Optionally scope to specific types via ?types=follow_request,follow_accepted
// router.post("/read-all", authMiddleware, async (req, res) => {
//   try {
//     const query = { recipient: req.user.id, read: false };

//     if (req.query.types) {
//       const types = req.query.types.split(",").map((t) => t.trim()).filter(Boolean);
//       if (types.length) query.type = { $in: types };
//     }

//     await Notification.updateMany(query, { read: true });
//     res.json({ success: true });
//   } catch (err) {
//     console.error("Error marking all as read:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// // ─── POST /api/notifications/:id/accept ──────────────────────────────────────
// // Accept a follow request via its notification.
// //
// // Flow:
// //   1. Atomically flip notification status "pending" → "accepted"
// //   2. Atomically flip FollowRequest status "pending" → "accepted"
// //   3. Create Follow relationship (upsert — safe if called twice)
// //   4. Notify the sender that their request was accepted
// router.post("/:id/accept", authMiddleware, async (req, res) => {
//   try {
//     const userId = req.user.id;

//     // Step 1 — atomic notification claim
//     const notification = await Notification.findOneAndUpdate(
//       {
//         _id:       req.params.id,
//         recipient: userId,
//         type:      "follow_request",
//         status:    "pending",
//       },
//       { status: "accepted", read: true },
//       { new: true }
//     );

//     if (!notification) {
//       return res.status(404).json({ error: "Follow request not found or already processed" });
//     }

//     const senderId = notification.sender.toString();

//     // Step 2 — atomic FollowRequest claim
//     await FollowRequest.findOneAndUpdate(
//       { _id: notification.followRequest, status: "pending" },
//       { status: "accepted" }
//     );

//     // Step 3 — create Follow relationship (upsert guards against duplicates)
//     await Follow.findOneAndUpdate(
//       { follower: senderId, following: userId },
//       { follower: senderId, following: userId },
//       { upsert: true, new: true }
//     );

//     // Step 4 — notify the sender
//     await Notification.create({
//       recipient:     senderId,
//       sender:        userId,
//       type:          "follow_accepted",
//       followRequest: notification.followRequest,
//     });

//     res.json({ success: true });
//   } catch (err) {
//     console.error("Error accepting follow request:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// // ─── POST /api/notifications/:id/decline ─────────────────────────────────────
// // Decline a follow request via its notification.
// //
// // Flow:
// //   1. Atomically flip notification status "pending" → "declined"
// //   2. Delete the FollowRequest doc entirely
// //   3. Sender is NOT notified
// router.post("/:id/decline", authMiddleware, async (req, res) => {
//   try {
//     const userId = req.user.id;

//     // Step 1 — atomic notification claim
//     const notification = await Notification.findOneAndUpdate(
//       {
//         _id:       req.params.id,
//         recipient: userId,
//         type:      "follow_request",
//         status:    "pending",
//       },
//       { status: "declined" },
//       { new: true }
//     );

//     if (!notification) {
//       return res.status(404).json({ error: "Follow request not found or already processed" });
//     }

//     // Step 2 — delete the FollowRequest doc
//     await FollowRequest.findByIdAndDelete(notification.followRequest);

//     res.json({ success: true });
//   } catch (err) {
//     console.error("Error declining follow request:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// // ─── DELETE /api/notifications/:id ───────────────────────────────────────────
// router.delete("/:id", authMiddleware, async (req, res) => {
//   try {
//     const notification = await Notification.findOneAndDelete({
//       _id:       req.params.id,
//       recipient: req.user.id,
//     });

//     if (!notification) {
//       return res.status(404).json({ error: "Notification not found" });
//     }

//     res.json({ success: true });
//   } catch (err) {
//     console.error("Error deleting notification:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// // ─── DELETE /api/notifications ───────────────────────────────────────────────
// // Delete all, or scope by ?types=follow_request,follow_accepted
// router.delete("/", authMiddleware, async (req, res) => {
//   try {
//     const query = { recipient: req.user.id };

//     if (req.query.types) {
//       const types = req.query.types.split(",").map((t) => t.trim()).filter(Boolean);
//       if (types.length) query.type = { $in: types };
//     }

//     await Notification.deleteMany(query);
//     res.json({ success: true });
//   } catch (err) {
//     console.error("Error clearing notifications:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const Follow = require("../models/Follow");
const FollowRequest = require("../models/FollowRequest");
const authMiddleware = require("../middlewares/auth");

// ─── Helper ───────────────────────────────────────────────────────────────────

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// ─── GET /api/notifications ───────────────────────────────────────────────────
router.get("/", authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .populate("sender", "username profilePicture")
      .populate("followRequest")
      .sort({ createdAt: -1 })
      .lean();

    res.json(notifications);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/notifications/unread-count ─────────────────────────────────────
// NOTE: must be registered before /:id so Express doesn't match "unread-count"
// as a param value.
router.get("/unread-count", authMiddleware, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user.id,
      read: false,
    });
    res.json({ count });
  } catch (err) {
    console.error("Error fetching unread count:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/notifications/read-all ────────────────────────────────────────
// NOTE: must be registered before /:id for the same reason.
// Optionally scope to specific types via ?types=follow_request,follow_accepted
router.post("/read-all", authMiddleware, async (req, res) => {
  try {
    const query = { recipient: req.user.id, read: false };

    if (req.query.types) {
      const types = req.query.types
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      if (types.length) query.type = { $in: types };
    }

    await Notification.updateMany(query, { read: true });
    res.json({ success: true });
  } catch (err) {
    console.error("Error marking all as read:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── DELETE /api/notifications ───────────────────────────────────────────────
// FIX: this MUST come before DELETE /:id — otherwise Express matches the empty
// string "" as the :id param and this route is never reached.
// Deletes all, or scope by ?types=follow_request,follow_accepted
router.delete("/", authMiddleware, async (req, res) => {
  try {
    const query = { recipient: req.user.id };

    if (req.query.types) {
      const types = req.query.types
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      if (types.length) query.type = { $in: types };
    }

    await Notification.deleteMany(query);
    res.json({ success: true });
  } catch (err) {
    console.error("Error clearing notifications:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── PATCH /api/notifications/:id/read ───────────────────────────────────────
router.patch("/:id/read", authMiddleware, async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid notification ID" });
  }

  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { read: true },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json(notification);
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/notifications/:id/accept ──────────────────────────────────────
// Accept a follow request via its notification.
//
// Flow:
//   1. Atomically flip notification status "pending" → "accepted"
//   2. Atomically flip FollowRequest status "pending" → "accepted"
//   3. Create Follow relationship (upsert — safe if called twice)
//   4. Notify the sender that their request was accepted
//   5. Delete the original follow_request notification (it's resolved)
router.post("/:id/accept", authMiddleware, async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid notification ID" });
  }

  try {
    const userId = req.user.id;

    // Step 1 — atomic notification claim
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        recipient: userId,
        type: "follow_request",
        status: "pending",
      },
      { status: "accepted", read: true },
      { new: true },
    );

    if (!notification) {
      return res
        .status(404)
        .json({ error: "Follow request not found or already processed" });
    }

    const senderId = notification.sender.toString();

    // Step 2 — atomic FollowRequest claim
    await FollowRequest.findOneAndUpdate(
      { _id: notification.followRequest, status: "pending" },
      { status: "accepted" },
    );

    // Step 3 — create Follow relationship (upsert guards against duplicates)
    await Follow.findOneAndUpdate(
      { follower: senderId, following: userId },
      { follower: senderId, following: userId },
      { upsert: true, new: true },
    );

    // Step 4 — notify the sender
    await Notification.create({
      recipient: senderId,
      sender: userId,
      type: "follow_accepted",
      followRequest: notification.followRequest,
    });

    // Step 5 — FIX: delete the resolved follow_request notification so it
    // doesn't reappear on page refresh after the frontend animates it away.
    await Notification.findByIdAndDelete(req.params.id);

    res.json({ success: true });
  } catch (err) {
    console.error("Error accepting follow request:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/notifications/:id/decline ─────────────────────────────────────
// Decline a follow request via its notification.
//
// Flow:
//   1. Atomically find + verify notification ownership
//   2. Delete the FollowRequest doc entirely
//   3. Delete the notification (so it doesn't reappear on refresh)
//   4. Sender is NOT notified
router.post("/:id/decline", authMiddleware, async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid notification ID" });
  }

  try {
    const userId = req.user.id;

    // Step 1 — find and verify ownership (don't update status — we're deleting it)
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: userId,
      type: "follow_request",
      status: "pending",
    });

    if (!notification) {
      return res
        .status(404)
        .json({ error: "Follow request not found or already processed" });
    }

    // Step 2 — delete the FollowRequest doc
    await FollowRequest.findByIdAndDelete(notification.followRequest);

    // Step 3 — FIX: delete the notification so it doesn't reappear on refresh.
    // Previously the code only set status: "declined" and left the doc in the DB.
    await Notification.findByIdAndDelete(req.params.id);

    res.json({ success: true });
  } catch (err) {
    console.error("Error declining follow request:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── DELETE /api/notifications/:id ───────────────────────────────────────────
router.delete("/:id", authMiddleware, async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid notification ID" });
  }

  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting notification:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;