const mongoose = require("mongoose");

// The escrow/commission lifecycle for one job:
//
//   pending_admin     provider just sent it — waiting on an admin to vet it
//   rejected_by_admin admin declined it before the customer ever saw it as actionable (terminal)
//   awaiting_customer admin approved it — now waiting on the customer
//   rejected          customer declined it (terminal)
//   approved          customer accepted the price, waiting on payment
//   paid              customer paid — funds held by the platform (admin), not yet the provider
//   payout_released   admin released the provider's cut after deducting commission (terminal)
//
// commissionRate/commissionAmount/providerPayoutAmount are snapshotted at
// approval time so a later change to the platform commission rate never
// rewrites the math on an invoice that's already in flight.
const invoiceItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },

    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProviderProfile",
      required: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      default: null,
    },

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },

    items: {
      type: [invoiceItemSchema],
      required: true,
      validate: (v) => Array.isArray(v) && v.length > 0,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    notes: {
      type: String,
      default: "",
    },

    // Proposed scheduling, filled in by the provider when composing the
    // invoice; used to create the Booking once the customer approves & pays.
    proposedDate: { type: Date, default: null },
    proposedTime: { type: String, default: "" },

    status: {
      type: String,
      enum: [
        "pending_admin",
        "rejected_by_admin",
        "awaiting_customer",
        "rejected",
        "approved",
        "paid",
        "payout_released",
      ],
      default: "pending_admin",
    },

    rejectionReason: { type: String, default: "" },

    // Admin's vetting step — happens before the customer ever sees this as
    // actionable.
    adminReviewedAt: { type: Date, default: null },
    adminReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    adminRejectionReason: { type: String, default: "" },

    // Snapshotted once the customer approves
    commissionRate: { type: Number, default: null },
    commissionAmount: { type: Number, default: null },
    providerPayoutAmount: { type: Number, default: null },

    // Payment capture. `method: "manual"` is a stand-in for a real payment
    // gateway (e.g. PayHere/Stripe) — see invoice.service.js `payInvoice`.
    paymentMethod: { type: String, default: "manual" },
    paidAt: { type: Date, default: null },

    releasedAt: { type: Date, default: null },
    releasedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Invoice", invoiceSchema);