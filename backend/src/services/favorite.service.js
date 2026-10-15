const Favorite = require("../models/Favorite");
const Booking = require("../models/Booking");

const addServiceFavorite = async (userId, serviceId) => {
  const exists = await Favorite.findOne({
    customer: userId,
    service: serviceId,
  });

  // Saving twice is a no-op, not an error — the heart may simply be out of
  // date in another tab.
  const favorite =
    exists ||
    (await Favorite.create({
      customer: userId,
      service: serviceId,
    }));

  return favorite;
};

const addProviderFavorite = async (userId, providerId) => {
  const exists = await Favorite.findOne({
    customer: userId,
    provider: providerId,
  });

  const favorite =
    exists ||
    (await Favorite.create({
      customer: userId,
      provider: providerId,
    }));

  return favorite;
};

// Only what a customer should see of a provider — the profile also holds NIC
// numbers, ID scans, a selfie and bank details.
const PUBLIC_PROVIDER_FIELDS =
  "user profileImage bio tagline experience categories workingArea.city workingArea.district " +
  "isVerified isAvailable averageRating totalReviews";

const getMyFavorites = async (userId) => {
  const favorites = await Favorite.find({
    customer: userId,
  })
    .populate({
      path: "provider",
      select: PUBLIC_PROVIDER_FIELDS,
      populate: [
        { path: "user", select: "firstName lastName profileImage" },
        { path: "categories", select: "name" },
      ],
    })
    .populate({
      path: "service",
      populate: { path: "category", select: "name" },
    })
    .sort("-createdAt")
    .lean();

  // Completed-job counts for the saved professionals, in one query.
  const providerIds = favorites.filter((f) => f.provider).map((f) => f.provider._id);
  if (providerIds.length === 0) return favorites;

  const counts = await Booking.aggregate([
    { $match: { provider: { $in: providerIds }, status: "completed" } },
    { $group: { _id: "$provider", count: { $sum: 1 } } },
  ]);
  const countById = new Map(counts.map((c) => [String(c._id), c.count]));

  return favorites.map((f) =>
    f.provider
      ? { ...f, provider: { ...f.provider, completedJobs: countById.get(String(f.provider._id)) || 0 } }
      : f
  );
};

const removeFavorite = async (favoriteId, userId) => {
  const favorite = await Favorite.findOneAndDelete({
    _id: favoriteId,
    customer: userId,
  });

  if (!favorite) {
    throw new Error("Favorite not found");
  }

  return favorite;
};

module.exports = {
  addServiceFavorite,
  addProviderFavorite,
    getMyFavorites,
    removeFavorite,
};