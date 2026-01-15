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

    // 🌍 COUNTRY (keep existing)
    country: {
      type: String, // ISO code like "IN", "US"
      required: true,
      trim: true,
    },

    // ✅ OPTIONAL (recommended for future use)
    countryCode: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 2,
    },

    // 🚻 GENDER
    gender: {
      type: String,
      enum: ["male", "female", "non_binary", "prefer_not_to_say"],
      default: "prefer_not_to_say",
    },

    profilePicture: {
      type: String,
      default: "",
    },

    age: {
      type: Number,
      required: true,
      min: 16,
    },

    // SOCIAL GRAPH
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

    // ACCOUNT STATUS
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
