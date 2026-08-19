const ProviderProfile = require("../models/ProviderProfile");

const createProfile = async (userId, profileData) => {
  const existingProfile = await ProviderProfile.findOne({
    user: userId,
  });

  if (existingProfile) {
    throw new Error("Provider profile already exists");
  }

  const profile = await ProviderProfile.create({
    ...profileData,
    user: userId,
  });

  return profile;
};

const getMyProfile = async (userId) => {
  const profile = await ProviderProfile.findOne({
    user: userId,
  })
    .populate("user", "firstName lastName email phone")
    .populate("categories", "name");

  if (!profile) {
    throw new Error("Provider profile not found");
  }

  return profile;
};

const updateProfile = async (userId, profileData) => {
  const profile = await ProviderProfile.findOneAndUpdate(
    { user: userId },
    profileData,
    {
      new: true,
      runValidators: true,
    }
  )
    .populate("user", "firstName lastName email phone")
    .populate("categories", "name");

  if (!profile) {
    throw new Error("Provider profile not found");
  }

  return profile;
};

const uploadProfileImage = async (userId, imageUrl) => {
  const profile = await ProviderProfile.findOneAndUpdate(
    { user: userId },
    { profileImage: imageUrl },
    {
      new: true,
    }
  );

  if (!profile) {
    throw new Error("Provider profile not found");
  }

  return profile;
};

const getAllProviders = async (query) => {
  const { search, category, location, rating, page = 1, limit = 10 } = query;

  const filter = { isVerified: true, isAvailable: true };

  if (category) filter.categories = category;
  if (location) {
    filter.$or = [
      { 'workingArea.city': { $regex: location, $options: 'i' } },
      { 'workingArea.district': { $regex: location, $options: 'i' } },
    ];
  }
  if (rating) filter.averageRating = { $gte: Number(rating) };

  const total = await ProviderProfile.countDocuments(filter);

  let providers = await ProviderProfile.find(filter)
    .populate('user', 'firstName lastName email phone')
    .populate('categories', 'name')
    .sort('-averageRating')
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  if (search) {
    const regex = new RegExp(search, 'i');
    providers = providers.filter(
      (p) => regex.test(p.bio) || regex.test(`${p.user.firstName} ${p.user.lastName}`)
    );
  }

  return {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / Number(limit)),
    data: providers,
  };
};

const getProviderById = async (id) => {
  const provider = await ProviderProfile.findById(id)
    .populate('user', 'firstName lastName email phone')
    .populate('categories', 'name');

  if (!provider) throw new Error('Provider not found');
  return provider;
};

const getPendingProviders = async () => {
  return await ProviderProfile.find({ verificationStatus: "pending" })
    .populate("user", "firstName lastName email phone")
    .populate("categories", "name")
    .sort("-createdAt");
};

const updateVerificationStatus = async (providerId, status) => {
  if (!["approved", "rejected"].includes(status)) {
    throw new Error("Invalid verification status");
  }

  const profile = await ProviderProfile.findByIdAndUpdate(
    providerId,
    {
      verificationStatus: status,
      isVerified: status === "approved",
    },
    { new: true }
  ).populate("user", "firstName lastName email phone");

  if (!profile) {
    throw new Error("Provider not found");
  }

  return profile;
};

const uploadNicImages = async (userId, { nicFrontImage, nicBackImage }) => {
  const update = {};
  if (nicFrontImage) update.nicFrontImage = nicFrontImage;
  if (nicBackImage) update.nicBackImage = nicBackImage;

  const profile = await ProviderProfile.findOneAndUpdate(
    { user: userId },
    update,
    { new: true }
  );

  if (!profile) {
    throw new Error("Provider profile not found");
  }

  return profile;
};

module.exports = {
  createProfile,
  getMyProfile,
  updateProfile,
  uploadProfileImage,
  getPendingProviders,
  updateVerificationStatus,
  getAllProviders,
  getProviderById,
  uploadNicImages,
};