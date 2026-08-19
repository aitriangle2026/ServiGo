const express = require("express");

const router = express.Router();

const favoriteController = require("../controllers/favorite.controller");

const {
  protect,
  authorize,
} = require("../middleware/auth.middleware");

router.get(
  "/",
  protect,
  authorize("customer"),
  favoriteController.getMyFavorites
);

router.post(
  "/service/:serviceId",
  protect,
  authorize("customer"),
  favoriteController.addServiceFavorite
);

router.post(
  "/provider/:providerId",
  protect,
  authorize("customer"),
  favoriteController.addProviderFavorite
);

router.delete(
  "/:id",
  protect,
  authorize("customer"),
  favoriteController.removeFavorite
);

module.exports = router;