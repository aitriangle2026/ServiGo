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

// Only one address can be the default, so setting a new one clears the rest.
const applyDefault = (addresses, index) => {
  addresses.forEach((address, position) => {
    address.isDefault = position === index;
  });
};

const listAddresses = async (userId) => {
  const user = await User.findById(userId).select("addresses");
  if (!user) throw new Error("User not found");
  return user.addresses;
};

const addAddress = async (userId, payload) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  if (!payload?.addressLine?.trim()) {
    throw new Error("Address line is required");
  }

  user.addresses.push({
    label: payload.label?.trim() || "Home",
    addressLine: payload.addressLine.trim(),
    city: payload.city?.trim() || "",
    // The first address a customer saves becomes their default.
    isDefault: payload.isDefault === true || user.addresses.length === 0,
  });

  if (user.addresses[user.addresses.length - 1].isDefault) {
    applyDefault(user.addresses, user.addresses.length - 1);
  }

  await user.save();
  return user.addresses;
};

const updateAddress = async (userId, addressId, payload) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const index = user.addresses.findIndex((address) => String(address._id) === String(addressId));
  if (index === -1) throw new Error("Address not found");

  const address = user.addresses[index];
  if (payload.label !== undefined) address.label = payload.label.trim();
  if (payload.addressLine !== undefined) address.addressLine = payload.addressLine.trim();
  if (payload.city !== undefined) address.city = payload.city.trim();
  if (payload.isDefault === true) applyDefault(user.addresses, index);

  await user.save();
  return user.addresses;
};

const deleteAddress = async (userId, addressId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const wasDefault = user.addresses.find(
    (address) => String(address._id) === String(addressId)
  )?.isDefault;

  user.addresses = user.addresses.filter(
    (address) => String(address._id) !== String(addressId)
  );

  // Don't leave the customer with no default after removing the current one.
  if (wasDefault && user.addresses.length > 0) applyDefault(user.addresses, 0);

  await user.save();
  return user.addresses;
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

module.exports = {
  listAddresses,
  addAddress,
  updateAddress,
  deleteAddress, updateProfile, getAllUsers, updateUserStatus };