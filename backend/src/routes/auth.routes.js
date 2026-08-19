const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");

const authController = require("../controllers/auth.controller");
const otpController = require("../controllers/otp.controller");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", protect, authController.logout);
router.get("/profile", protect, authController.getProfile);

router.post("/forgot-password", otpController.forgotPassword);
router.post("/send-otp", otpController.sendOtp);
router.post("/verify-otp", otpController.verifyOtp);
router.post("/resend-otp", otpController.resendOtp);
router.post("/reset-password", otpController.resetPassword);

module.exports = router;