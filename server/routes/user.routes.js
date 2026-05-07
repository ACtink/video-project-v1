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

const bcrypt = require("bcrypt");


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
const FollowRequest = require("../models/FollowRequest");


/ ─────────────────────────────────────────────────────────────────────────────/;
// GET /api/users/suggested?page=1&limit=6
//
// Returns a paginated list of users the current user:
//   - is NOT already following
//   - has NOT already sent a follow request to
//   - has NOT blocked / been blocked by
//   - is NOT themselves
//
// Ranking priority (descending):
//   1. Friends-of-friends (users followed by people you follow)
//   2. Same country
//   3. Follower count (most popular first)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/suggested", authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(20, parseInt(req.query.limit) || 6);
    const skip = (page - 1) * limit;

    // ── 1. Gather IDs to exclude ─────────────────────────────────────────────
    const currentUser = await User.findById(currentUserId)
      .select("following blockedUsers country")
      .lean();

    if (!currentUser)
      return res.status(401).json({ message: "User not found" });

    // Users the current user already sent a request to (pending or accepted)
    const sentRequests = await FollowRequest.find({ from: currentUserId })
      .select("to")
      .lean();

    const sentToIds = sentRequests.map((r) => r.to);

    // Full exclusion set: self + following + blocked + already requested
    const excludeIds = [
      currentUserId,
      ...currentUser.following,
      ...currentUser.blockedUsers,
      ...sentToIds,
    ];

    // ── 2. Build friends-of-friends set ──────────────────────────────────────
    // Who do the people I follow, follow? Those are warm suggestions.
    let friendsOfFriends = [];
    if (currentUser.following.length > 0) {
      const followedUsers = await User.find({
        _id: { $in: currentUser.following },
      })
        .select("following")
        .lean();

      const fofSet = new Set();
      for (const u of followedUsers) {
        for (const id of u.following) {
          const idStr = id.toString();
          // Only add if not already in the exclusion list
          if (!excludeIds.some((e) => e.toString() === idStr)) {
            fofSet.add(idStr);
          }
        }
      }
      friendsOfFriends = Array.from(fofSet);
    }

    // ── 3. Query candidates ───────────────────────────────────────────────────
    const candidates = await User.find({
      _id: { $nin: excludeIds },
      isBanned: false,
      isActive: true,
    })
      .select("_id username fullName profilePicture country followers")
      .lean();

    // ── 4. Score & rank ───────────────────────────────────────────────────────
    const fofSet = new Set(friendsOfFriends);

    const scored = candidates.map((u) => {
      const isFof = fofSet.has(u._id.toString());
      const sameCountry = u.country === currentUser.country;
      const followerCount = u.followers?.length ?? 0;

      // Score: friends-of-friends gets the biggest boost
      const score =
        (isFof ? 1000 : 0) +
        (sameCountry ? 100 : 0) +
        Math.min(followerCount, 99); // cap so popularity doesn't dominate over fof

      return { ...u, _score: score, mutualCount: isFof ? 1 : 0 };
    });

    scored.sort((a, b) => b._score - a._score);

    // ── 5. Paginate & shape response ──────────────────────────────────────────
    const paginated = scored.slice(skip, skip + limit);

    const result = paginated.map(({ _score, followers, ...u }) => ({
      _id: u._id,
      username: u.username,
      fullName: u.fullName,
      profilePicture: u.profilePicture,
      country: u.country,
      followersCount: followers?.length ?? 0,
      mutualCount: u.mutualCount,
    }));

    return res.json(result);
  } catch (err) {
    console.error("GET /users/suggested error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/follow-requests/sent/count
//
// Returns the number of pending follow requests the current user has sent.
// Used by the empty feed state to show "X pending requests" messaging.
// ─────────────────────────────────────────────────────────────────────────────
router.get("/follow-requests/sent/count", authMiddleware, async (req, res) => {
  try {
    const count = await FollowRequest.countDocuments({
      from: req.user.id,
      status: "pending",
    });

    return res.json({ count });
  } catch (err) {
    console.error("GET /users/follow-requests/sent/count error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});


// ── GET /api/users/blocked ─────────────────────────────────────
// Returns the list of users blocked by the logged-in user
router.get("/blocked", authMiddleware, async (req, res) => {
  try {

    console.log("Fetching blocked users for user:", req.user.id);
    const currentUser = await User.findById(req.user.id)
      .populate("blockedUsers", "_id username fullName profilePicture")
      .lean();

    res.json(currentUser.blockedUsers || []);
  } catch (err) {
    console.error("Error fetching blocked users:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});



// ── PATCH /api/users/change-password ──────────────────────────
// Body: { currentPassword, newPassword }
router.patch("/change-password", authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Both fields are required" });
  }

  if (newPassword.length < 8) {
    return res
      .status(400)
      .json({ error: "New password must be at least 8 characters" });
  }

  try {
    const user = await User.findById(req.user.id).select("+password");
    if (!user) return res.status(404).json({ error: "User not found" });

    // Verify current password — adjust to however you hash (bcrypt shown here)
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    if (currentPassword === newPassword) {
      return res
        .status(400)
        .json({ error: "New password must be different from current" });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Error changing password:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});



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