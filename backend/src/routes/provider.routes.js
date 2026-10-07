const express = require("express");
const router = express.Router();

const providerController = require("../controllers/provider.controller");
const { protect, authorize, optionalAuth } = require("../middleware/auth.middleware");
const {
  uploadProfileImage,
  uploadNicImages,
  uploadSelfieImage,
  uploadPortfolioImages,
  uploadCertificateFile,
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

// optionalAuth: logged-in customers get results ranked by their saved
// location; guests get the normal unranked list. Still a public route.
router.get("/", optionalAuth, providerController.getAllProviders);
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

// ---- Verification checklist (provider only) ----

router.get(
  "/verification/score",
  protect,
  authorize("provider"),
  providerController.getVerificationScore
);

router.post(
  "/verification/submit",
  protect,
  authorize("provider"),
  providerController.submitForReview
);

router.put(
  "/profile/selfie",
  protect,
  authorize("provider"),
  uploadSelfieImage,
  providerController.uploadSelfieImage
);

router.post(
  "/profile/portfolio",
  protect,
  authorize("provider"),
  uploadPortfolioImages,
  providerController.addPortfolioImages
);

router.delete(
  "/profile/portfolio",
  protect,
  authorize("provider"),
  providerController.removePortfolioImage
);

router.post(
  "/profile/certificates",
  protect,
  authorize("provider"),
  uploadCertificateFile,
  providerController.addCertificate
);

router.delete(
  "/profile/certificates/:certificateId",
  protect,
  authorize("provider"),
  providerController.removeCertificate
);

router.put(
  "/profile/payout-details",
  protect,
  authorize("provider"),
  providerController.updatePayoutDetails
);

module.exports = router;