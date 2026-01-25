const express = require("express");
const router = express.Router();
const multer = require("multer");
const authMiddleware = require("../middlewares/auth");
const fs = require("fs");
const Post = require("../models/Post");
const { uploadToS3 } = require("../utils/s3-upload");

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





router.post(
  "/avatar",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      const userId = req.user.id;

      if (!req.file) {
        return res.status(400).json({ error: "No image uploaded" });
      }

      // 1️⃣ fetch user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const oldAvatarUrl = user.avatarUrl; // backup

      // 2️⃣ upload new avatar
      const newAvatarUrl = await uploadToS3(req.file, {
        folder: "avatars",
        filename: `user${userId}`,
      });

      // 3️⃣ commit
      user.avatarUrl = newAvatarUrl;
      await user.save();

      // 4️⃣ optional: delete old avatar from S3
      // (do this async / best-effort)
      // await deleteFromS3(oldAvatarUrl);

      res.status(200).json({ avatarUrl: newAvatarUrl });
    } catch (error) {
      console.error("Avatar upload error:", error);
      res.status(500).json({ error: "Failed to upload avatar" });
    } finally {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }
  },
);



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