const mongoose = require("mongoose");

/*
 * Notification types — all live in this one collection.
 *
 * CURRENTLY ACTIVE:
 *   follow_request   — someone sent you a follow request
 *   follow_accepted  — your follow request was accepted
 *
 * STUBBED FOR LATER (add routes/logic when you build those features):
 *   like             — someone liked your post
 *   comment          — someone commented on your post
 *   comment_like     — someone liked your comment
 *   mention          — someone mentioned you in a comment
 *   message          — someone sent you a direct message
 *
 * Entity refs — only the field relevant to the type is populated.
 * Everything else is null and ignored by the frontend.
 *
 * Adding a new type later:
 *   1. Add the type string to the enum below
 *   2. Add its entity ref field if needed (e.g. post, comment)
 *   3. Create the notification in the relevant route/controller
 *   4. Handle the new type in the frontend notification card
 *   — No other changes needed to this model.
 */

const notificationSchema = new mongoose.Schema(
  {
    // ── Core fields (always present) ──────────────────────

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: [
        "follow_request",
        "follow_accepted",
        "like",
        "comment",
        "comment_like",
        "mention",
        "message",
      ],
      required: true,
    },

    read: {
      type: Boolean,
      default: false,
    },

    // ── Action status (only for types that require user action) ──
    // follow_request → pending | accepted | declined
    // all other types → leave as null

    status: {
      type: String,
      enum: ["pending", "accepted", "declined", null],
      default: null,
    },

    // ── Entity refs (only one is set per notification) ────

    // follow_request, follow_accepted
    followRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FollowRequest",
      default: null,
    },

    // like, comment, comment_like, mention
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },

    // comment, comment_like, mention
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },

    // message
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  { timestamps: true },
);

// ── Indexes ───────────────────────────────────────────────

// Primary feed query — all notifications for a user, newest first
notificationSchema.index({ recipient: 1, createdAt: -1 });

// Unread count query
notificationSchema.index({ recipient: 1, read: 1 });

// Prevent duplicate notifications of the same type from the same sender
// e.g. someone can't spam you with follow requests
// (covers follow_request — for likes/comments you may want to allow multiples, adjust per type)
notificationSchema.index(
  { recipient: 1, sender: 1, type: 1, followRequest: 1 },
  {
    unique: true,
    partialFilterExpression: {
      type: { $in: ["follow_request", "follow_accepted"] },
    },
  },
);

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
