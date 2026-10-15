const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProviderProfile",
      default: null,
    },

    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// One favorite per customer per service, and per customer per provider.
// Partial, because each document fills only one of the two fields — a plain
// unique index would treat every `null` as the same value and allow just one
// service favorite per customer. (An old { user, provider } index made exactly
// that mistake; see scripts/drop-stale-favorite-index.js.)
favoriteSchema.index(
  { customer: 1, service: 1 },
  { unique: true, partialFilterExpression: { service: { $type: "objectId" } } }
);
favoriteSchema.index(
  { customer: 1, provider: 1 },
  { unique: true, partialFilterExpression: { provider: { $type: "objectId" } } }
);

module.exports = mongoose.model("Favorite", favoriteSchema);