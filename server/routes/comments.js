const express = require("express");
const router = express.Router();
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const authMiddleware = require("../middlewares/auth");

// GET /posts/:postId/comments
router.get("/:postId/comments", authMiddleware, async (req, res) => {
  const comments = await Comment.find({
    post: req.params.postId,
    isDeleted: false,
  })
    .populate("user", "username profilePic")
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({ success: true, comments });
});

// POST /posts/:postId/comments
router.post("/:postId/comments", authMiddleware, async (req, res) => {
  const comment = await Comment.create({
    post: req.params.postId,
    user: req.user._id,
    text: req.body.text,
  });

  await Post.findByIdAndUpdate(req.params.postId, {
    $inc: { commentsCount: 1 },
  });

  await comment.populate("user", "username profilePic");
  res.status(201).json({ success: true, comment });
});

// DELETE /posts/:postId/comments/:commentId
router.delete("/:postId/comments/:commentId", authMiddleware, async (req, res) => {
  const comment = await Comment.findOneAndUpdate(
    { _id: req.params.commentId, user: req.user._id },
    { isDeleted: true },
  );

  if (!comment)
    return res
      .status(404)
      .json({ success: false, message: "Comment not found" });

  await Post.findByIdAndUpdate(req.params.postId, {
    $inc: { commentsCount: -1 },
  });
  res.json({ success: true });
});

module.exports = router;
