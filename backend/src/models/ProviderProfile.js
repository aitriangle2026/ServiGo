const mongoose = require("mongoose");

const providerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    nicNumber: {
      type: String,
      required: true,
      trim: true,
    },

    // "nic" = two-sided national ID, "passport" = single photo page. Kept
    // the field name "nicNumber"/"nicFrontImage"/"nicBackImage" as-is for
    // backward compatibility — this just tells the verification score
    // calculator (and the admin review screen) which document shape to
    // expect.
    documentType: {
      type: String,
      enum: ["nic", "passport"],
      default: "nic",
    },

    nicFrontImage: {
      type: String,
      default: "",
    },

    nicBackImage: {
      type: String,
      default: "",
    },

    // A live selfie for the admin to visually compare against the ID photo
    // during manual verification — not automated face-matching.
    selfieImage: {
      type: String,
      default: "",
    },

    profileImage: {
      type: String,
      default: "",
    },

    // Photos of past work, submitted specifically as verification evidence
    // — distinct from a Service's own per-listing portfolioImages.
    portfolioImages: {
      type: [String],
      default: [],
    },

    // Payout destination. Real payment capture is still simulated
    // (see invoice.service.js), so this is what an admin would use to
    // manually settle a payout today, and what a real gateway integration
    // would read from later.
    payoutDetails: {
      bankName: { type: String, default: "", trim: true },
      accountNumber: { type: String, default: "", trim: true },
      accountHolderName: { type: String, default: "", trim: true },
      branch: { type: String, default: "", trim: true },
    },

    bio: {
      type: String,
      default: "",
    },

    experience: {
      type: Number,
      default: 0,
    },

    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],

    workingArea: {
      address: String,
      city: String,
      district: String,
      country: {
        type: String,
        default: "Sri Lanka",
        trim: true,
      },
      latitude: Number,
      longitude: Number,
      radius: {
        type: Number,
        default: 10,
      },
    },

    certificates: [
      {
        title: String,
        fileUrl: String,
      },
    ],

    isVerified: {
      type: Boolean,
      default: false,
    },

    // "draft" — provider is still filling in the verification checklist,
    // not visible to admins yet. "pending" — submitted, waiting on an
    // admin decision. Providers can resubmit from "rejected" too.
    verificationStatus: {
      type: String,
      enum: ["draft", "pending", "approved", "rejected"],
      default: "draft",
    },

    // Snapshotted at the moment the provider clicks "Submit for review" —
    // deliberately not recomputed live after that, so an admin sees the
    // score as it was when the provider actually submitted, the same way
    // invoice commission rates are snapshotted at approval time.
    verificationScore: {
      type: Number,
      default: 0,
    },

    verificationSubmittedAt: {
      type: Date,
      default: null,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    averageRating: {
      type: Number,
      default: 0,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "ProviderProfile",
  providerProfileSchema
);