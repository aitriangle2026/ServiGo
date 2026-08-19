const express = require("express");
const router = express.Router();

const serviceController = require("../controllers/service.controller");
const { protect, authorize } = require("../middleware/auth.middleware");
const {
  uploadServiceImages,
  uploadPortfolioImages,
} = require("../middleware/upload.middleware");

router.get("/", serviceController.getAllServices);
router.get("/:id", serviceController.getServiceById);

router.post(
  "/",
  protect,
  authorize("provider"),
  serviceController.createService
);

router.put(
  "/:id",
  protect,
  authorize("provider"),
  serviceController.updateService
);

router.put(
  "/:id/images",
  protect,
  authorize("provider"),
  uploadServiceImages,
  serviceController.uploadServiceImages
);

router.put(
  "/:id/portfolio-images",
  protect,
  authorize("provider"),
  uploadPortfolioImages,
  serviceController.uploadPortfolioImages
);

router.delete(
  "/:id",
  protect,
  authorize("provider"),
  serviceController.deleteService
);

module.exports = router;