const express = require("express");
const router = express.Router();
const Post = require("../models/Post");

// GET all posts (feed)
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find({
      isDeleted: false,
      visibility: "public",
    })
      .populate("user", "username avatarUrl")
      .sort({ createdAt: -1 })
      .limit(50); // protect backend

    res.status(200).json(posts);
  } catch (error) {
    console.error("Fetch posts error:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

module.exports = router;
