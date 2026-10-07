const mongoose = require("mongoose");

// A provider's quote against a customer's JobRequest — the middle step of
// the "Job Request / Proposal / Order" pipeline.
//
//   pending   — sent by the provider, customer hasn't decided yet
//   accepted  — customer picked this one; the JobRequest flips to "awarded"
//   rejected  — customer declined it, or the customer cancelled the whole
//               job request (see jobRequest.service.js cancelJobRequest)
//   withdrawn — the provider pulled their own quote back
//
// NOTE: only the read side of this model is wired up today —
// jobRequest.service.js counts proposals, uses them to decide whether a
// provider may still view an awarded request, and rejects them in bulk when
// a request is cancelled. The submit/accept flow (proposal.service.js and
// the Order it creates on acceptance) is not built yet.
const proposalSchema = new mongoose.Schema(
  {
    jobRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobRequest",
      required: true,
    },

    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProviderProfile",
      required: true,
    },

    // The price the provider is quoting. The customer's JobRequest.budget
    // is only a hint — providers are free to quote above or below it, or to
    // quote at all when the customer left the budget blank.
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // The provider's pitch: what they'll do, what's included, why them.
    message: {
      type: String,
      default: "",
      trim: true,
    },

    // What the provider can actually do, which may differ from the
    // customer's preferredDate/preferredTime on the JobRequest.
    proposedDate: {
      type: Date,
      default: null,
    },

    proposedTime: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "withdrawn"],
      default: "pending",
    },

    respondedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// One live quote per provider per job request — a provider revises their
// existing proposal rather than stacking up several against the same job.
// Mirrors the unique (customer, provider) pair on Conversation.
proposalSchema.index({ jobRequest: 1, provider: 1 }, { unique: true });

// Drives the proposalCount aggregation and the "my proposals" listing.
proposalSchema.index({ jobRequest: 1, status: 1 });

module.exports = mongoose.model("Proposal", proposalSchema);
