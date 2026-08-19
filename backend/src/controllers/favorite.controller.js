const favoriteService = require("../services/favorite.service");

const addServiceFavorite = async (req, res) => {
  try {
    const favorite = await favoriteService.addServiceFavorite(
      req.user._id,
      req.params.serviceId
    );

    res.status(201).json({
      success: true,
      message: "Service added to favorites",
      data: favorite,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const addProviderFavorite = async (req, res) => {
  try {
    const favorite = await favoriteService.addProviderFavorite(
      req.user._id,
      req.params.providerId
    );

    res.status(201).json({
      success: true,
      message: "Provider added to favorites",
      data: favorite,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getMyFavorites = async (req, res) => {
  try {
    const favorites = await favoriteService.getMyFavorites(req.user._id);

    res.status(200).json({
      success: true,
      count: favorites.length,
      data: favorites,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const removeFavorite = async (req, res) => {
  try {
    await favoriteService.removeFavorite(
      req.params.id,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: "Favorite removed successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addServiceFavorite,
  addProviderFavorite,
  getMyFavorites,
  removeFavorite,
};