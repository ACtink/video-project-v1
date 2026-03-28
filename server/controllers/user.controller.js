// const User = require("../models/User");

// /**
//  * FOLLOW USER (instant follow)
//  */
// exports.followUser = async (req, res) => {
//   try {
//     const currentUserId = req.user.id; // logged-in user
//     const targetUserId = req.params.userId; // user to follow

//     if (currentUserId === targetUserId) {
//       return res.status(400).json({ message: "You cannot follow yourself" });
//     }

//     const currentUser = await User.findById(currentUserId);
//     const targetUser = await User.findById(targetUserId);

//     if (!targetUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Block checks
//     if (
//       targetUser.blockedUsers.includes(currentUserId) ||
//       currentUser.blockedUsers.includes(targetUserId)
//     ) {
//       return res.status(403).json({ message: "Action not allowed" });
//     }

//     // Already following?
//     if (currentUser.following.includes(targetUserId)) {
//       return res.status(400).json({ message: "Already following this user" });
//     }

//     currentUser.following.push(targetUserId);
//     targetUser.followers.push(currentUserId);

//     await currentUser.save();
//     await targetUser.save();

//     res.status(200).json({ message: "User followed successfully" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// /**
//  * UNFOLLOW USER
//  */
// exports.unfollowUser = async (req, res) => {
//   try {
//     const currentUserId = req.user.id;
//     const targetUserId = req.params.userId;

//     const currentUser = await User.findById(currentUserId);
//     const targetUser = await User.findById(targetUserId);

//     if (!targetUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     currentUser.following = currentUser.following.filter(
//       (id) => id.toString() !== targetUserId
//     );

//     targetUser.followers = targetUser.followers.filter(
//       (id) => id.toString() !== currentUserId
//     );

//     await currentUser.save();
//     await targetUser.save();

//     res.status(200).json({ message: "User unfollowed successfully" });
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// };

