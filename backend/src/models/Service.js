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