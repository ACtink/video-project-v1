const express = require("express");
const router = express.Router();
const multer = require("multer");
const authMiddleware = require("../middlewares/auth");
const fs = require("fs");
const Post = require("../models/Post");
const { uploadToS3 } = require("../utils/s3-upload");
const User = require("../models/User");
const { deleteFromS3 } = require("../utils/s3-delete");

const upload = multer({
  dest: "temp/",
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only images allowed"), false);
    }
    cb(null, true);
  },
});




router.put(
  "/profile-picture",
  authMiddleware,
  upload.single("profilePicture"), // ✅ MATCH FRONTEND
  async (req, res) => {
    try {
      const userId = req.user.id; // or req.user._id (both ok if normalized)

      if (!req.file) {
        return res.status(400).json({ error: "No image uploaded" });
      }

      // 1️⃣ Fetch user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const oldProfilePicture = user.profilePicture;

      // 2️⃣ Upload to S3
      const newProfilePicture = await uploadToS3(req.file, {
        folder: "avatars",
        filename: `user-${userId}`,
      });

      // 3️⃣ Save new profile picture
      user.profilePicture = newProfilePicture;
      await user.save();

      // 4️⃣ (Optional) delete old avatar async
      // deleteFromS3(oldProfilePicture).catch(console.error);

      // ✅ RETURN UPDATED USER (frontend needs this)
     res.status(200).json({
       _id: user._id,
       username: user.username,
       email: user.email,
       country: user.country,
       profilePicture: user.profilePicture,
       followers: user.followers,
       following: user.following,
     });

    } catch (error) {
      console.error("Profile picture upload error:", error);
      res.status(500).json({ error: "Failed to upload profile picture" });
    }
  },
);


router.delete("/profile-picture", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 🚫 If already removed
    if (!user.profilePicture) {
      return res.status(400).json({ error: "No profile picture to remove" });
    }

    /* 
      OPTIONAL: delete from cloud storage here
      Example:
      await deleteFromS3(user.profilePicture);
      await deleteFromCloudinary(user.profilePicture);
    */

    // ✅ Remove profile picture

    await deleteFromS3(user.profilePicture);
    user.profilePicture = null;
    await user.save();

    return res.json({
      success: true,
      message: "Profile picture removed successfully",
    });
  } catch (err) {
    console.error("Remove profile picture error:", err);
    return res.status(500).json({ error: "Server error" });
  }
})




router.post(
  "/post",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { caption } = req.body;

      if (!req.file) {
        return res.status(400).json({ error: "No image uploaded" });
      }

      // 1️⃣ Create DB post first (no image yet)
      const post = await Post.create({
        user: userId,
        caption,
        imageUrl: "temp", // temporary
      });

      // 2️⃣ Upload image using post._id
      const imageUrl = await uploadToS3(req.file, {
        folder: "posts",
        filename: `post${post._id}`,
      });

      console.log("IMAGE URL:", imageUrl);

      // 3️⃣ Update post with image URL
      post.imageUrl = imageUrl;


     

      await post.save();

      
    await User.findByIdAndUpdate(userId, {
       $inc: { postsCount: 1 },
         });

      res.status(201).json(post);
    } catch (error) {
      console.error("Post creation error:", error);
      res.status(500).json({ error: "Failed to create post" });
    } finally {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }
  },
);


module.exports = router;