// /**
//  * GET PUBLIC PROFILE
//  */
// exports.getPublicProfile = async (req, res) => {
//   try {
//     const user = await User.findById(req.params.userId).select(
//       "username bio profilePicture followers following createdAt"
//     );

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.status(200).json({
//       id: user._id,
//       username: user.username,
//       fullName: user.fullName,
//       bio: user.bio,
//       profilePicture: user.profilePicture,
//       followersCount: user.followers.length,
//       followingCount: user.following.length,
//       joinedAt: user.createdAt,
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// };

// exports.getProfileByUsername = async (req, res) => {
//   try {
//     const { username } = req.params;

//     const user = await User.findOne({
//       username: username.toLowerCase(),
//     }).select(
//       "username bio profilePicture followers following postsCount fullName createdAt",
//     );

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // ── Check if the logged-in user has blocked this profile ──
//     let isBlocked = false;
//     if (req.user?.id) {
//       const authUser = await User.findById(req.user.id).select("blockedUsers");
//       isBlocked =
//         authUser?.blockedUsers?.some(
//           (id) => id.toString() === user._id.toString(),
//         ) ?? false;
//     }

//     res.status(200).json({
//       _id: user._id,
//       username: user.username,
//       fullName: user.fullName,
//       postsCount: user.postsCount,
//       bio: user.bio,
//       profilePicture: user.profilePicture,
//       followers: user.followers,
//       following: user.following,
//       followersCount: user.followers.length,
//       followingCount: user.following.length,
//       joinedAt: user.createdAt,
//       isBlocked, // ← new field
//     });
//   } catch (err) {
//     console.error("getPublicProfileByUsername error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };
// /**
//  * BLOCK USER
//  */
// exports.blockUser = async (req, res) => {
//   try {
//     const currentUserId = req.user.id;
//     const targetUserId = req.params.userId;

//     const currentUser = await User.findById(currentUserId);
//     const targetUser = await User.findById(targetUserId);

//     if (!targetUser) return res.status(404).json({ message: "User not found" });

//     if (currentUser.blockedUsers.includes(targetUserId)) {
//       return res.status(400).json({ message: "User already blocked" });
//     }

//     currentUser.blockedUsers.push(targetUserId);

//     // Remove follow relationships both ways
//     currentUser.following = currentUser.following.filter(
//       (id) => id.toString() !== targetUserId,
//     );
//     currentUser.followers = currentUser.followers.filter(
//       (id) => id.toString() !== targetUserId,
//     );
//     targetUser.following = targetUser.following.filter(
//       (id) => id.toString() !== currentUserId,
//     );
//     targetUser.followers = targetUser.followers.filter(
//       (id) => id.toString() !== currentUserId,
//     );

//     await currentUser.save();
//     await targetUser.save();

//     res.status(200).json({ message: "User blocked successfully" });
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// };

// exports.unblockUser = async (req, res) => {
//   try {
//     const currentUserId = req.user.id;
//     const targetUserId = req.params.userId;

//     const currentUser = await User.findById(currentUserId);

//     if (!currentUser.blockedUsers.map(String).includes(String(targetUserId))) {
//       return res.status(400).json({ message: "User is not blocked" });
//     }

//     currentUser.blockedUsers = currentUser.blockedUsers.filter(
//       (id) => id.toString() !== targetUserId
//     );

//     await currentUser.save();

//     res.status(200).json({ message: "User unblocked successfully" });
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// };

// /**
//  * REPORT USER
//  */
// exports.reportUser = async (req, res) => {
//   try {
//     const currentUser = await User.findById(req.user.id);
//     const targetUserId = req.params.userId;

//     if (currentUser.reportedUsers.includes(targetUserId)) {
//       return res.status(400).json({ message: "User already reported" });
//     }

//     currentUser.reportedUsers.push(targetUserId);
//     await currentUser.save();

//     res.status(200).json({ message: "User reported successfully" });
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// };

// /**
//  * CHECK IF LOGGED-IN USER IS FOLLOWING TARGET USER
//  * GET /api/users/:userId/is-following
//  */
// exports.isFollowing = async (req, res) => {
//   try {
//     const currentUserId = req.user.id; // from auth middleware
//     const targetUserId = req.params.userId;

//     // Prevent self-check (optional safety)
//     if (currentUserId === targetUserId) {
//       return res.status(200).json({ isFollowing: false });
//     }

//     const currentUser = await User.findById(currentUserId).select("following");

//     if (!currentUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const isFollowing = currentUser.following.some(
//       (id) => id.toString() === targetUserId
//     );

//     return res.status(200).json({ isFollowing });
//   } catch (err) {
//     console.error("IS FOLLOWING ERROR:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

// // exports.getUsersByIds = async (req, res) => {
// //   try {
// //     const { ids } = req.body;

// //     // 🛑 Validation
// //     if (!Array.isArray(ids) || ids.length === 0) {
// //       return res.status(400).json({
// //         message: "ids must be a non-empty array",
// //       });
// //     }

// //     // ✅ Fetch users
// //     const users = await User.find({
// //       _id: { $in: ids },
// //     })
// //       .select("_id username profilePicture")
// //       .lean();

// //     return res.status(200).json(users);
// //   } catch (error) {
// //     console.error("getUsersByIds error:", error);
// //     return res.status(500).json({
// //       message: "Failed to fetch users",
// //     });
// //   }
// // };

// exports.getUsersByIds = async (req, res) => {
//   try {
//     const { ids } = req.body;
//     const myId = req.user.id;

//     if (!Array.isArray(ids) || ids.length === 0) {
//       return res.status(400).json({ message: "ids must be a non-empty array" });
//     }

//     // ── fetch current user's blocked list alongside the target users ──
//     const [users, me] = await Promise.all([
//       User.find({ _id: { $in: ids } })
//         .select("_id username profilePicture followers")
//         .lean(),
//       User.findById(myId).select("blockedUsers").lean(),
//     ]);

//     const blockedSet = new Set(
//       (me?.blockedUsers || []).map((id) => id.toString()),
//     );

//     const usersWithFollowStatus = users.map((user) => ({
//       _id: user._id,
//       username: user.username,
//       profilePicture: user.profilePicture,
//       fullName: user.fullName,
//       isFollowing: user.followers.some(
//         (followerId) => followerId.toString() === myId.toString(),
//       ),
//       isBlocked: blockedSet.has(user._id.toString()), // ← new field
//     }));

//     return res.status(200).json(usersWithFollowStatus);
//   } catch (error) {
//     console.error("getUsersByIds error:", error);
//     return res.status(500).json({ message: "Failed to fetch users" });
//   }
// };

// const User = require("../models/User");
// const FollowRequest = require("../models/FollowRequest");
// const Notification = require("../models/Notification");

// // ─────────────────────────────────────────────────────────────
// // FOLLOW USER → always creates a request (no instant follow)
// // POST /api/users/:userId/follow
// // ─────────────────────────────────────────────────────────────
// exports.followUser = async (req, res) => {
//   try {
//     const currentUserId = req.user.id;
//     const targetUserId = req.params.userId;

//     if (currentUserId === targetUserId) {
//       return res.status(400).json({ message: "You cannot follow yourself" });
//     }

//     const [currentUser, targetUser] = await Promise.all([
//       User.findById(currentUserId),
//       User.findById(targetUserId),
//     ]);

//     if (!targetUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Block checks
//     if (
//       targetUser.blockedUsers.includes(currentUserId) ||
//       currentUser.blockedUsers.includes(targetUserId)
//     ) {
//       return res.status(403).json({ message: "Action not allowed" });
//     }

//     // Already following?
//     if (currentUser.following.includes(targetUserId)) {
//       return res.status(400).json({ message: "Already following this user" });
//     }

//     // Already sent a request?
//     const existingRequest = await FollowRequest.findOne({
//       from: currentUserId,
//       to: targetUserId,
//       status: "pending",
//     });

//     if (existingRequest) {
//       return res.status(400).json({ message: "Follow request already sent" });
//     }

//     // Create the follow request
//     const followRequest = await FollowRequest.create({
//       from: currentUserId,
//       to: targetUserId,
//       status: "pending",
//     });

//     // Create notification for the target user
//     await Notification.create({
//       recipient: targetUserId,
//       sender: currentUserId,
//       type: "follow_request",
//       status: "pending",
//       followRequest: followRequest._id,
//     });

//     res.status(200).json({ followStatus: "requested" });
//   } catch (err) {
//     console.error("followUser error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // CANCEL FOLLOW REQUEST (sender cancels their own pending request)
// // DELETE /api/users/:userId/follow-request
// // ─────────────────────────────────────────────────────────────
// exports.cancelFollowRequest = async (req, res) => {
//   try {
//     const currentUserId = req.user.id;
//     const targetUserId = req.params.userId;

//     const followRequest = await FollowRequest.findOneAndDelete({
//       from: currentUserId,
//       to: targetUserId,
//       status: "pending",
//     });

//     if (!followRequest) {
//       return res.status(404).json({ message: "No pending request found" });
//     }

//     // Remove the notification from the target user's feed
//     await Notification.findOneAndDelete({
//       sender: currentUserId,
//       recipient: targetUserId,
//       type: "follow_request",
//       followRequest: followRequest._id,
//     });

//     res.status(200).json({ followStatus: "not_following" });
//   } catch (err) {
//     console.error("cancelFollowRequest error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // ACCEPT FOLLOW REQUEST
// // PATCH /api/follow-requests/:requestId/accept
// // ─────────────────────────────────────────────────────────────
// exports.acceptFollowRequest = async (req, res) => {
//   try {
//     const currentUserId = req.user.id;
//     const { requestId } = req.params;

//     const followRequest = await FollowRequest.findById(requestId);

//     if (!followRequest) {
//       return res.status(404).json({ message: "Follow request not found" });
//     }

//     // Only the recipient can accept
//     if (followRequest.to.toString() !== currentUserId) {
//       return res.status(403).json({ message: "Not authorized" });
//     }

//     if (followRequest.status !== "pending") {
//       return res.status(400).json({ message: "Request is no longer pending" });
//     }

//     const senderId = followRequest.from.toString();

//     // Update request status
//     followRequest.status = "accepted";
//     await followRequest.save();

//     // Add to followers / following arrays
//     await Promise.all([
//       User.findByIdAndUpdate(currentUserId, {
//         $addToSet: { followers: senderId },
//       }),
//       User.findByIdAndUpdate(senderId, {
//         $addToSet: { following: currentUserId },
//       }),
//     ]);

//     // Update the original follow_request notification → mark actioned
//     await Notification.findOneAndUpdate(
//       {
//         sender: senderId,
//         recipient: currentUserId,
//         type: "follow_request",
//         followRequest: followRequest._id,
//       },
//       { status: "accepted", read: true },
//     );

//     // Notify the sender that their request was accepted
//     await Notification.create({
//       recipient: senderId,
//       sender: currentUserId,
//       type: "follow_accepted",
//       followRequest: followRequest._id,
//     });

//     res.status(200).json({ message: "Follow request accepted" });
//   } catch (err) {
//     console.error("acceptFollowRequest error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // DECLINE FOLLOW REQUEST
// // PATCH /api/follow-requests/:requestId/decline
// // ─────────────────────────────────────────────────────────────
// exports.declineFollowRequest = async (req, res) => {
//   try {
//     const currentUserId = req.user.id;
//     const { requestId } = req.params;

//     const followRequest = await FollowRequest.findById(requestId);

//     if (!followRequest) {
//       return res.status(404).json({ message: "Follow request not found" });
//     }

//     // Only the recipient can decline
//     if (followRequest.to.toString() !== currentUserId) {
//       return res.status(403).json({ message: "Not authorized" });
//     }

//     if (followRequest.status !== "pending") {
//       return res.status(400).json({ message: "Request is no longer pending" });
//     }

//     const senderId = followRequest.from.toString();

//     // Delete the request entirely — declined requests don't need to be stored
//     await FollowRequest.findByIdAndDelete(requestId);

//     // Remove the notification from recipient's feed
//     await Notification.findOneAndDelete({
//       sender: senderId,
//       recipient: currentUserId,
//       type: "follow_request",
//       followRequest: followRequest._id,
//     });

//     // Sender is NOT notified — they just silently see "Follow" button again
//     res.status(200).json({ message: "Follow request declined" });
//   } catch (err) {
//     console.error("declineFollowRequest error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // UNFOLLOW USER
// // DELETE /api/users/:userId/unfollow
// // ─────────────────────────────────────────────────────────────
// exports.unfollowUser = async (req, res) => {
//   try {
//     const currentUserId = req.user.id;
//     const targetUserId = req.params.userId;

//     const [currentUser, targetUser] = await Promise.all([
//       User.findById(currentUserId),
//       User.findById(targetUserId),
//     ]);

//     if (!targetUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Remove from followers / following arrays
//     currentUser.following = currentUser.following.filter(
//       (id) => id.toString() !== targetUserId,
//     );
//     targetUser.followers = targetUser.followers.filter(
//       (id) => id.toString() !== currentUserId,
//     );

//     await Promise.all([currentUser.save(), targetUser.save()]);

//     // Also clean up any accepted FollowRequest doc
//     await FollowRequest.findOneAndDelete({
//       from: currentUserId,
//       to: targetUserId,
//       status: "accepted",
//     });

//     res.status(200).json({ followStatus: "not_following" });
//   } catch (err) {
//     console.error("unfollowUser error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // GET PROFILE BY USERNAME
// // GET /api/users/:username/profile
// // ─────────────────────────────────────────────────────────────
// exports.getProfileByUsername = async (req, res) => {
//   try {
//     const { username } = req.params;
//     const currentUserId = req.user?.id;

//     const user = await User.findOne({
//       username: username.toLowerCase(),
//     }).select(
//       "username bio profilePicture followers following postsCount fullName createdAt blockedUsers",
//     );

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const targetUserId = user._id.toString();
//     const isOwner = currentUserId === targetUserId;

//     // Block check
//     let isBlocked = false;
//     if (currentUserId && !isOwner) {
//       const authUser =
//         await User.findById(currentUserId).select("blockedUsers");
//       isBlocked =
//         authUser?.blockedUsers?.some((id) => id.toString() === targetUserId) ??
//         false;
//     }

//     // Compute followStatus
//     let followStatus = "not_following";

//     if (!isOwner && currentUserId) {
//       const isFollowing = user.followers.some(
//         (id) => id.toString() === currentUserId,
//       );

//       if (isFollowing) {
//         followStatus = "following";
//       } else {
//         // Check for a pending request
//         const pendingRequest = await FollowRequest.findOne({
//           from: currentUserId,
//           to: targetUserId,
//           status: "pending",
//         }).select("_id");

//         if (pendingRequest) followStatus = "requested";
//       }
//     }

//     const isFollowing = followStatus === "following";

//     res.status(200).json({
//       _id: user._id,
//       username: user.username,
//       fullName: user.fullName,
//       bio: isFollowing || isOwner ? user.bio : null,
//       profilePicture: user.profilePicture,
//       followersCount: user.followers.length,
//       followingCount: user.following.length,
//       postsCount: user.postsCount,
//       joinedAt: user.createdAt,
//       isOwner,
//       isBlocked,
//       followStatus, // "not_following" | "requested" | "following"
//     });
//   } catch (err) {
//     console.error("getProfileByUsername error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // GET PUBLIC PROFILE (by ID — kept for backward compat)
// // GET /api/users/:userId/profile-by-id
// // ─────────────────────────────────────────────────────────────
// exports.getPublicProfile = async (req, res) => {
//   try {
//     const user = await User.findById(req.params.userId).select(
//       "username bio profilePicture followers following createdAt",
//     );

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.status(200).json({
//       id: user._id,
//       username: user.username,
//       fullName: user.fullName,
//       bio: user.bio,
//       profilePicture: user.profilePicture,
//       followersCount: user.followers.length,
//       followingCount: user.following.length,
//       joinedAt: user.createdAt,
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // IS FOLLOWING (updated to return followStatus)
// // GET /api/users/:userId/follow-status
// // ─────────────────────────────────────────────────────────────
// exports.isFollowing = async (req, res) => {
//   try {
//     const currentUserId = req.user.id;
//     const targetUserId = req.params.userId;

//     if (currentUserId === targetUserId) {
//       return res.status(200).json({ followStatus: "owner" });
//     }

//     const currentUser = await User.findById(currentUserId).select("following");

//     if (!currentUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const isFollowing = currentUser.following.some(
//       (id) => id.toString() === targetUserId,
//     );

//     if (isFollowing) {
//       return res.status(200).json({ followStatus: "following" });
//     }

//     const pendingRequest = await FollowRequest.findOne({
//       from: currentUserId,
//       to: targetUserId,
//       status: "pending",
//     }).select("_id");

//     return res.status(200).json({
//       followStatus: pendingRequest ? "requested" : "not_following",
//     });
//   } catch (err) {
//     console.error("isFollowing error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // BLOCK USER (also cleans up any pending follow requests)
// // POST /api/users/:userId/block
// // ─────────────────────────────────────────────────────────────
// exports.blockUser = async (req, res) => {
//   try {
//     const currentUserId = req.user.id;
//     const targetUserId = req.params.userId;

//     const [currentUser, targetUser] = await Promise.all([
//       User.findById(currentUserId),
//       User.findById(targetUserId),
//     ]);

//     if (!targetUser) return res.status(404).json({ message: "User not found" });

//     if (currentUser.blockedUsers.includes(targetUserId)) {
//       return res.status(400).json({ message: "User already blocked" });
//     }

//     currentUser.blockedUsers.push(targetUserId);

//     // Remove follow relationships both ways
//     currentUser.following = currentUser.following.filter(
//       (id) => id.toString() !== targetUserId,
//     );
//     currentUser.followers = currentUser.followers.filter(
//       (id) => id.toString() !== targetUserId,
//     );
//     targetUser.following = targetUser.following.filter(
//       (id) => id.toString() !== currentUserId,
//     );
//     targetUser.followers = targetUser.followers.filter(
//       (id) => id.toString() !== currentUserId,
//     );

//     await Promise.all([
//       currentUser.save(),
//       targetUser.save(),
//       // Clean up any pending follow requests between both users in either direction
//       FollowRequest.deleteMany({
//         $or: [
//           { from: currentUserId, to: targetUserId },
//           { from: targetUserId, to: currentUserId },
//         ],
//       }),
//       // Clean up related notifications
//       Notification.deleteMany({
//         $or: [
//           {
//             sender: currentUserId,
//             recipient: targetUserId,
//             type: "follow_request",
//           },
//           {
//             sender: targetUserId,
//             recipient: currentUserId,
//             type: "follow_request",
//           },
//         ],
//       }),
//     ]);

//     res.status(200).json({ message: "User blocked successfully" });
//   } catch (err) {
//     console.error("blockUser error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // UNBLOCK USER (unchanged)
// // DELETE /api/users/:userId/block
// // ─────────────────────────────────────────────────────────────
// exports.unblockUser = async (req, res) => {
//   try {
//     const currentUserId = req.user.id;
//     const targetUserId = req.params.userId;

//     const currentUser = await User.findById(currentUserId);

//     if (!currentUser.blockedUsers.map(String).includes(String(targetUserId))) {
//       return res.status(400).json({ message: "User is not blocked" });
//     }

//     currentUser.blockedUsers = currentUser.blockedUsers.filter(
//       (id) => id.toString() !== targetUserId,
//     );

//     await currentUser.save();

//     res.status(200).json({ message: "User unblocked successfully" });
//   } catch (err) {
//     console.error("unblockUser error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // REPORT USER (unchanged)
// // POST /api/users/:userId/report
// // ─────────────────────────────────────────────────────────────
// exports.reportUser = async (req, res) => {
//   try {
//     const currentUser = await User.findById(req.user.id);
//     const targetUserId = req.params.userId;

//     if (currentUser.reportedUsers.includes(targetUserId)) {
//       return res.status(400).json({ message: "User already reported" });
//     }

//     currentUser.reportedUsers.push(targetUserId);
//     await currentUser.save();

//     res.status(200).json({ message: "User reported successfully" });
//   } catch (err) {
//     console.error("reportUser error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // GET USERS BY IDS (updated followStatus)
// // POST /api/users/by-ids
// // ─────────────────────────────────────────────────────────────
// exports.getUsersByIds = async (req, res) => {
//   try {
//     const { ids } = req.body;
//     const myId = req.user.id;

//     if (!Array.isArray(ids) || ids.length === 0) {
//       return res.status(400).json({ message: "ids must be a non-empty array" });
//     }

//     const [users, me, pendingRequests] = await Promise.all([
//       User.find({ _id: { $in: ids } })
//         .select("_id username profilePicture fullName followers")
//         .lean(),
//       User.findById(myId).select("blockedUsers").lean(),
//       // Fetch all pending requests I've sent to any of these users
//       FollowRequest.find({
//         from: myId,
//         to: { $in: ids },
//         status: "pending",
//       })
//         .select("to")
//         .lean(),
//     ]);

//     const blockedSet = new Set((me?.blockedUsers || []).map(String));
//     const requestedSet = new Set(pendingRequests.map((r) => r.to.toString()));

//     const result = users.map((user) => {
//       const userId = user._id.toString();
//       const isFollowing = user.followers.some((id) => id.toString() === myId);
//       const isRequested = requestedSet.has(userId);

//       return {
//         _id: user._id,
//         username: user.username,
//         profilePicture: user.profilePicture,
//         fullName: user.fullName,
//         followStatus: isFollowing
//           ? "following"
//           : isRequested
//             ? "requested"
//             : "not_following",
//         isBlocked: blockedSet.has(userId),
//       };
//     });

//     return res.status(200).json(result);
//   } catch (error) {
//     console.error("getUsersByIds error:", error);
//     return res.status(500).json({ message: "Failed to fetch users" });
//   }
// };

// const User = require("../models/User");
// const Follow = require("../models/Follow");
// const FollowRequest = require("../models/FollowRequest");
// const Notification = require("../models/Notification");

// // ─────────────────────────────────────────────────────────────
// // FOLLOW USER → always creates a request (no instant follow)
// // POST /api/users/:userId/follow
// // ─────────────────────────────────────────────────────────────
// exports.followUser = async (req, res) => {
//   try {
//     const currentUserId = req.user.id;
//     const targetUserId = req.params.userId;

//     if (currentUserId === targetUserId) {
//       return res.status(400).json({ message: "You cannot follow yourself" });
//     }

//     const [currentUser, targetUser] = await Promise.all([
//       User.findById(currentUserId),
//       User.findById(targetUserId),
//     ]);

//     if (!targetUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Block checks
//     if (
//       targetUser.blockedUsers.includes(currentUserId) ||
//       currentUser.blockedUsers.includes(targetUserId)
//     ) {
//       return res.status(403).json({ message: "Action not allowed" });
//     }

//     // Already following?
//     const alreadyFollowing = await Follow.exists({
//       follower: currentUserId,
//       following: targetUserId,
//     });
//     if (alreadyFollowing) {
//       return res.status(400).json({ message: "Already following this user" });
//     }

//     // Already sent a pending request?
//     const existingRequest = await FollowRequest.findOne({
//       from: currentUserId,
//       to: targetUserId,
//       status: "pending",
//     });
//     if (existingRequest) {
//       return res.status(400).json({ message: "Follow request already sent" });
//     }

//     // Create the follow request
//     const followRequest = await FollowRequest.create({
//       from: currentUserId,
//       to: targetUserId,
//       status: "pending",
//     });

//     // Notify the target user
//     await Notification.create({
//       recipient: targetUserId,
//       sender: currentUserId,
//       type: "follow_request",
//       status: "pending",
//       followRequest: followRequest._id,
//     });

//     res.status(200).json({ followStatus: "requested" });
//   } catch (err) {
//     console.error("followUser error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // CANCEL FOLLOW REQUEST (sender cancels their own pending request)
// // DELETE /api/users/:userId/follow-request
// // ─────────────────────────────────────────────────────────────
// exports.cancelFollowRequest = async (req, res) => {
//   try {
//     const currentUserId = req.user.id;
//     const targetUserId = req.params.userId;

//     const followRequest = await FollowRequest.findOneAndDelete({
//       from: currentUserId,
//       to: targetUserId,
//       status: "pending",
//     });

//     if (!followRequest) {
//       return res.status(404).json({ message: "No pending request found" });
//     }

//     // Remove the notification from the target user's feed
//     await Notification.findOneAndDelete({
//       sender: currentUserId,
//       recipient: targetUserId,
//       type: "follow_request",
//       followRequest: followRequest._id,
//     });

//     res.status(200).json({ followStatus: "not_following" });
//   } catch (err) {
//     console.error("cancelFollowRequest error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // ACCEPT FOLLOW REQUEST
// // PATCH /api/follow-requests/:requestId/accept
// //
// // Single source of truth — notifications.js /:id/accept delegates
// // here, OR you call this directly from a dedicated route.
// // Either way, the logic lives in one place only.
// // ─────────────────────────────────────────────────────────────
// exports.acceptFollowRequest = async (req, res) => {
//   try {
//     const currentUserId = req.user.id;
//     const { requestId } = req.params;

//     // Atomically mark as accepted only if still pending
//     const followRequest = await FollowRequest.findOneAndUpdate(
//       { _id: requestId, to: currentUserId, status: "pending" },
//       { status: "accepted" },
//       { new: true },
//     );

//     if (!followRequest) {
//       return res
//         .status(404)
//         .json({ message: "Follow request not found or already processed" });
//     }

//     const senderId = followRequest.from.toString();

//     // Create follow relationship — upsert is safe against double-calls
//     await Follow.findOneAndUpdate(
//       { follower: senderId, following: currentUserId },
//       { follower: senderId, following: currentUserId },
//       { upsert: true, new: true },
//     );

//     // Mark the original follow_request notification as accepted + read
//     await Notification.findOneAndUpdate(
//       {
//         sender: senderId,
//         recipient: currentUserId,
//         type: "follow_request",
//         followRequest: followRequest._id,
//       },
//       { status: "accepted", read: true },
//     );

//     // Notify the sender that their request was accepted
//     await Notification.create({
//       recipient: senderId,
//       sender: currentUserId,
//       type: "follow_accepted",
//       followRequest: followRequest._id,
//     });

//     res.status(200).json({ message: "Follow request accepted" });
//   } catch (err) {
//     console.error("acceptFollowRequest error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // DECLINE FOLLOW REQUEST
// // PATCH /api/follow-requests/:requestId/decline
// // ─────────────────────────────────────────────────────────────
// exports.declineFollowRequest = async (req, res) => {
//   try {
//     const currentUserId = req.user.id;
//     const { requestId } = req.params;

//     // Only delete if it belongs to this user and is still pending
//     const followRequest = await FollowRequest.findOneAndDelete({
//       _id: requestId,
//       to: currentUserId,
//       status: "pending",
//     });

//     if (!followRequest) {
//       return res
//         .status(404)
//         .json({ message: "Follow request not found or already processed" });
//     }

//     // Remove the notification from the recipient's feed
//     await Notification.findOneAndDelete({
//       sender: followRequest.from,
//       recipient: currentUserId,
//       type: "follow_request",
//       followRequest: followRequest._id,
//     });

//     // Sender is NOT notified — they just silently see "Follow" button again
//     res.status(200).json({ message: "Follow request declined" });
//   } catch (err) {
//     console.error("declineFollowRequest error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // UNFOLLOW USER
// // DELETE /api/users/:userId/unfollow
// // ─────────────────────────────────────────────────────────────
// exports.unfollowUser = async (req, res) => {
//   try {
//     const currentUserId = req.user.id;
//     const targetUserId = req.params.userId;

//     const targetUser = await User.findById(targetUserId);
//     if (!targetUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Remove from Follow collection
//     const deleted = await Follow.findOneAndDelete({
//       follower: currentUserId,
//       following: targetUserId,
//     });

//     if (!deleted) {
//       return res
//         .status(400)
//         .json({ message: "You are not following this user" });
//     }

//     // Clean up the accepted FollowRequest doc if it exists
//     await FollowRequest.findOneAndDelete({
//       from: currentUserId,
//       to: targetUserId,
//       status: "accepted",
//     });

//     res.status(200).json({ followStatus: "not_following" });
//   } catch (err) {
//     console.error("unfollowUser error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // GET PROFILE BY USERNAME
// // GET /api/users/:username/profile
// // ─────────────────────────────────────────────────────────────
// exports.getProfileByUsername = async (req, res) => {
//   try {
//     const { username } = req.params;
//     const currentUserId = req.user?.id;

//     const user = await User.findOne({
//       username: username.toLowerCase(),
//     }).select(
//       "username bio profilePicture postsCount fullName createdAt blockedUsers",
//     );

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const targetUserId = user._id.toString();
//     const isOwner = currentUserId === targetUserId;

//     // Block check
//     let isBlocked = false;
//     if (currentUserId && !isOwner) {
//       const authUser =
//         await User.findById(currentUserId).select("blockedUsers");
//       isBlocked =
//         authUser?.blockedUsers?.some((id) => id.toString() === targetUserId) ??
//         false;
//     }

//     // Follower / following counts from Follow collection
//     const [followersCount, followingCount] = await Promise.all([
//       Follow.countDocuments({ following: targetUserId }),
//       Follow.countDocuments({ follower: targetUserId }),
//     ]);

//     // Compute followStatus
//     let followStatus = "not_following";
//     if (!isOwner && currentUserId) {
//       const isFollowing = await Follow.exists({
//         follower: currentUserId,
//         following: targetUserId,
//       });
//       if (isFollowing) {
//         followStatus = "following";
//       } else {
//         const pending = await FollowRequest.exists({
//           from: currentUserId,
//           to: targetUserId,
//           status: "pending",
//         });
//         if (pending) followStatus = "requested";
//       }
//     }

//     res.status(200).json({
//       _id: user._id,
//       username: user.username,
//       fullName: user.fullName,
//       bio: followStatus === "following" || isOwner ? user.bio : null,
//       profilePicture: user.profilePicture,
//       followersCount,
//       followingCount,
//       postsCount: user.postsCount,
//       joinedAt: user.createdAt,
//       isOwner,
//       isBlocked,
//       followStatus, // "not_following" | "requested" | "following"
//     });
//   } catch (err) {
//     console.error("getProfileByUsername error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // GET PUBLIC PROFILE (by ID — kept for backward compat)
// // GET /api/users/:userId/profile-by-id
// // ─────────────────────────────────────────────────────────────
// exports.getPublicProfile = async (req, res) => {
//   try {
//     const user = await User.findById(req.params.userId).select(
//       "username bio profilePicture postsCount fullName createdAt",
//     );

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const [followersCount, followingCount] = await Promise.all([
//       Follow.countDocuments({ following: user._id }),
//       Follow.countDocuments({ follower: user._id }),
//     ]);

//     res.status(200).json({
//       id: user._id,
//       username: user.username,
//       fullName: user.fullName,
//       bio: user.bio,
//       profilePicture: user.profilePicture,
//       followersCount,
//       followingCount,
//       joinedAt: user.createdAt,
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // FOLLOW STATUS
// // GET /api/users/:userId/follow-status
// // ─────────────────────────────────────────────────────────────
// exports.isFollowing = async (req, res) => {
//   try {
//     const currentUserId = req.user.id;
//     const targetUserId = req.params.userId;

//     if (currentUserId === targetUserId) {
//       return res.status(200).json({ followStatus: "owner" });
//     }

//     const isFollowing = await Follow.exists({
//       follower: currentUserId,
//       following: targetUserId,
//     });
//     if (isFollowing) {
//       return res.status(200).json({ followStatus: "following" });
//     }

//     const pending = await FollowRequest.exists({
//       from: currentUserId,
//       to: targetUserId,
//       status: "pending",
//     });
//     return res
//       .status(200)
//       .json({ followStatus: pending ? "requested" : "not_following" });
//   } catch (err) {
//     console.error("isFollowing error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // BLOCK USER
// // POST /api/users/:userId/block
// // ─────────────────────────────────────────────────────────────
// exports.blockUser = async (req, res) => {
//   try {
//     const currentUserId = req.user.id;
//     const targetUserId = req.params.userId;

//     const [currentUser, targetUser] = await Promise.all([
//       User.findById(currentUserId),
//       User.findById(targetUserId),
//     ]);

//     if (!targetUser) return res.status(404).json({ message: "User not found" });

//     if (currentUser.blockedUsers.includes(targetUserId)) {
//       return res.status(400).json({ message: "User already blocked" });
//     }

//     currentUser.blockedUsers.push(targetUserId);

//     await Promise.all([
//       currentUser.save(),
//       // Remove follow relationships both ways from Follow collection
//       Follow.deleteMany({
//         $or: [
//           { follower: currentUserId, following: targetUserId },
//           { follower: targetUserId, following: currentUserId },
//         ],
//       }),
//       // Clean up any pending follow requests in either direction
//       FollowRequest.deleteMany({
//         $or: [
//           { from: currentUserId, to: targetUserId },
//           { from: targetUserId, to: currentUserId },
//         ],
//       }),
//       // Clean up related follow_request notifications in either direction
//       Notification.deleteMany({
//         $or: [
//           {
//             sender: currentUserId,
//             recipient: targetUserId,
//             type: "follow_request",
//           },
//           {
//             sender: targetUserId,
//             recipient: currentUserId,
//             type: "follow_request",
//           },
//         ],
//       }),
//     ]);

//     res.status(200).json({ message: "User blocked successfully" });
//   } catch (err) {
//     console.error("blockUser error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // UNBLOCK USER
// // DELETE /api/users/:userId/block
// // ─────────────────────────────────────────────────────────────
// exports.unblockUser = async (req, res) => {
//   try {
//     const currentUserId = req.user.id;
//     const targetUserId = req.params.userId;

//     const currentUser = await User.findById(currentUserId);

//     if (!currentUser.blockedUsers.map(String).includes(String(targetUserId))) {
//       return res.status(400).json({ message: "User is not blocked" });
//     }

//     currentUser.blockedUsers = currentUser.blockedUsers.filter(
//       (id) => id.toString() !== targetUserId,
//     );

//     await currentUser.save();
//     res.status(200).json({ message: "User unblocked successfully" });
//   } catch (err) {
//     console.error("unblockUser error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // REPORT USER
// // POST /api/users/:userId/report
// // ─────────────────────────────────────────────────────────────
// exports.reportUser = async (req, res) => {
//   try {
//     const currentUser = await User.findById(req.user.id);
//     const targetUserId = req.params.userId;

//     if (currentUser.reportedUsers.includes(targetUserId)) {
//       return res.status(400).json({ message: "User already reported" });
//     }

//     currentUser.reportedUsers.push(targetUserId);
//     await currentUser.save();

//     res.status(200).json({ message: "User reported successfully" });
//   } catch (err) {
//     console.error("reportUser error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // GET USERS BY IDS
// // POST /api/users/by-ids
// // ─────────────────────────────────────────────────────────────
// exports.getUsersByIds = async (req, res) => {
//   try {
//     const { ids } = req.body;
//     const myId = req.user.id;

//     if (!Array.isArray(ids) || ids.length === 0) {
//       return res.status(400).json({ message: "ids must be a non-empty array" });
//     }

//     const [users, me, followedIds, pendingRequests] = await Promise.all([
//       User.find({ _id: { $in: ids } })
//         .select("_id username profilePicture fullName")
//         .lean(),
//       User.findById(myId).select("blockedUsers").lean(),
//       // Which of these users do I already follow?
//       Follow.find({ follower: myId, following: { $in: ids } })
//         .select("following")
//         .lean(),
//       // Which of these users have I sent a pending request to?
//       FollowRequest.find({ from: myId, to: { $in: ids }, status: "pending" })
//         .select("to")
//         .lean(),
//     ]);

//     const blockedSet = new Set((me?.blockedUsers || []).map(String));
//     const followingSet = new Set(
//       followedIds.map((f) => f.following.toString()),
//     );
//     const requestedSet = new Set(pendingRequests.map((r) => r.to.toString()));

//     const result = users.map((user) => {
//       const userId = user._id.toString();
//       return {
//         _id: user._id,
//         username: user.username,
//         profilePicture: user.profilePicture,
//         fullName: user.fullName,
//         followStatus: followingSet.has(userId)
//           ? "following"
//           : requestedSet.has(userId)
//             ? "requested"
//             : "not_following",
//         isBlocked: blockedSet.has(userId),
//       };
//     });

//     return res.status(200).json(result);
//   } catch (err) {
//     console.error("getUsersByIds error:", err);
//     return res.status(500).json({ message: "Failed to fetch users" });
//   }
// };

// const User = require("../models/User");
// const Follow = require("../models/Follow");
// const FollowRequest = require("../models/FollowRequest");
// const Notification = require("../models/Notification");

// // ─────────────────────────────────────────────────────────────
// // FOLLOW USER → always creates a request (no instant follow)
// // POST /api/users/:userId/follow
// // ─────────────────────────────────────────────────────────────
// exports.followUser = async (req, res) => {
//   try {
//     const currentUserId = req.user.id;
//     const targetUserId = req.params.userId;

//     if (currentUserId === targetUserId) {
//       return res.status(400).json({ message: "You cannot follow yourself" });
//     }

//     const [currentUser, targetUser] = await Promise.all([
//       User.findById(currentUserId),
//       User.findById(targetUserId),
//     ]);

//     if (!targetUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Block checks
//     if (
//       targetUser.blockedUsers.includes(currentUserId) ||
//       currentUser.blockedUsers.includes(targetUserId)
//     ) {
//       return res.status(403).json({ message: "Action not allowed" });
//     }

//     // Already following?
//     const alreadyFollowing = await Follow.exists({
//       follower: currentUserId,
//       following: targetUserId,
//     });
//     if (alreadyFollowing) {
//       return res.status(400).json({ message: "Already following this user" });
//     }

//     // Already sent a pending request?
//     const existingRequest = await FollowRequest.findOne({
//       from: currentUserId,
//       to: targetUserId,
//       status: "pending",
//     });
//     if (existingRequest) {
//       return res.status(400).json({ message: "Follow request already sent" });
//     }

//     // Create the follow request
//     const followRequest = await FollowRequest.create({
//       from: currentUserId,
//       to: targetUserId,
//       status: "pending",
//     });

//     // Notify the target user
//     await Notification.create({
//       recipient: targetUserId,
//       sender: currentUserId,
//       type: "follow_request",
//       status: "pending",
//       followRequest: followRequest._id,
//     });

//     res.status(200).json({ followStatus: "requested" });
//   } catch (err) {
//     console.error("followUser error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // CANCEL FOLLOW REQUEST (sender cancels their own pending request)
// // DELETE /api/users/:userId/follow-request
// // ─────────────────────────────────────────────────────────────
// exports.cancelFollowRequest = async (req, res) => {
//   try {
//     const currentUserId = req.user.id;
//     const targetUserId = req.params.userId;

//     const followRequest = await FollowRequest.findOneAndDelete({
//       from: currentUserId,
//       to: targetUserId,
//       status: "pending",
//     });

//     if (!followRequest) {
//       return res.status(404).json({ message: "No pending request found" });
//     }

//     // Remove the notification from the target user's feed
//     await Notification.findOneAndDelete({
//       sender: currentUserId,
//       recipient: targetUserId,
//       type: "follow_request",
//       followRequest: followRequest._id,
//     });

//     res.status(200).json({ followStatus: "not_following" });
//   } catch (err) {
//     console.error("cancelFollowRequest error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // ACCEPT FOLLOW REQUEST
// // PATCH /api/follow-requests/:requestId/accept
// //
// // Single source of truth — notifications.js /:id/accept delegates
// // here, OR you call this directly from a dedicated route.
// // Either way, the logic lives in one place only.
// // ─────────────────────────────────────────────────────────────
// exports.acceptFollowRequest = async (req, res) => {
//   try {
//     const currentUserId = req.user.id;
//     const { requestId } = req.params;

//     // Atomically mark as accepted only if still pending
//     const followRequest = await FollowRequest.findOneAndUpdate(
//       { _id: requestId, to: currentUserId, status: "pending" },
//       { status: "accepted" },
//       { new: true },
//     );

//     if (!followRequest) {
//       return res
//         .status(404)
//         .json({ message: "Follow request not found or already processed" });
//     }

//     const senderId = followRequest.from.toString();

//     // Create follow relationship — upsert is safe against double-calls
//     await Follow.findOneAndUpdate(
//       { follower: senderId, following: currentUserId },
//       { follower: senderId, following: currentUserId },
//       { upsert: true, new: true },
//     );

//     // Mark the original follow_request notification as accepted + read
//     await Notification.findOneAndUpdate(
//       {
//         sender: senderId,
//         recipient: currentUserId,
//         type: "follow_request",
//         followRequest: followRequest._id,
//       },
//       { status: "accepted", read: true },
//     );

//     // Notify the sender that their request was accepted
//     await Notification.create({
//       recipient: senderId,
//       sender: currentUserId,
//       type: "follow_accepted",
//       followRequest: followRequest._id,
//     });

//     res.status(200).json({ message: "Follow request accepted" });
//   } catch (err) {
//     console.error("acceptFollowRequest error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // DECLINE FOLLOW REQUEST
// // PATCH /api/follow-requests/:requestId/decline
// // ─────────────────────────────────────────────────────────────
// exports.declineFollowRequest = async (req, res) => {
//   try {
//     const currentUserId = req.user.id;
//     const { requestId } = req.params;

//     // Only delete if it belongs to this user and is still pending
//     const followRequest = await FollowRequest.findOneAndDelete({
//       _id: requestId,
//       to: currentUserId,
//       status: "pending",
//     });

//     if (!followRequest) {
//       return res
//         .status(404)
//         .json({ message: "Follow request not found or already processed" });
//     }

//     // Remove the notification from the recipient's feed
//     await Notification.findOneAndDelete({
//       sender: followRequest.from,
//       recipient: currentUserId,
//       type: "follow_request",
//       followRequest: followRequest._id,
//     });

//     // Sender is NOT notified — they just silently see "Follow" button again
//     res.status(200).json({ message: "Follow request declined" });
//   } catch (err) {
//     console.error("declineFollowRequest error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // UNFOLLOW USER
// // DELETE /api/users/:userId/unfollow
// // ─────────────────────────────────────────────────────────────
// exports.unfollowUser = async (req, res) => {
//   try {
//     const currentUserId = req.user.id;
//     const targetUserId = req.params.userId;

//     const targetUser = await User.findById(targetUserId);
//     if (!targetUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Remove from Follow collection
//     const deleted = await Follow.findOneAndDelete({
//       follower: currentUserId,
//       following: targetUserId,
//     });

//     if (!deleted) {
//       return res
//         .status(400)
//         .json({ message: "You are not following this user" });
//     }

//     // Clean up the accepted FollowRequest doc if it exists
//     await FollowRequest.findOneAndDelete({
//       from: currentUserId,
//       to: targetUserId,
//       status: "accepted",
//     });

//     res.status(200).json({ followStatus: "not_following" });
//   } catch (err) {
//     console.error("unfollowUser error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // GET PROFILE BY USERNAME
// // GET /api/users/:username/profile
// // ─────────────────────────────────────────────────────────────
// exports.getProfileByUsername = async (req, res) => {
//   try {
//     const { username } = req.params;
//     const currentUserId = req.user?.id;

//     const user = await User.findOne({
//       username: username.toLowerCase(),
//     }).select(
//       "username bio profilePicture postsCount fullName createdAt blockedUsers",
//     );

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const targetUserId = user._id.toString();
//     const isOwner = currentUserId === targetUserId;

//     // Block check
//     let isBlocked = false;
//     if (currentUserId && !isOwner) {
//       const authUser =
//         await User.findById(currentUserId).select("blockedUsers");
//       isBlocked =
//         authUser?.blockedUsers?.some((id) => id.toString() === targetUserId) ??
//         false;
//     }

//     // Follower / following counts from Follow collection
//     const [followersCount, followingCount] = await Promise.all([
//       Follow.countDocuments({ following: targetUserId }),
//       Follow.countDocuments({ follower: targetUserId }),
//     ]);

//     // Compute followStatus
//     let followStatus = "not_following";
//     if (!isOwner && currentUserId) {
//       const isFollowing = await Follow.exists({
//         follower: currentUserId,
//         following: targetUserId,
//       });
//       if (isFollowing) {
//         followStatus = "following";
//       } else {
//         const pending = await FollowRequest.exists({
//           from: currentUserId,
//           to: targetUserId,
//           status: "pending",
//         });
//         if (pending) followStatus = "requested";
//       }
//     }

//     res.status(200).json({
//       _id: user._id,
//       username: user.username,
//       fullName: user.fullName,
//       bio: followStatus === "following" || isOwner ? user.bio : null,
//       profilePicture: user.profilePicture,
//       followersCount,
//       followingCount,
//       postsCount: user.postsCount,
//       joinedAt: user.createdAt,
//       isOwner,
//       isBlocked,
//       followStatus, // "not_following" | "requested" | "following"
//     });
//   } catch (err) {
//     console.error("getProfileByUsername error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // GET PUBLIC PROFILE (by ID — kept for backward compat)
// // GET /api/users/:userId/profile-by-id
// // ─────────────────────────────────────────────────────────────
// exports.getPublicProfile = async (req, res) => {
//   try {
//     const user = await User.findById(req.params.userId).select(
//       "username bio profilePicture postsCount fullName createdAt",
//     );

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const [followersCount, followingCount] = await Promise.all([
//       Follow.countDocuments({ following: user._id }),
//       Follow.countDocuments({ follower: user._id }),
//     ]);

//     res.status(200).json({
//       id: user._id,
//       username: user.username,
//       fullName: user.fullName,
//       bio: user.bio,
//       profilePicture: user.profilePicture,
//       followersCount,
//       followingCount,
//       joinedAt: user.createdAt,
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // FOLLOW STATUS
// // GET /api/users/:userId/follow-status
// // ─────────────────────────────────────────────────────────────
// exports.isFollowing = async (req, res) => {
//   try {
//     const currentUserId = req.user.id;
//     const targetUserId = req.params.userId;

//     if (currentUserId === targetUserId) {
//       return res.status(200).json({ followStatus: "owner" });
//     }

//     const isFollowing = await Follow.exists({
//       follower: currentUserId,
//       following: targetUserId,
//     });
//     if (isFollowing) {
//       return res.status(200).json({ followStatus: "following" });
//     }

//     const pending = await FollowRequest.exists({
//       from: currentUserId,
//       to: targetUserId,
//       status: "pending",
//     });
//     return res
//       .status(200)
//       .json({ followStatus: pending ? "requested" : "not_following" });
//   } catch (err) {
//     console.error("isFollowing error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // BLOCK USER
// // POST /api/users/:userId/block
// // ─────────────────────────────────────────────────────────────
// exports.blockUser = async (req, res) => {
//   try {
//     const currentUserId = req.user.id;
//     const targetUserId = req.params.userId;

//     const [currentUser, targetUser] = await Promise.all([
//       User.findById(currentUserId),
//       User.findById(targetUserId),
//     ]);

//     if (!targetUser) return res.status(404).json({ message: "User not found" });

//     if (currentUser.blockedUsers.includes(targetUserId)) {
//       return res.status(400).json({ message: "User already blocked" });
//     }

//     currentUser.blockedUsers.push(targetUserId);

//     await Promise.all([
//       currentUser.save(),
//       // Remove follow relationships both ways from Follow collection
//       Follow.deleteMany({
//         $or: [
//           { follower: currentUserId, following: targetUserId },
//           { follower: targetUserId, following: currentUserId },
//         ],
//       }),
//       // Clean up any pending follow requests in either direction
//       FollowRequest.deleteMany({
//         $or: [
//           { from: currentUserId, to: targetUserId },
//           { from: targetUserId, to: currentUserId },
//         ],
//       }),
//       // Clean up related follow_request notifications in either direction
//       Notification.deleteMany({
//         $or: [
//           {
//             sender: currentUserId,
//             recipient: targetUserId,
//             type: "follow_request",
//           },
//           {
//             sender: targetUserId,
//             recipient: currentUserId,
//             type: "follow_request",
//           },
//         ],
//       }),
//     ]);

//     res.status(200).json({ message: "User blocked successfully" });
//   } catch (err) {
//     console.error("blockUser error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // UNBLOCK USER
// // DELETE /api/users/:userId/block
// // ─────────────────────────────────────────────────────────────
// exports.unblockUser = async (req, res) => {
//   try {
//     const currentUserId = req.user.id;
//     const targetUserId = req.params.userId;

//     const currentUser = await User.findById(currentUserId);

//     if (!currentUser.blockedUsers.map(String).includes(String(targetUserId))) {
//       return res.status(400).json({ message: "User is not blocked" });
//     }

//     currentUser.blockedUsers = currentUser.blockedUsers.filter(
//       (id) => id.toString() !== targetUserId,
//     );

//     await currentUser.save();
//     res.status(200).json({ message: "User unblocked successfully" });
//   } catch (err) {
//     console.error("unblockUser error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // REPORT USER
// // POST /api/users/:userId/report
// // ─────────────────────────────────────────────────────────────
// exports.reportUser = async (req, res) => {
//   try {
//     const currentUser = await User.findById(req.user.id);
//     const targetUserId = req.params.userId;

//     if (currentUser.reportedUsers.includes(targetUserId)) {
//       return res.status(400).json({ message: "User already reported" });
//     }

//     currentUser.reportedUsers.push(targetUserId);
//     await currentUser.save();

//     res.status(200).json({ message: "User reported successfully" });
//   } catch (err) {
//     console.error("reportUser error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // GET USERS BY IDS
// // POST /api/users/by-ids
// // ─────────────────────────────────────────────────────────────
// exports.getUsersByIds = async (req, res) => {
//   try {
//     const { ids } = req.body;
//     const myId = req.user.id;

//     if (!Array.isArray(ids) || ids.length === 0) {
//       return res.status(400).json({ message: "ids must be a non-empty array" });
//     }

//     const [users, me, followedIds, pendingRequests] = await Promise.all([
//       User.find({ _id: { $in: ids } })
//         .select("_id username profilePicture fullName")
//         .lean(),
//       User.findById(myId).select("blockedUsers").lean(),
//       // Which of these users do I already follow?
//       Follow.find({ follower: myId, following: { $in: ids } })
//         .select("following")
//         .lean(),
//       // Which of these users have I sent a pending request to?
//       FollowRequest.find({ from: myId, to: { $in: ids }, status: "pending" })
//         .select("to")
//         .lean(),
//     ]);

//     const blockedSet = new Set((me?.blockedUsers || []).map(String));
//     const followingSet = new Set(
//       followedIds.map((f) => f.following.toString()),
//     );
//     const requestedSet = new Set(pendingRequests.map((r) => r.to.toString()));

//     const result = users.map((user) => {
//       const userId = user._id.toString();
//       return {
//         _id: user._id,
//         username: user.username,
//         profilePicture: user.profilePicture,
//         fullName: user.fullName,
//         followStatus: followingSet.has(userId)
//           ? "following"
//           : requestedSet.has(userId)
//             ? "requested"
//             : "not_following",
//         isBlocked: blockedSet.has(userId),
//       };
//     });

//     return res.status(200).json(result);
//   } catch (err) {
//     console.error("getUsersByIds error:", err);
//     return res.status(500).json({ message: "Failed to fetch users" });
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // GET FOLLOWERS LIST
// // GET /api/users/:userId/followers
// // ─────────────────────────────────────────────────────────────
// exports.getFollowers = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     const follows = await Follow.find({ following: userId })
//       .populate("follower", "username profilePicture fullName")
//       .lean();

//     const followers = follows.map((f) => f.follower);
//     res.status(200).json(followers);
//   } catch (err) {
//     console.error("getFollowers error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────────────────────────────────────
// // GET FOLLOWING LIST
// // GET /api/users/:userId/following
// // ─────────────────────────────────────────────────────────────
// exports.getFollowing = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     const follows = await Follow.find({ follower: userId })
//       .populate("following", "username profilePicture fullName")
//       .lean();

//     const following = follows.map((f) => f.following);
//     res.status(200).json(following);
//   } catch (err) {
//     console.error("getFollowing error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

const User = require("../models/User");
const Follow = require("../models/Follow");
const FollowRequest = require("../models/FollowRequest");
const Notification = require("../models/Notification");

exports.followUser = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.userId;

    if (currentUserId === targetUserId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetUserId),
    ]);

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (
      targetUser.blockedUsers.includes(currentUserId) ||
      currentUser.blockedUsers.includes(targetUserId)
    ) {
      return res.status(403).json({ message: "Action not allowed" });
    }

    const alreadyFollowing = await Follow.exists({
      follower: currentUserId,
      following: targetUserId,
    });
    if (alreadyFollowing) {
      return res.status(400).json({ message: "Already following this user" });
    }

    const existingRequest = await FollowRequest.findOne({
      from: currentUserId,
      to: targetUserId,
      status: "pending",
    });
    if (existingRequest) {
      return res.status(400).json({ message: "Follow request already sent" });
    }

    const followRequest = await FollowRequest.create({
      from: currentUserId,
      to: targetUserId,
      status: "pending",
    });

    await Notification.create({
      recipient: targetUserId,
      sender: currentUserId,
      type: "follow_request",
      status: "pending",
      followRequest: followRequest._id,
    });

    res.status(200).json({ followStatus: "requested" });
  } catch (err) {
    console.error("followUser error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.cancelFollowRequest = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.userId;

    const followRequest = await FollowRequest.findOneAndDelete({
      from: currentUserId,
      to: targetUserId,
      status: "pending",
    });

    if (!followRequest) {
      return res.status(404).json({ message: "No pending request found" });
    }

    await Notification.findOneAndDelete({
      sender: currentUserId,
      recipient: targetUserId,
      type: "follow_request",
      followRequest: followRequest._id,
    });

    res.status(200).json({ followStatus: "not_following" });
  } catch (err) {
    console.error("cancelFollowRequest error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.acceptFollowRequest = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { requestId } = req.params;

    const followRequest = await FollowRequest.findOneAndUpdate(
      { _id: requestId, to: currentUserId, status: "pending" },
      { status: "accepted" },
      { new: true },
    );

    if (!followRequest) {
      return res
        .status(404)
        .json({ message: "Follow request not found or already processed" });
    }

    const senderId = followRequest.from.toString();

    await Follow.findOneAndUpdate(
      { follower: senderId, following: currentUserId },
      { follower: senderId, following: currentUserId },
      { upsert: true, new: true },
    );

    await Notification.findOneAndUpdate(
      {
        sender: senderId,
        recipient: currentUserId,
        type: "follow_request",
        followRequest: followRequest._id,
      },
      { status: "accepted", read: true },
    );

    await Notification.create({
      recipient: senderId,
      sender: currentUserId,
      type: "follow_accepted",
      followRequest: followRequest._id,
    });

    res.status(200).json({ message: "Follow request accepted" });
  } catch (err) {
    console.error("acceptFollowRequest error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.declineFollowRequest = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { requestId } = req.params;

    const followRequest = await FollowRequest.findOneAndDelete({
      _id: requestId,
      to: currentUserId,
      status: "pending",
    });

    if (!followRequest) {
      return res
        .status(404)
        .json({ message: "Follow request not found or already processed" });
    }

    await Notification.findOneAndDelete({
      sender: followRequest.from,
      recipient: currentUserId,
      type: "follow_request",
      followRequest: followRequest._id,
    });

    res.status(200).json({ message: "Follow request declined" });
  } catch (err) {
    console.error("declineFollowRequest error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.userId;

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const deleted = await Follow.findOneAndDelete({
      follower: currentUserId,
      following: targetUserId,
    });

    if (!deleted) {
      return res
        .status(400)
        .json({ message: "You are not following this user" });
    }

    await FollowRequest.findOneAndDelete({
      from: currentUserId,
      to: targetUserId,
      status: "accepted",
    });

    res.status(200).json({ followStatus: "not_following" });
  } catch (err) {
    console.error("unfollowUser error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────
// GET PROFILE BY USERNAME
// ─────────────────────────────────────────────────────────────
exports.getProfileByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user?.id;

    const user = await User.findOne({
      username: username.toLowerCase(),
    }).select(
      "username bio profilePicture postsCount fullName createdAt blockedUsers",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const targetUserId = user._id.toString();
    const isOwner = currentUserId === targetUserId;

    if (!isOwner && currentUserId) {
      // If the target user has blocked the current user → 404 (they vanish)
      const targetBlockedYou = user.blockedUsers?.some(
        (id) => id.toString() === currentUserId,
      );
      if (targetBlockedYou) {
        return res.status(404).json({ message: "User not found" });
      }
    }

    // Check if the current user has blocked the target
    let isBlocked = false;
    if (currentUserId && !isOwner) {
      const authUser =
        await User.findById(currentUserId).select("blockedUsers");
      isBlocked =
        authUser?.blockedUsers?.some((id) => id.toString() === targetUserId) ??
        false;
    }

    const [followersCount, followingCount] = await Promise.all([
      Follow.countDocuments({ following: targetUserId }),
      Follow.countDocuments({ follower: targetUserId }),
    ]);

    let followStatus = "not_following";
    if (!isOwner && currentUserId) {
      const isFollowing = await Follow.exists({
        follower: currentUserId,
        following: targetUserId,
      });
      if (isFollowing) {
        followStatus = "following";
      } else {
        const pending = await FollowRequest.exists({
          from: currentUserId,
          to: targetUserId,
          status: "pending",
        });
        if (pending) followStatus = "requested";
      }
    }

    res.status(200).json({
      _id: user._id,
      username: user.username,
      fullName: user.fullName,
      bio: followStatus === "following" || isOwner ? user.bio : null,
      profilePicture: user.profilePicture,
      followersCount,
      followingCount,
      postsCount: user.postsCount,
      joinedAt: user.createdAt,
      isOwner,
      isBlocked,
      followStatus,
    });
  } catch (err) {
    console.error("getProfileByUsername error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select(
      "username bio profilePicture postsCount fullName createdAt",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const [followersCount, followingCount] = await Promise.all([
      Follow.countDocuments({ following: user._id }),
      Follow.countDocuments({ follower: user._id }),
    ]);

    res.status(200).json({
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      bio: user.bio,
      profilePicture: user.profilePicture,
      followersCount,
      followingCount,
      joinedAt: user.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.isFollowing = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.userId;

    if (currentUserId === targetUserId) {
      return res.status(200).json({ followStatus: "owner" });
    }

    const isFollowing = await Follow.exists({
      follower: currentUserId,
      following: targetUserId,
    });
    if (isFollowing) {
      return res.status(200).json({ followStatus: "following" });
    }

    const pending = await FollowRequest.exists({
      from: currentUserId,
      to: targetUserId,
      status: "pending",
    });
    return res.status(200).json({
      followStatus: pending ? "requested" : "not_following",
    });
  } catch (err) {
    console.error("isFollowing error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.userId;

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetUserId),
    ]);

    if (!targetUser) return res.status(404).json({ message: "User not found" });

    if (currentUser.blockedUsers.includes(targetUserId)) {
      return res.status(400).json({ message: "User already blocked" });
    }

    currentUser.blockedUsers.push(targetUserId);

    await Promise.all([
      currentUser.save(),
      Follow.deleteMany({
        $or: [
          { follower: currentUserId, following: targetUserId },
          { follower: targetUserId, following: currentUserId },
        ],
      }),
      FollowRequest.deleteMany({
        $or: [
          { from: currentUserId, to: targetUserId },
          { from: targetUserId, to: currentUserId },
        ],
      }),
      Notification.deleteMany({
        $or: [
          {
            sender: currentUserId,
            recipient: targetUserId,
            type: "follow_request",
          },
          {
            sender: targetUserId,
            recipient: currentUserId,
            type: "follow_request",
          },
        ],
      }),
    ]);

    res.status(200).json({ message: "User blocked successfully" });
  } catch (err) {
    console.error("blockUser error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.userId;

    const currentUser = await User.findById(currentUserId);

    if (!currentUser.blockedUsers.map(String).includes(String(targetUserId))) {
      return res.status(400).json({ message: "User is not blocked" });
    }

    currentUser.blockedUsers = currentUser.blockedUsers.filter(
      (id) => id.toString() !== targetUserId,
    );

    await currentUser.save();
    res.status(200).json({ message: "User unblocked successfully" });
  } catch (err) {
    console.error("unblockUser error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

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
    console.error("reportUser error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getUsersByIds = async (req, res) => {
  try {
    const { ids } = req.body;
    const myId = req.user.id;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids must be a non-empty array" });
    }

    const [users, me, followedIds, pendingRequests] = await Promise.all([
      User.find({ _id: { $in: ids } })
        .select("_id username profilePicture fullName")
        .lean(),
      User.findById(myId).select("blockedUsers").lean(),
      Follow.find({ follower: myId, following: { $in: ids } })
        .select("following")
        .lean(),
      FollowRequest.find({ from: myId, to: { $in: ids }, status: "pending" })
        .select("to")
        .lean(),
    ]);

    const blockedSet = new Set((me?.blockedUsers || []).map(String));
    const followingSet = new Set(
      followedIds.map((f) => f.following.toString()),
    );
    const requestedSet = new Set(pendingRequests.map((r) => r.to.toString()));

    const result = users.map((user) => {
      const userId = user._id.toString();
      return {
        _id: user._id,
        username: user.username,
        profilePicture: user.profilePicture,
        fullName: user.fullName,
        followStatus: followingSet.has(userId)
          ? "following"
          : requestedSet.has(userId)
            ? "requested"
            : "not_following",
        isBlocked: blockedSet.has(userId),
      };
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("getUsersByIds error:", err);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
};




exports.directFollow = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.userId;

    if (currentUserId === targetUserId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetUserId),
    ]);

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (
      targetUser.blockedUsers.includes(currentUserId) ||
      currentUser.blockedUsers.includes(targetUserId)
    ) {
      return res.status(403).json({ message: "Action not allowed" });
    }

    const alreadyFollowing = await Follow.exists({
      follower: currentUserId,
      following: targetUserId,
    });
    if (alreadyFollowing) {
      return res.status(200).json({ followStatus: "following" });
    }

    // Skip request — directly create follow
    await Follow.create({
      follower: currentUserId,
      following: targetUserId,
    });

    await Notification.create({
      recipient: targetUserId,
      sender: currentUserId,
      type: "follow_accepted", // or a new type like "new_follower" if you want
    });

    res.status(200).json({ followStatus: "following" });
  } catch (err) {
    console.error("directFollow error:", err);
    res.status(500).json({ message: "Server error" });
  }
};



exports.getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id; // available because route uses authMiddleware

    const follows = await Follow.find({ following: userId })
      .populate("follower", "username profilePicture fullName")
      .lean();

    const users = follows.map((f) => f.follower);

    if (!currentUserId || users.length === 0) {
      return res
        .status(200)
        .json(users.map((u) => ({ ...u, followStatus: "not_following" })));
    }

    const ids = users.map((u) => u._id.toString());

    const [followedDocs, pendingDocs] = await Promise.all([
      Follow.find({ follower: currentUserId, following: { $in: ids } })
        .select("following")
        .lean(),
      FollowRequest.find({
        from: currentUserId,
        to: { $in: ids },
        status: "pending",
      })
        .select("to")
        .lean(),
    ]);

    const followingSet = new Set(
      followedDocs.map((f) => f.following.toString()),
    );
    const requestedSet = new Set(pendingDocs.map((r) => r.to.toString()));

    const result = users.map((u) => {
      const uid = u._id.toString();
      const isOwn = uid === currentUserId;
      return {
        ...u,
        followStatus: isOwn
          ? "owner"
          : followingSet.has(uid)
            ? "following"
            : requestedSet.has(uid)
              ? "requested"
              : "not_following",
      };
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("getFollowers error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;

    const follows = await Follow.find({ follower: userId })
      .populate("following", "username profilePicture fullName")
      .lean();

    const users = follows.map((f) => f.following);

    if (!currentUserId || users.length === 0) {
      return res
        .status(200)
        .json(users.map((u) => ({ ...u, followStatus: "not_following" })));
    }

    const ids = users.map((u) => u._id.toString());

    const [followedDocs, pendingDocs] = await Promise.all([
      Follow.find({ follower: currentUserId, following: { $in: ids } })
        .select("following")
        .lean(),
      FollowRequest.find({
        from: currentUserId,
        to: { $in: ids },
        status: "pending",
      })
        .select("to")
        .lean(),
    ]);

    const followingSet = new Set(
      followedDocs.map((f) => f.following.toString()),
    );
    const requestedSet = new Set(pendingDocs.map((r) => r.to.toString()));

    const result = users.map((u) => {
      const uid = u._id.toString();
      const isOwn = uid === currentUserId;
      return {
        ...u,
        followStatus: isOwn
          ? "owner"
          : followingSet.has(uid)
            ? "following"
            : requestedSet.has(uid)
              ? "requested"
              : "not_following",
      };
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("getFollowing error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
 
