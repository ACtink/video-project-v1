// const mongoose = require("mongoose");

// const conversationSchema = new mongoose.Schema(
//   {
//     participants: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//         required: true,
//       },
//     ],

//     // Who started chat
//     requesterId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     // pending = message request
//     // accepted = normal chat
//     // blocked = blocked
//     status: {
//       type: String,
//       enum: ["pending", "accepted", "blocked"],
//       default: "pending",
//       index: true,
//     },

//     // Last message preview
//     lastMessage: {
//       type: String,
//       default: "",
//     },

//     lastMessageSenderId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },

//     lastMessageAt: {
//       type: Date,
//       default: Date.now,
//       index: true,
//     },

//     // Optional: for Omegle-like stranger chats
//     isStrangerChat: {
//       type: Boolean,
//       default: false,
//       index: true,
//     },
//   },
//   {
//     timestamps: true,
//     versionKey: false,
//   },
// );

// // IMPORTANT index for fast lookup
// conversationSchema.index({
//   participants: 1,
// });

// module.exports = mongoose.model("Conversation", conversationSchema);

const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    // Exactly 2 users in 1-to-1 chat
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    // Who initiated the conversation
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Chat status
    status: {
      type: String,
      enum: ["pending", "accepted", "blocked"],
      default: "pending",
      index: true,
    },

    // Last message preview (for chat list)
    lastMessage: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },

    lastMessageSenderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // For Omegle-like stranger chats
    isStrangerChat: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Optional: unread count per user
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// CRITICAL index for fast chat list loading
conversationSchema.index({
  participants: 1,
  lastMessageAt: -1,
});

// Prevent duplicate conversations
conversationSchema.index({ participants: 1 }, { unique: false });

module.exports = mongoose.model("Conversation", conversationSchema);