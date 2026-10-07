const mongoose = require("mongoose");

// A customer's posted requirement — the entry point of the "Job Request /
// Proposal / Order" pipeline (distinct from the existing direct "Book Now"
// flow on Service, and from the chat/invoice flow). Relevant providers are
// matched to this by category + country (see jobRequest.service.js
// getRelevantJobRequests), the same country-scoping used everywhere else
// in the marketplace.
const jobRequestSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    description: {
      type: String,
      required: [true, "Please describe what you need done"],
      trim: true,
    },

    // Snapshotted at post time — defaults from the customer's
    // preferredLocation but can be overridden per-request (the job might be
    // at a different address than their saved profile location).
    location: {
      city: { type: String, default: "", trim: true },
      district: { type: String, default: "", trim: true },
      country: { type: String, default: "Sri Lanka", trim: true },
    },

    preferredDate: {
      type: Date,
      default: null,
    },

    preferredTime: {
      type: String,
      default: "",
    },

    // Optional — "where applicable" per the spec. A customer describing a
    // custom job may not know a fair price yet and leave this blank,
    // letting providers propose their own.
    budget: {
      type: Number,
      default: null,
    },

    attachments: {
      type: [String],
      default: [],
    },

    // open      — accepting proposals
    // awarded   — a proposal was accepted; an Order now exists for this job
    // cancelled — customer withdrew it before awarding
    status: {
      type: String,
      enum: ["open", "awarded", "cancelled"],
      default: "open",
    },
  },
  {
    timestamps: true,
  }
);

jobRequestSchema.index({ status: 1, category: 1, "location.country": 1 });

module.exports = mongoose.model("JobRequest", jobRequestSchema);