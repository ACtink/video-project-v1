const express = require("express");
const router = express.Router();

const {
  followUser,
  unfollowUser,
  getPublicProfile,
  blockUser,
  reportUser,
  isFollowing,
  getUsersByIds,
  getProfileByUsername, 
} = require("../controllers/user.controller");

const authMiddleware = require("../middlewares/auth");

// Public profile (no auth required)
router.get("/:userId", getPublicProfile);

router.get("/profile/:username", authMiddleware , getProfileByUsername );


router.post("/by-ids", authMiddleware, getUsersByIds);




// Social actions (auth required)
router.post("/:userId/follow", authMiddleware, followUser);
router.get("/:userId/is-following", authMiddleware, isFollowing);
router.post("/:userId/unfollow", authMiddleware, unfollowUser);
router.post("/:userId/block", authMiddleware, blockUser);
router.post("/:userId/report", authMiddleware, reportUser);

module.exports = router;
