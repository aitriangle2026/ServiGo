const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProviderProfile",
      required: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    workDetails: {
      type: String,
      trim: true,
    },

    duration: {
      type: String,
      trim: true,
    },

    tags: {
      type: [String],
      default: [],
    },

    portfolioImages: {
      type: [String],
      default: [],
    },

    price: {
      type: Number,
      required: true,
    },

    priceType: {
      type: String,
      enum: ["fixed", "hourly"],
      default: "fixed",
    },

    images: [
      {
        type: String,
      },
    ],

    // "What's Included" — the concrete things this service covers, shown as
    // the feature grid on the detail page. Free-form per service rather than
    // a fixed taxonomy, since what an electrician includes has nothing in
    // common with what a tutor does.
    inclusions: [
      {
        title: { type: String, trim: true },
        description: { type: String, trim: true },
        _id: false,
      },
    ],

    // Questions the provider answers up front, so customers don't have to
    // open a chat for the same five things every time.
    faqs: [
      {
        question: { type: String, trim: true },
        answer: { type: String, trim: true },
        _id: false,
      },
    ],

    // Extra areas this service covers beyond the provider's own
    // workingArea.city — a Colombo electrician who also takes Dehiwala and
    // Nugegoda jobs lists them here.
    serviceAreas: {
      type: [String],
      default: [],
    },

    isActive: {
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

module.exports = mongoose.model("Service", serviceSchema);