const mongoose = require("mongoose");

// One conversation per (customer, provider) pair, optionally scoped to the
// service the customer first reached out about. Re-used for every later
// message/invoice between the same two people rather than creating a new
// thread each time.
const conversationSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProviderProfile",
      required: true,
    },

    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      default: null,
    },

    lastMessage: {
      type: String,
      default: "",
    },

    lastMessageAt: {
      type: Date,
      default: Date.now,
    },

    lastSender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Per-conversation unread counters, keyed by the User role reading it —
    // simpler than tracking readBy arrays per message for a two-party thread.
    customerUnreadCount: {
      type: Number,
      default: 0,
    },

    providerUnreadCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ customer: 1, provider: 1 }, { unique: true });

module.exports = mongoose.model("Conversation", conversationSchema);