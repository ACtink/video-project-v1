// const express = require("express");
// const router = express.Router();

// const rateLimit = require("express-rate-limit");
// const sanitizeHtml = require("sanitize-html");

// const {
//   followUser,
//   unfollowUser,
//   getPublicProfile,
//   blockUser,
//   reportUser,
//   isFollowing,
//   getUsersByIds,
//   getProfileByUsername,
// } = require("../controllers/user.controller");

// const authMiddleware = require("../middlewares/auth");
// const User = require("../models/User");

// router.get("/profile/:username", authMiddleware , getProfileByUsername );

// router.post("/by-ids", authMiddleware, getUsersByIds);

// // Social actions (auth required)
// router.post("/:userId/follow", authMiddleware, followUser);
// router.get("/:userId/is-following", authMiddleware, isFollowing);
// router.post("/:userId/unfollow", authMiddleware, unfollowUser);
// router.post("/:userId/block", authMiddleware, blockUser);
// router.post("/:userId/report", authMiddleware, reportUser);

// const editProfileLimiter = rateLimit({
//   windowMs: 10 * 60 * 1000, // 10 minutes
//   max: 20,
//   message: { error: "Too many profile edits. Try again later." },
// });

// router.patch("/edit-profile", authMiddleware, editProfileLimiter, async (req, res) => {

//   console.log("edit profile me request ayi hai")
//   try {
//     const { fullName, bio } = req.body;

//     const user = await User.findById(req.user.id).select("-password");

//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     if (fullName !== undefined) {
//       user.fullName = fullName.trim();
//     }

//     if (bio !== undefined) {
//       const cleanBio = sanitizeHtml(bio.trim(), {
//         allowedTags: [],
//         allowedAttributes: {},
//       });

//       if (cleanBio.length > 150) {
//         return res
//           .status(400)
//           .json({ error: "Bio cannot exceed 150 characters" });
//       }

//       user.bio = cleanBio;
//     }

//     await user.save();

//     console.log("user updated:", user);

//     res.json(user);
//   } catch (err) {
//     console.error("Edit profile error:", err);
//     res.status(500).json({ error: "Failed to update profile" });
//   }
// });

// // Public profile (no auth required)
// router.get("/:userId", getPublicProfile);

// module.exports = router;

// const express = require("express");
// const router = express.Router();

// const rateLimit = require("express-rate-limit");
// const sanitizeHtml = require("sanitize-html");

// const {
//   followUser,
//   unfollowUser,
//   getPublicProfile,
//   blockUser,
//   reportUser,
//   isFollowing,
//   getUsersByIds,
//   getProfileByUsername,
//   unblockUser,
//   acceptFollowRequest,
//   declineFollowRequest,
//   cancelFollowRequest,
// } = require("../controllers/user.controller");

// const authMiddleware = require("../middlewares/auth");
// const User = require("../models/User");

// // ── SPECIFIC routes first ──
// router.get("/profile/:username", authMiddleware, getProfileByUsername);
// router.post("/by-ids", authMiddleware, getUsersByIds);

// const editProfileLimiter = rateLimit({
//   windowMs: 10 * 60 * 1000,
//   max: 20,
//   message: { error: "Too many profile edits. Try again later." },
// });

// router.patch(
//   "/edit-profile",
//   authMiddleware,
//   editProfileLimiter,
//   async (req, res) => {
//     console.log("edit profile me request ayi hai");
//     try {
//       const { fullName, bio } = req.body;

//       const user = await User.findById(req.user.id).select("-password");

//       if (!user) {
//         return res.status(404).json({ error: "User not found" });
//       }

//       if (fullName !== undefined) {
//         user.fullName = fullName.trim();
//       }

//       if (bio !== undefined) {
//         const cleanBio = sanitizeHtml(bio.trim(), {
//           allowedTags: [],
//           allowedAttributes: {},
//         });

//         if (cleanBio.length > 150) {
//           return res
//             .status(400)
//             .json({ error: "Bio cannot exceed 150 characters" });
//         }

//         user.bio = cleanBio;
//       }

//       await user.save();
//       console.log("user updated:", user);
//       res.json(user);
//     } catch (err) {
//       console.error("Edit profile error:", err);
//       res.status(500).json({ error: "Failed to update profile" });
//     }
//   },
// );

