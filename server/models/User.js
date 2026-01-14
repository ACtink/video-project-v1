const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // AUTH BASICS
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    // PROFILE INFO
    bio: {
      type: String,
      maxlength: 150,
      default: "",
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },

    profilePicture: {
      type: String, // URL
      default: "",
    },

    age: {
      type: Number,
      required: true,
      min: 16,
    },

    // SOCIAL GRAPH (Instagram-style)
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // SAFETY & MODERATION
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    reportedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // ACCOUNT STATUS (future-ready)
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
