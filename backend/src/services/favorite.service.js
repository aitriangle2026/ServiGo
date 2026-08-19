const Favorite = require("../models/Favorite");

const addServiceFavorite = async (userId, serviceId) => {
  const exists = await Favorite.findOne({
    customer: userId,
    service: serviceId,
  });

  if (exists) {
    throw new Error("Already in favorites");
  }

  const favorite = await Favorite.create({
    customer: userId,
    service: serviceId,
  });

  return await Favorite.findById(favorite._id)
    .populate("service")
    .populate("provider");
};

const addProviderFavorite = async (userId, providerId) => {
  const exists = await Favorite.findOne({
    customer: userId,
    provider: providerId,
  });

  if (exists) {
    throw new Error("Already in favorites");
  }

  const favorite = await Favorite.create({
    customer: userId,
    provider: providerId,
  });

  return await Favorite.findById(favorite._id)
    .populate("provider")
    .populate("service");
};

const getMyFavorites = async (userId) => {
  return await Favorite.find({
    customer: userId,
  })
    .populate({
      path: "provider",
      populate: {
        path: "user",
        select: "firstName lastName email phone",
      },
    })
    .populate("service");
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