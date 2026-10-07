const User = require("../models/User");
const userService = require("../services/userService");

const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, preferredLocation, location } = req.body;
    const update = {};

    if (firstName !== undefined) update.firstName = firstName;
    if (lastName !== undefined) update.lastName = lastName;
    if (phone !== undefined) update.phone = phone;

    const locationData = preferredLocation || location;
    if (locationData && typeof locationData === "object") {
      const current = req.user.preferredLocation || {};
      update.preferredLocation = {
        city: locationData.city !== undefined ? locationData.city : current.city || "",
        district: locationData.district !== undefined ? locationData.district : current.district || "",
        country: locationData.country !== undefined ? locationData.country : current.country || "Sri Lanka",
      };
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      update,
      { new: true, runValidators: true }
    ).select("-password -refreshToken");

    res.status(200).json({ success: true, message: "Profile updated successfully", data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const result = await userService.getAllUsers(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const user = await userService.updateUserStatus(req.params.id, req.body.isActive);
    res.status(200).json({
      success: true,
      message: `User ${req.body.isActive ? "activated" : "suspended"} successfully`,
      data: user,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { updateProfile, getAllUsers, updateUserStatus };