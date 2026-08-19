const otpService = require("../services/otp.service");

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const data = await otpService.sendOtp(email, "reset-password");
    res.status(200).json({ success: true, message: data.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const sendOtp = async (req, res) => {
  try {
    const { email, purpose } = req.body;
    const data = await otpService.sendOtp(email, purpose);
    res.status(200).json({ success: true, message: data.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp, purpose } = req.body;
    await otpService.verifyOtp(email, otp, purpose);
    res.status(200).json({ success: true, message: "Code verified" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email, purpose } = req.body;
    const data = await otpService.resendOtp(email, purpose);
    res.status(200).json({ success: true, message: data.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const data = await otpService.resetPassword(req.body);
    res.status(200).json({ success: true, message: data.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  forgotPassword,
  sendOtp,
  verifyOtp,
  resendOtp,
  resetPassword,
};