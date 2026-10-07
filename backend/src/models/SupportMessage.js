const mongoose = require("mongoose");

// Mirrors the shape of the customer<->provider Message model, minus the
// invoice/call_log message types, which don't apply to provider<->admin
// support chat.
const supportMessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupportConversation",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["text", "image", "document", "voice"],
      default: "text",
    },

    text: {
      type: String,
      default: "",
    },

    attachmentUrl: {
      type: String,
      default: "",
    },

    attachmentName: {
      type: String,
      default: "",
    },

    duration: {
      type: Number,
      default: 0,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

supportMessageSchema.index({ conversation: 1, createdAt: 1 });

module.exports = mongoose.model("SupportMessage", supportMessageSchema);