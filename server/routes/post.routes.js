// const express = require("express");
// const router = express.Router();
// const Post = require("../models/Post");
// const authMiddleware = require("../middlewares/auth");

// const mongoose = require("mongoose");
// const User = require("../models/User");
// const { deleteFromS3 } = require("../utils/s3-delete");





// router.get("/", authMiddleware, async (req, res) => {
//   try {
//     const loggedInUserId = req.user.id;

//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;

//     const skip = (page - 1) * limit;

//     // 1️⃣ Fetch logged-in user's followers & following
//     const user = await User.findById(loggedInUserId).select(
//       "followers following",
//     );

//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     // 2️⃣ Create allowed users list
//     const allowedUsers = [...user.followers, ...user.following, loggedInUserId];

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
//       .skip(skip) // ✅ pagination
//       .limit(limit); // ✅ pagination

//     res.status(200).json(posts);
//   } catch (error) {
//     console.error("Fetch posts error:", error);
//     res.status(500).json({ error: "Failed to fetch posts" });
//   }
// });






// router.get("/user/:userId", authMiddleware, async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const authUser = req.user || null; // if logged in (via middleware)

//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({ message: "Invalid user id" });
//     }

//     const isMe =
//       authUser && authUser.id.toString() === userId.toString();

//     /**
//      * Visibility logic
//      */
//     let visibilityFilter = [{ visibility: "public" }];

//     if (isMe) {
//       // Owner can see everything
//       visibilityFilter = [
//         { visibility: "public" },
//         { visibility: "followers" },
//         { visibility: "private" },
//       ];
//     } else if (authUser) {
//       // Logged in but not owner
//       visibilityFilter = [
//         { visibility: "public" },
//         { visibility: "followers" },
//       ];
//     }

//     const posts = await Post.find({
//       user: userId,
//       isDeleted: false,
//       $or: visibilityFilter,
//     })
//       .sort({ createdAt: -1 })
//       .select(
//         "imageUrl caption likesCount commentsCount createdAt visibility"
//       ).populate("user", "username profilePicture postsCount")
//       .lean();

//     res.status(200).json(posts);
//   } catch (err) {
//     console.error("getPostsByUser error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });



// router.delete("/:postId", authMiddleware, async function deletePost(req, res) {
//   try {
//     const postId = req.params.postId;

//     const userId = req.user.id; // from auth middleware

//     // Find post
//     const post = await Post.findById(postId);

//     if (!post) {
//       return res.status(404).json({
//         message: "Post not found",
//       });
//     }

//     // Ownership check
//     if (post.user.toString() !== userId) {
//       return res.status(403).json({
//         message: "Not authorized to delete this post",
//       });
//     }

//     await Post.findByIdAndDelete(postId);

//     await deleteFromS3(post.imageUrl);

//     res.json({
//       message: "Post deleted successfully",
//     });
//   } catch (err) {
//     console.error(err);

//     res.status(500).json({
//       message: "Server error",
//     });
//   }
// });


// module.exports = router;



const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const authMiddleware = require("../middlewares/auth");

const mongoose = require("mongoose");
const User = require("../models/User");
const { deleteFromS3 } = require("../utils/s3-delete");

router.get("/", authMiddleware, async (req, res) => {
  try {
    const loggedInUserId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(loggedInUserId).select(
      "followers following",
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    const allowedUsers = [...user.followers, ...user.following, loggedInUserId];
    const uniqueAllowedUsers = [...new Set(allowedUsers.map(String))];

    const posts = await Post.find({
      user: { $in: uniqueAllowedUsers },
      isDeleted: false,
      visibility: "public",
    })
      .populate("user", "username profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json(posts);
  } catch (error) {
    console.error("Fetch posts error:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

router.get("/user/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const authUser = req.user || null;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const isMe = authUser && authUser.id.toString() === userId.toString();

    let visibilityFilter = [{ visibility: "public" }];
    if (isMe) {
      visibilityFilter = [
        { visibility: "public" },
        { visibility: "followers" },
        { visibility: "private" },
      ];
    } else if (authUser) {
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
      .select("imageUrl caption likesCount commentsCount createdAt visibility")
      .populate("user", "username profilePicture postsCount")
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
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.user.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this post" });
    }

    await Post.findByIdAndDelete(postId);
    await deleteFromS3(post.imageUrl);

    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── Comments ──────────────────────────────────────────────

// GET /api/posts/:postId/comments
router.get("/:postId/comments", authMiddleware, async (req, res) => {
  try {
    const comments = await Comment.find({
      post: req.params.postId,
      isDeleted: false,
    })
      .populate("user", "username profilePicture")
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, comments });
  } catch (err) {
    console.error("Fetch comments error:", err);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// POST /api/posts/:postId/comments
router.post("/:postId/comments", authMiddleware, async (req, res) => {
  try {
    const comment = await Comment.create({
      post: req.params.postId,
      user: req.user.id,
      text: req.body.text,
    });

    await Post.findByIdAndUpdate(req.params.postId, {
      $inc: { commentsCount: 1 },
    });
    await comment.populate("user", "username profilePicture");

    res.status(201).json({ success: true, comment });
  } catch (err) {
    console.error("Create comment error:", err);
    res.status(500).json({ error: "Failed to create comment" });
  }
});

// DELETE /api/posts/:postId/comments/:commentId
// router.delete(
//   "/:postId/comments/:commentId",
//   authMiddleware,
//   async (req, res) => {
//     try {
//       const comment = await Comment.findOneAndUpdate(
//         { _id: req.params.commentId, user: req.user.id },
//         { isDeleted: true },
//       );

//       if (!comment) return res.status(404).json({ error: "Comment not found" });

//       await Post.findByIdAndUpdate(req.params.postId, {
//         $inc: { commentsCount: -1 },
//       });

//       res.json({ success: true });
//     } catch (err) {
//       console.error("Delete comment error:", err);
//       res.status(500).json({ error: "Failed to delete comment" });
//     }
//   },
// );


router.delete(
  "/:postId/comments/:commentId",
  authMiddleware,
  async (req, res) => {
    try {
      const comment = await Comment.findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(req.params.commentId),
          user: new mongoose.Types.ObjectId(req.user.id),
        },
        { isDeleted: true },
      );

      if (!comment) return res.status(404).json({ error: "Comment not found" });

      await Post.findByIdAndUpdate(req.params.postId, {
        $inc: { commentsCount: -1 },
      });

      res.json({ success: true });
    } catch (err) {
      console.error("Delete comment error:", err);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  },
);

module.exports = router;
