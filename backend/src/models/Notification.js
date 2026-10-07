const mongoose = require("mongoose");
const {
  NOTIFICATION_TYPE_KEYS,
  NOTIFICATION_AUDIENCES,
  LEGACY_TYPES,
} = require("../config/notificationTypes");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    // Derived from the catalog in config/notificationTypes.js rather than
    // written out by hand, so adding a type there is all it takes — the
    // enum can't fall behind. LEGACY_TYPES keeps rows written by earlier
    // versions valid on re-save.
    type: {
      type: String,
      enum: [...NOTIFICATION_TYPE_KEYS, ...LEGACY_TYPES],
      default: "system",
    },

    // Which role this row was written *for*. The same type can go to more
    // than one role with a different headline each (a new booking is
    // "Booking Request Sent" to the customer and "New Booking Request" to
    // the provider), so the audience is part of the row's identity.
    audience: {
      type: String,
      enum: NOTIFICATION_AUDIENCES,
      required: true,
    },

    // Where clicking this notification should take the recipient, resolved
    // from the catalog at creation time. Null for rows with nowhere to go.
    link: {
      type: String,
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },

    // The booking / invoice / review / provider this is about.
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// The bell and the notifications page both read "my newest first", and the
// bell badge counts my unread — this covers both.
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
