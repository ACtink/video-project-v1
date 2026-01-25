const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    caption: {
      type: String,
      trim: true,
      maxlength: 2200,
    },

    imageUrl: {
      type: String,
      required: true,
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    likesCount: {
      type: Number,
      default: 0,
    },

    commentsCount: {
      type: Number,
      default: 0,
    },

    visibility: {
      type: String,
      enum: ["public", "private", "followers"],
      default: "public",
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
postSchema.index({ createdAt: -1 });
postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ visibility: 1, createdAt: -1 });

module.exports = mongoose.model("Post", postSchema);
