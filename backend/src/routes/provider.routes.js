const express = require("express");
const router = express.Router();

const providerController = require("../controllers/provider.controller");
const { protect, authorize } = require("../middleware/auth.middleware");
const {
  uploadProfileImage,
  uploadNicImages,
} = require("../middleware/upload.middleware");


router.post(
  "/profile",
  protect,
  authorize("provider"),
  providerController.createProfile
);

router.get(
  "/profile",
  protect,
  authorize("provider"),
  providerController.getMyProfile
);

router.get(
  "/pending",
  protect,
  authorize("admin"),
  providerController.getPendingProviders
);

router.get("/", providerController.getAllProviders);
router.get("/:id", providerController.getProviderById);

router.put(
  "/profile",
  protect,
  authorize("provider"),
  providerController.updateProfile
);

router.put(
  "/profile/image",
  protect,
  authorize("provider"),
  uploadProfileImage,
  providerController.uploadProfileImage
);

router.put(
  "/profile/nic-images",
  protect,
  authorize("provider"),
  uploadNicImages,
  providerController.uploadNicImages
);

router.put(
  "/:id/verify",
  protect,
  authorize("admin"),
  providerController.updateVerificationStatus
);

module.exports = router;