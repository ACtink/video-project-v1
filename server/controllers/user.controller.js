const User = require("../models/User");

/**
 * FOLLOW USER (instant follow)
 */
exports.followUser = async (req, res) => {
  try {
    const currentUserId = req.user.id; // logged-in user
    const targetUserId = req.params.userId; // user to follow

    if (currentUserId === targetUserId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Block checks
    if (
      targetUser.blockedUsers.includes(currentUserId) ||
      currentUser.blockedUsers.includes(targetUserId)
    ) {
      return res.status(403).json({ message: "Action not allowed" });
    }

    // Already following?
    if (currentUser.following.includes(targetUserId)) {
      return res.status(400).json({ message: "Already following this user" });
    }

    currentUser.following.push(targetUserId);
    targetUser.followers.push(currentUserId);

    await currentUser.save();
    await targetUser.save();

    res.status(200).json({ message: "User followed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * UNFOLLOW USER
 */
exports.unfollowUser = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.userId;

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== targetUserId
    );

    targetUser.followers = targetUser.followers.filter(
      (id) => id.toString() !== currentUserId
    );

    await currentUser.save();
    await targetUser.save();

    res.status(200).json({ message: "User unfollowed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET PUBLIC PROFILE
 */
exports.getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select(
      "username bio profilePicture followers following createdAt"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      id: user._id,
      username: user.username,
      bio: user.bio,
      profilePicture: user.profilePicture,
      followersCount: user.followers.length,
      followingCount: user.following.length,
      joinedAt: user.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};



exports.getProfileByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({
      username: username.toLowerCase(),
    }).select("username bio profilePicture followers following postsCount createdAt");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      _id: user._id,
      username: user.username,
      postsCount: user.postsCount,
      bio: user.bio,
      profilePicture: user.profilePicture,
      followers: user.followers, // ids (for modal)
      following: user.following, // ids (for modal)
      followersCount: user.followers.length,
      followingCount: user.following.length,
      postsCount: user.postsCount,
      joinedAt: user.createdAt,
    });
  } catch (err) {
    console.error("getPublicProfileByUsername error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


/**
 * BLOCK USER
 */
exports.blockUser = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.userId;

    const currentUser = await User.findById(currentUserId);

    if (currentUser.blockedUsers.includes(targetUserId)) {
      return res.status(400).json({ message: "User already blocked" });
    }

    currentUser.blockedUsers.push(targetUserId);

    // Remove follow relationships
    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== targetUserId
    );

    currentUser.followers = currentUser.followers.filter(
      (id) => id.toString() !== targetUserId
    );

    await currentUser.save();

    res.status(200).json({ message: "User blocked successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * REPORT USER
 */
exports.reportUser = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const targetUserId = req.params.userId;

    if (currentUser.reportedUsers.includes(targetUserId)) {
      return res.status(400).json({ message: "User already reported" });
    }

    currentUser.reportedUsers.push(targetUserId);
    await currentUser.save();

    res.status(200).json({ message: "User reported successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};



/**
 * CHECK IF LOGGED-IN USER IS FOLLOWING TARGET USER
 * GET /api/users/:userId/is-following
 */
exports.isFollowing = async (req, res) => {
  try {
    const currentUserId = req.user.id; // from auth middleware
    const targetUserId = req.params.userId;

    // Prevent self-check (optional safety)
    if (currentUserId === targetUserId) {
      return res.status(200).json({ isFollowing: false });
    }

    const currentUser = await User.findById(currentUserId).select("following");

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isFollowing = currentUser.following.some(
      (id) => id.toString() === targetUserId
    );

    return res.status(200).json({ isFollowing });
  } catch (err) {
    console.error("IS FOLLOWING ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};





exports.getUsersByIds = async (req, res) => {
  try {
    const { ids } = req.body;

    // 🛑 Validation
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        message: "ids must be a non-empty array",
      });
    }

    // ✅ Fetch users
    const users = await User.find({
      _id: { $in: ids },
    })
      .select("_id username profilePicture")
      .lean();

    return res.status(200).json(users);
  } catch (error) {
    console.error("getUsersByIds error:", error);
    return res.status(500).json({
      message: "Failed to fetch users",
    });
  }
};
