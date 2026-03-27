const mongoose = require("mongoose");

const followRequestSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted"],
      default: "pending",
    },
  },
  { timestamps: true },
);

// Prevent duplicate requests between the same two users
followRequestSchema.index({ from: 1, to: 1 }, { unique: true });

// Fast lookup of all incoming pending requests for a user
followRequestSchema.index({ to: 1, status: 1 });

// Fast lookup of all outgoing requests a user has sent
followRequestSchema.index({ from: 1, status: 1 });

const FollowRequest = mongoose.model("FollowRequest", followRequestSchema);

module.exports = FollowRequest;
