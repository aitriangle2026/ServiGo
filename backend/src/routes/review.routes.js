const express = require("express");

const router = express.Router();

const reviewController = require("../controllers/review.controller");
const {
  protect,
  authorize,
} = require("../middleware/auth.middleware");

router.get(
  "/provider/:providerId",
  reviewController.getProviderReviews
);

router.get(
  "/service/:serviceId",
  reviewController.getServiceReviews
);

router.put(
  "/:id",
  protect,
  authorize("customer"),
  reviewController.updateReview
);

router.delete(
  "/:id",
  protect,
  authorize("customer"),
  reviewController.deleteReview
);

router.post(
  "/",
  protect,
  authorize("customer"),
  reviewController.createReview
);

module.exports = router;