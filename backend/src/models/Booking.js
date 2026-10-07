const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
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
      // Not required — bookings created from an approved chat invoice may
      // cover custom/described work with no catalog Service attached.
      default: null,
    },

    // Set when this booking was created from an approved invoice sent
    // through chat, rather than the direct "Book Now" flow.
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      default: null,
    },

    // Required for the direct "Book Now" flow. Bookings created from an
    // invoice may not have a fixed slot yet (customer/provider coordinate
    // the exact time over chat instead), so these are left optional there.
    bookingDate: {
      type: Date,
      default: null,
    },

    bookingTime: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },

    notes: {
      type: String,
      default: "",
    },

    totalPrice: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "on_the_way",
        "rejected",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Booking", bookingSchema);