// // ── WILDCARD routes last ──
// router.get("/:userId", getPublicProfile);
// router.post("/:userId/follow", authMiddleware, followUser);
// router.get("/:userId/is-following", authMiddleware, isFollowing);
// router.post("/:userId/unfollow", authMiddleware, unfollowUser);
// router.post("/:userId/block", authMiddleware, blockUser);
// router.post("/:userId/unblock", authMiddleware, unblockUser);

// router.post("/:userId/report", authMiddleware, reportUser);

// router.delete("/:userId/follow-request", authMiddleware, cancelFollowRequest);
// router.patch(
//   "/follow-requests/:requestId/accept",
//   authMiddleware,
//   acceptFollowRequest,
// );
// router.patch(
//   "/follow-requests/:requestId/decline",
//   authMiddleware,
//   declineFollowRequest,
// );

// router.get("/:userId/block-status", authMiddleware, async (req, res) => {
//   try {
//     const currentUser = await User.findById(req.user.id).select("blockedUsers");
//     const isBlocked = currentUser.blockedUsers
//       .map(String)
//       .includes(String(req.params.userId));
//     res.json({ isBlocked });
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();

const rateLimit = require("express-rate-limit");
const sanitizeHtml = require("sanitize-html");

const {
  followUser,
  unfollowUser,
  getPublicProfile,
  blockUser,
  reportUser,
  isFollowing,
  getUsersByIds,
  getProfileByUsername,
  unblockUser,
  acceptFollowRequest,
  declineFollowRequest,
  cancelFollowRequest,
  getFollowers, // ← new
  getFollowing, // ← new
  directFollow, // ← new
} = require("../controllers/user.controller");

const authMiddleware = require("../middlewares/auth");
const User = require("../models/User");

// ── SPECIFIC routes first (no :param ambiguity) ────────────────────────────────
router.get("/profile/:username", authMiddleware, getProfileByUsername);
router.post("/by-ids", authMiddleware, getUsersByIds);

router.patch(
  "/follow-requests/:requestId/accept",
  authMiddleware,
  acceptFollowRequest,
);
router.patch(
  "/follow-requests/:requestId/decline",
  authMiddleware,
  declineFollowRequest,
);

const editProfileLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: { error: "Too many profile edits. Try again later." },
});

router.patch(
  "/edit-profile",
  authMiddleware,
  editProfileLimiter,
  async (req, res) => {
    try {
      const { fullName, bio } = req.body;
      const user = await User.findById(req.user.id).select("-password");

      if (!user) return res.status(404).json({ error: "User not found" });

      if (fullName !== undefined) user.fullName = fullName.trim();

      if (bio !== undefined) {
        const cleanBio = sanitizeHtml(bio.trim(), {
          allowedTags: [],
          allowedAttributes: {},
        });
        if (cleanBio.length > 150)
          return res
            .status(400)
            .json({ error: "Bio cannot exceed 150 characters" });
        user.bio = cleanBio;
      }

      await user.save();
      res.json(user);
    } catch (err) {
      console.error("Edit profile error:", err);
      res.status(500).json({ error: "Failed to update profile" });
    }
  },
);
router.post("/:userId/direct-follow", authMiddleware, directFollow); // ← new route for direct follow without request
// ── WILDCARD :userId routes ────────────────────────────────────────────────────
router.get("/:userId", getPublicProfile);
router.get("/:userId/is-following", authMiddleware, isFollowing);
router.get("/:userId/followers", authMiddleware, getFollowers); // ← new
router.get("/:userId/following", authMiddleware, getFollowing); // ← new
router.get("/:userId/block-status", authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id).select("blockedUsers");
    const isBlocked = currentUser.blockedUsers
      .map(String)
      .includes(String(req.params.userId));
    res.json({ isBlocked });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:userId/follow", authMiddleware, followUser);
router.delete("/:userId/unfollow", authMiddleware, unfollowUser); // DELETE not POST
router.delete("/:userId/follow-request", authMiddleware, cancelFollowRequest);
router.post("/:userId/block", authMiddleware, blockUser);
router.delete("/:userId/block", authMiddleware, unblockUser); // DELETE not POST
router.post("/:userId/report", authMiddleware, reportUser);

module.exports = router;