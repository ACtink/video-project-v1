const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    // Your UUID (keep this)
    messageId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Conversation reference (IMPORTANT)
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
  },
  {
    versionKey: false,
  },
);

// CRITICAL for fast chat loading
messageSchema.index({
  conversationId: 1,
  createdAt: 1,
});

module.exports = mongoose.model("Message", messageSchema);
