const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const generateRefreshToken = require("../utils/generateRefreshToken");
const jwt = require("jsonwebtoken");
const notificationService = require("./notification.service");

const register = async (userData) => {
  const existingUser = await User.findOne({
    email: userData.email,
  });

  if (existingUser) {
    throw new Error("Email already exists");
  }

  const user = await User.create(userData);

  // Admins are told about every new account. A failure here must never cost
  // someone their registration, so it's deliberately not awaited into the
  // success path.
  if (user.role !== "admin") {
    notificationService
      .notifyAdmins({
        type: user.role === "provider" ? "new_provider" : "new_customer",
        message: `${user.firstName} ${user.lastName} registered as a ${user.role}.`,
        referenceId: user._id,
      })
      .catch(() => {});
  }

  const userResponse = user.toObject();
  delete userResponse.password;

  return userResponse;
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  // Checked only after the password, so this message can't be used to find
  // out which emails have accounts. Covers both admin suspension and a
  // customer deactivating their own account.
  if (user.isActive === false) {
    throw new Error("This account has been deactivated. Contact support to restore it.");
  }

  user.lastLogin = new Date();

  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);
  user.refreshToken = refreshToken;

  await user.save();

  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.refreshToken;

  return {
    token,
    refreshToken,
    user: userResponse,
  };
};

const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new Error("Refresh token is required");
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }

  const user = await User.findById(decoded.id).select("+refreshToken");

  if (!user || user.refreshToken !== refreshToken || user.isActive === false) {
    throw new Error("Invalid refresh token");
  }

  const newAccessToken = generateToken(user);
  const newRefreshToken = generateRefreshToken(user);

  user.refreshToken = newRefreshToken;
  await user.save();

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

const logout = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

/**
 * Logged-in password change. Clearing the refresh token signs out every
 * other session once its short-lived access token expires; the caller gets
 * fresh tokens so this session carries on.
 */
const changePassword = async (userId, { currentPassword, newPassword } = {}) => {
  if (!currentPassword || !newPassword) {
    throw new Error("Enter your current and new password");
  }
  if (String(newPassword).length < 6) {
    throw new Error("New password must be at least 6 characters");
  }
  if (currentPassword === newPassword) {
    throw new Error("New password must be different from the current one");
  }

  const user = await User.findById(userId).select("+password");
  if (!user) throw new Error("User not found");

  if (!(await user.comparePassword(currentPassword))) {
    throw new Error("Current password is incorrect");
  }

  user.password = newPassword; // hashed by the pre-save hook
  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);
  user.refreshToken = refreshToken;
  await user.save();

  return { token, refreshToken };
};

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  changePassword,
};