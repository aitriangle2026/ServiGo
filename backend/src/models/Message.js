const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["text", "image", "document", "voice", "invoice", "call_log"],
      default: "text",
    },

    text: {
      type: String,
      default: "",
    },

    // For image/document/voice messages
    attachmentUrl: {
      type: String,
      default: "",
    },

    attachmentName: {
      type: String,
      default: "",
    },

    // Voice message length in seconds, so the UI can render a duration
    // without downloading the file first.
    duration: {
      type: Number,
      default: 0,
    },

    // Set when type === 'invoice'
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      default: null,
    },

    // Set when type === 'call_log' (a system message summarizing a finished call)
    callLog: {
      callType: { type: String, enum: ["audio", "video"], default: "audio" },
      status: {
        type: String,
        enum: ["completed", "missed", "declined"],
        default: "completed",
      },
      durationSeconds: { type: Number, default: 0 },
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

messageSchema.index({ conversation: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);