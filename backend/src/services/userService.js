const User = require("../models/User");

const updateProfile = async (userId, data) => {
  const { firstName, lastName, phone, preferredLocation, location } = data;
  const update = {};

  if (firstName !== undefined) update.firstName = firstName;
  if (lastName !== undefined) update.lastName = lastName;
  if (phone !== undefined) update.phone = phone;

  const locationData = preferredLocation || location;
  if (locationData && typeof locationData === "object") {
    const current = (await User.findById(userId).select("preferredLocation").lean())?.preferredLocation || {};
    update.preferredLocation = {
      city: locationData.city !== undefined ? locationData.city : current.city || "",
      district: locationData.district !== undefined ? locationData.district : current.district || "",
      country: locationData.country !== undefined ? locationData.country : current.country || "Sri Lanka",
    };
  }

  const user = await User.findByIdAndUpdate(
    userId,
    update,
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

const getAllUsers = async (query) => {
  const { role, search, page = 1, limit = 20 } = query;

  const filter = {};
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const total = await User.countDocuments(filter);

  const users = await User.find(filter)
    .select("-password -refreshToken")
    .sort("-createdAt")
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  return {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / Number(limit)),
    data: users,
  };
};

const updateUserStatus = async (userId, isActive) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { isActive },
    { new: true }
  ).select("-password -refreshToken");

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

module.exports = { updateProfile, getAllUsers, updateUserStatus };