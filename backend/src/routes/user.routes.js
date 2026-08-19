const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

router.put("/profile", protect, userController.updateProfile);
router.get("/", protect, authorize("admin"), userController.getAllUsers);
router.put("/:id/status", protect, authorize("admin"), userController.updateUserStatus);

module.exports = router;