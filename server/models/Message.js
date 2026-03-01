// const mongoose = require("mongoose");

// const messageSchema = new mongoose.Schema(
//   {
//     // Your UUID (keep this)
//     messageId: {
//       type: String,
//       required: true,
//       unique: true,
//       index: true,
//     },

//     // Conversation reference (IMPORTANT)
//     conversationId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Conversation",
//       required: true,
//       index: true,
//     },

//     senderId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       index: true,
//     },

//     receiverId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       index: true,
//     },

//     text: {
//       type: String,
//       required: true,
//       trim: true,
//       maxlength: 2000,
//     },

//     status: {
//       type: String,
//       enum: ["sent", "delivered", "read"],
//       default: "sent",
//       index: true,
//     },

//     createdAt: {
//       type: Date,
//       default: Date.now,
//       index: true,
//     },
//   },
//   {
//     versionKey: false,
//   },
// );

// // CRITICAL for fast chat loading
// messageSchema.index({
//   conversationId: 1,
//   createdAt: 1,
// });

// module.exports = mongoose.model("Message", messageSchema);

const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    // Your UUID
    messageId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Conversation reference
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
      index: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // Optional auto delete (for stranger chats)
    expiresAt: {
      type: Date,
      index: { expireAfterSeconds: 0 },
    },
  },
  {
    versionKey: false,
  },
);

// CRITICAL index for fast message loading
messageSchema.index({
  conversationId: 1,
  createdAt: -1,
});

// Useful for moderation and debugging
messageSchema.index({
  senderId: 1,
  receiverId: 1,
  createdAt: -1,
});

module.exports = mongoose.model("Message", messageSchema);