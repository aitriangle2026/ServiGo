const User = require("../models/User");
const Booking = require("../models/Booking");
const userService = require("../services/userService");
const bookingService = require("../services/booking.service");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, preferredLocation, location, dateOfBirth, gender, bio } = req.body;
    const update = {};

    if (firstName !== undefined) update.firstName = firstName;
    if (lastName !== undefined) update.lastName = lastName;
    if (phone !== undefined) update.phone = phone;
    if (gender !== undefined) update.gender = gender;
    if (bio !== undefined) update.bio = bio;

    if (dateOfBirth !== undefined) {
      if (!dateOfBirth) {
        update.dateOfBirth = null;
      } else {
        const date = new Date(dateOfBirth);
        if (Number.isNaN(date.getTime()) || date > new Date()) {
          return res.status(400).json({ success: false, message: "Enter a valid date of birth" });
        }
        update.dateOfBirth = date;
      }
    }

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

// PUT /users/profile/photo — multipart field "image".
const updateProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Choose an image to upload" });
    }
    if (!req.file.mimetype?.startsWith("image/")) {
      return res.status(400).json({ success: false, message: "Profile photo must be an image" });
    }

    const result = await uploadToCloudinary(req.file.buffer, "servigo/profiles");
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: result.secure_url },
      { new: true }
    ).select("-password -refreshToken");

    res.status(200).json({ success: true, message: "Photo updated", data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * POST /users/me/deactivate — the customer's own "Delete Account".
 * A soft delete: open bookings are cancelled (so providers are told), the
 * account is switched off and signed out, and history stays intact for the
 * providers and reviews that reference it. Password-confirmed.
 */
const deactivateAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id).select("+password");
    if (!password || !(await user.comparePassword(password))) {
      return res.status(400).json({ success: false, message: "Password is incorrect" });
    }

    const open = await Booking.find({ customer: user._id, status: { $in: ["pending", "accepted"] } }).select("_id");
    for (const booking of open) {
      await bookingService.cancelBooking(booking._id, user._id);
    }

    user.isActive = false;
    user.refreshToken = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Account deactivated",
      data: { cancelledBookings: open.length },
    });
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

const listAddresses = async (req, res) => {
  try {
    const addresses = await userService.listAddresses(req.user._id);
    res.status(200).json({ success: true, data: addresses });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const addAddress = async (req, res) => {
  try {
    const addresses = await userService.addAddress(req.user._id, req.body);
    res.status(201).json({ success: true, message: "Address saved", data: addresses });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateAddress = async (req, res) => {
  try {
    const addresses = await userService.updateAddress(req.user._id, req.params.id, req.body);
    res.status(200).json({ success: true, message: "Address updated", data: addresses });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const addresses = await userService.deleteAddress(req.user._id, req.params.id);
    res.status(200).json({ success: true, message: "Address removed", data: addresses });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  listAddresses,
  addAddress,
  updateAddress,
  deleteAddress, updateProfile, updateProfilePhoto, deactivateAccount, getAllUsers, updateUserStatus };