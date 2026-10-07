const mongoose = require("mongoose");

// A provider's request to open a chat with the ServiGo admin team. Nothing
// lets the provider skip straight to chatting — an admin has to approve the
// request first (see SupportConversation, created on approval).
const supportRequestSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },

    rejectionReason: {
      type: String,
      default: "",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    // Set once approved — the conversation this request unlocked.
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupportConversation",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

supportRequestSchema.index({ provider: 1, createdAt: -1 });

module.exports = mongoose.model("SupportRequest", supportRequestSchema);