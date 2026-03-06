const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const authMiddleware = require("../middlewares/auth");

const mongoose = require("mongoose");
const User = require("../models/User");
const { deleteFromS3 } = require("../utils/s3-delete");


// GET all posts (feed)
// router.get("/", async (req, res) => {
//   try {
//     const posts = await Post.find({
//       isDeleted: false,
//       visibility: "public",
//     })
//       .populate("user", "username profilePicture") // fetch user data
//       .sort({ createdAt: -1 })
//       .limit(50); // protect backend

//     res.status(200).json(posts);
//   } catch (error) {
//     console.error("Fetch posts error:", error);
//     res.status(500).json({ error: "Failed to fetch posts" });
//   }
// });


// router.get("/", authMiddleware, async (req, res) => {
//   try {
//     const loggedInUserId = req.user.id;

//     // 1️⃣ Fetch logged-in user's followers & following
//     const user = await User.findById(loggedInUserId).select(
//       "followers following",
//     );

//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     // 2️⃣ Create allowed users list
//     const allowedUsers = [
//       ...user.followers,
//       ...user.following,
//       loggedInUserId, // include your own posts
//     ];

//     // Remove duplicates
//     const uniqueAllowedUsers = [...new Set(allowedUsers.map(String))];

//     // 3️⃣ Fetch posts only from allowed users
//     const posts = await Post.find({
//       user: { $in: uniqueAllowedUsers },
//       isDeleted: false,
//       visibility: "public",
//     })
//       .populate("user", "username profilePicture")
//       .sort({ createdAt: -1 })
//       .limit(50);

//     res.status(200).json(posts);
//   } catch (error) {
//     console.error("Fetch posts error:", error);
//     res.status(500).json({ error: "Failed to fetch posts" });
//   }
// });


router.get("/", authMiddleware, async (req, res) => {
  try {
    const loggedInUserId = req.user.id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    // 1️⃣ Fetch logged-in user's followers & following
    const user = await User.findById(loggedInUserId).select(
      "followers following",
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2️⃣ Create allowed users list
    const allowedUsers = [...user.followers, ...user.following, loggedInUserId];

    // Remove duplicates
    const uniqueAllowedUsers = [...new Set(allowedUsers.map(String))];

    // 3️⃣ Fetch posts only from allowed users
    const posts = await Post.find({
      user: { $in: uniqueAllowedUsers },
      isDeleted: false,
      visibility: "public",
    })
      .populate("user", "username profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip) // ✅ pagination
      .limit(limit); // ✅ pagination

    res.status(200).json(posts);
  } catch (error) {
    console.error("Fetch posts error:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});






router.get("/user/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const authUser = req.user || null; // if logged in (via middleware)

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const isMe =
      authUser && authUser.id.toString() === userId.toString();

    /**
     * Visibility logic
     */
    let visibilityFilter = [{ visibility: "public" }];

    if (isMe) {
      // Owner can see everything
      visibilityFilter = [
        { visibility: "public" },
        { visibility: "followers" },
        { visibility: "private" },
      ];
    } else if (authUser) {
      // Logged in but not owner
      visibilityFilter = [
        { visibility: "public" },
        { visibility: "followers" },
      ];
    }

    const posts = await Post.find({
      user: userId,
      isDeleted: false,
      $or: visibilityFilter,
    })
      .sort({ createdAt: -1 })
      .select(
        "imageUrl caption likesCount commentsCount createdAt visibility"
      ).populate("user", "username profilePicture postsCount")
      .lean();

    res.status(200).json(posts);
  } catch (err) {
    console.error("getPostsByUser error:", err);
    res.status(500).json({ message: "Server error" });
  }
});



router.delete("/:postId", authMiddleware, async function deletePost(req, res) {
  try {
    const postId = req.params.postId;

    const userId = req.user.id; // from auth middleware

    // Find post
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    // Ownership check
    if (post.user.toString() !== userId) {
      return res.status(403).json({
        message: "Not authorized to delete this post",
      });
    }

    await Post.findByIdAndDelete(postId);

    await deleteFromS3(post.imageUrl);

    res.json({
      message: "Post deleted successfully",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
});


module.exports = router;
