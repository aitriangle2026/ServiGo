const crypto = require("crypto");
const bcrypt = require("bcrypt");
const Otp = require("../models/Otp");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

const generateOtpCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const sendOtp = async (email, purpose = "reset-password") => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("No account found with that email");
  }

  const code = generateOtpCode();
  const otpHash = await bcrypt.hash(code, 10);

  await Otp.deleteMany({ email, purpose });

  await Otp.create({
    email,
    otpHash,
    purpose,
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
  });

  await sendEmail({
    to: email,
    subject: "Your ServiGo verification code",
    html: `<p>Your verification code is <strong>${code}</strong>. It expires in ${OTP_EXPIRY_MINUTES} minutes.</p>`,
  });

  return { message: "OTP sent successfully" };
};

const verifyOtp = async (email, code, purpose = "reset-password") => {
  const record = await Otp.findOne({ email, purpose, consumed: false }).sort({ createdAt: -1 });

  if (!record) {
    throw new Error("Invalid or expired code");
  }

  if (record.expiresAt < new Date()) {
    throw new Error("Invalid or expired code");
  }

  const isMatch = await bcrypt.compare(code, record.otpHash);

  if (!isMatch) {
    throw new Error("Invalid or expired code");
  }

  record.consumed = true;
  await record.save();

  return { verified: true };
};

const resendOtp = async (email, purpose = "reset-password") => {
  return sendOtp(email, purpose);
};

const resetPassword = async ({ email, otp, newPassword }) => {
  const record = await Otp.findOne({
    email,
    purpose: "reset-password",
  }).sort({ createdAt: -1 });

  if (!record || record.expiresAt < new Date()) {
    throw new Error("Invalid or expired code");
  }

  const isMatch = await bcrypt.compare(otp, record.otpHash);
  if (!isMatch) {
    throw new Error("Invalid or expired code");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("No account found with that email");
  }

  user.password = newPassword;
  await user.save();

  await Otp.deleteMany({ email, purpose: "reset-password" });

  return { message: "Password reset successfully" };
};

module.exports = {
  sendOtp,
  verifyOtp,
  resendOtp,
  resetPassword,
};