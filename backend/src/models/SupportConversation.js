const mongoose = require("mongoose");

// One thread per provider — a shared "provider <-> ServiGo admin team" inbox
// rather than a thread per admin, since any admin should be able to pick up
// and reply. Created the moment a provider's SupportRequest is approved;
// later approved requests from the same provider reuse this same thread.
const supportConversationSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
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

    providerUnreadCount: {
      type: Number,
      default: 0,
    },

    // Shared across every admin — any admin reading the thread clears it for
    // all admins, same as one shared support inbox would work.
    adminUnreadCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SupportConversation", supportConversationSchema);