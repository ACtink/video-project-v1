const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    // Who started chat
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // pending = message request
    // accepted = normal chat
    // blocked = blocked
    status: {
      type: String,
      enum: ["pending", "accepted", "blocked"],
      default: "pending",
      index: true,
    },

    // Last message preview
    lastMessage: {
      type: String,
      default: "",
    },

    lastMessageSenderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // Optional: for Omegle-like stranger chats
    isStrangerChat: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// IMPORTANT index for fast lookup
conversationSchema.index({
  participants: 1,
});

module.exports = mongoose.model("Conversation", conversationSchema);
