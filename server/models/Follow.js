// models/Follow.js
const mongoose = require("mongoose");

const followSchema = new mongoose.Schema(
  {
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// Prevent duplicate follow relationships at the DB level
followSchema.index({ follower: 1, following: 1 }, { unique: true });

// Useful indexes for common queries:
// "get all followers of a user" and "get all users someone follows"
followSchema.index({ following: 1 });
followSchema.index({ follower: 1 });

module.exports = mongoose.model("Follow", followSchema);
