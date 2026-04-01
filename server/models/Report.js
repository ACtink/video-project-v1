const mongoose = require("mongoose");


const VALID_REASONS = [
  "Spam",
  "Nudity or sexual activity",
  "Hate speech or symbols",
  "Violence or dangerous content",
  "Harassment or bullying",
  "False information",
];

const reportSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reason: { type: String, enum: VALID_REASONS, required: true },
  status: { type: String, enum: ["pending", "dismissed"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

reportSchema.index({ post: 1, reportedBy: 1 }, { unique: true });



module.exports = mongoose.model("Report", reportSchema);
