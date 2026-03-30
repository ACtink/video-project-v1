const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/auth");
const NotInterested = require("../models/NotInterested");
const Report = require("../models/Report");
const User = require("../models/User");



// ── Admin guard middleware ──────────────────────────────────────
const adminOnly = (req, res, next) => {
  if (String(req.user.id) !== process.env.ADMIN_USER_ID) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
};

// ── GET /api/admin/reports?status=pending|dismissed ────────────
router.get("/reports", authMiddleware, adminOnly, async (req, res) => {
  const status = req.query.status === "dismissed" ? "dismissed" : "pending";
  try {
    // Group reports by post, count reasons
    const grouped = await Report.aggregate([
      { $match: { status } },
      {
        $group: {
          _id: "$post",
          reportCount: { $sum: 1 },
          reasons: { $push: "$reason" },
        },
      },
      { $sort: { reportCount: -1 } },
      {
        $lookup: {
          from: "posts",
          localField: "_id",
          foreignField: "_id",
          as: "post",
        },
      },
      { $unwind: "$post" },
      {
        $lookup: {
          from: "users",
          localField: "post.user",
          foreignField: "_id",
          as: "post.user",
        },
      },
      { $unwind: "$post.user" },
      {
        $project: {
          reportCount: 1,
          reasons: 1,
          "post._id": 1,
          "post.imageUrl": 1,
          "post.caption": 1,
          "post.user._id": 1,
          "post.user.username": 1,
          "post.user.profilePicture": 1,
        },
      },
    ]);

    // Format reasons as [{reason, count}] sorted by count
    const formatted = grouped.map((g) => {
      const reasonMap = {};
      g.reasons.forEach((r) => {
        reasonMap[r] = (reasonMap[r] || 0) + 1;
      });
      return {
        ...g,
        reasons: Object.entries(reasonMap)
          .map(([reason, count]) => ({ reason, count }))
          .sort((a, b) => b.count - a.count),
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

// ── POST /api/admin/reports/:postId/dismiss ────────────────────
router.post(
  "/reports/:postId/dismiss",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      await Report.updateMany(
        { post: req.params.postId },
        { $set: { status: "dismissed" } },
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to dismiss" });
    }
  },
);

// ── DELETE /api/admin/posts/:postId ───────────────────────────
router.delete("/posts/:postId", authMiddleware, adminOnly, async (req, res) => {
  try {
    await Post.findByIdAndUpdate(req.params.postId, { isDeleted: true });
    await Report.updateMany(
      { post: req.params.postId },
      { $set: { status: "dismissed" } },
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete post" });
  }
});

// ── POST /api/admin/users/:userId/ban ─────────────────────────
router.post(
  "/users/:userId/ban",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      await User.findByIdAndUpdate(req.params.userId, { isBanned: true });
      // Also soft-delete all their posts
      await Post.updateMany(
        { user: req.params.userId },
        { $set: { isDeleted: true } },
      );
      // Dismiss all reports against them
      const posts = await Post.find({ user: req.params.userId }).distinct(
        "_id",
      );
      await Report.updateMany(
        { post: { $in: posts } },
        { $set: { status: "dismissed" } },
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to ban user" });
    }
  },
);

module.exports = router;
