const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { protect, authorize } = require("../middleware/auth.middleware");
const { uploadProfileImage } = require("../middleware/upload.middleware");

router.put("/profile", protect, userController.updateProfile);
router.put("/profile/photo", protect, uploadProfileImage, userController.updateProfilePhoto);
router.post("/me/deactivate", protect, authorize("customer"), userController.deactivateAccount);

router.get("/addresses", protect, userController.listAddresses);
router.post("/addresses", protect, userController.addAddress);
router.put("/addresses/:id", protect, userController.updateAddress);
router.delete("/addresses/:id", protect, userController.deleteAddress);
router.get("/", protect, authorize("admin"), userController.getAllUsers);
router.put("/:id/status", protect, authorize("admin"), userController.updateUserStatus);

module.exports = router;