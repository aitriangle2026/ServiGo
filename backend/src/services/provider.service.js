const ProviderProfile = require("../models/ProviderProfile");
const Service = require("../models/Service");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const User = require("../models/User");
const { sortByLocationPriority } = require("../utils/locationPriority");
const { countryEquals, sameLocation } = require("../utils/countryFilter");
const { calculateVerificationScore, PASS_THRESHOLD } = require("../utils/verificationScore");
const notificationService = require("./notification.service");

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

const getAllProviders = async (query, currentUser) => {
  const { search, category, location, rating, page = 1, limit = 10 } = query;

  const filter = { isVerified: true, isAvailable: true };
  const customerLocation = currentUser?.role === 'customer' ? currentUser.preferredLocation : null;

  if (customerLocation?.country) {
    filter['workingArea.country'] = countryEquals(customerLocation.country);
  }

  if (customerLocation?.city) {
    filter.$or = [
      { 'workingArea.city': new RegExp(`^${customerLocation.city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      { 'workingArea.city': { $in: ["", null, undefined] } },
    ];
  }

  if (category) filter.categories = category;
  if (location) {
    filter.$or = [
      { 'workingArea.city': { $regex: location, $options: 'i' } },
      { 'workingArea.district': { $regex: location, $options: 'i' } },
    ];
  }
  if (rating) filter.averageRating = { $gte: Number(rating) };

  const total = await ProviderProfile.countDocuments(filter);
  const pageNum = Number(page);
  const limitNum = Number(limit);

  // Fast path: no keyword search and no saved customer location to rank by
  // — paginate at the DB level like before, nothing needs re-sorting in JS.
  if (!search && !customerLocation) {
    const providers = await ProviderProfile.find(filter)
      .populate('user', 'firstName lastName email phone')
      .populate('categories', 'name')
      .sort('-averageRating')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    return {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      data: providers,
    };
  }

  // `search` matches against fields (bio, name) that aren't indexed on the
  // ProviderProfile document itself, so it's applied in JS after fetching
  // rather than as part of the Mongo filter — same for location-priority
  // ranking. RANKING_FETCH_CAP bounds how many candidates we pull back to
  // filter/rank against, so this can't turn into an unbounded query on a
  // large catalog; revisit with a text index + aggregation if the provider
  // count grows well past this. Applying `search` before slicing (rather
  // than after, as this used to do) also fixes it silently under/over-
  // matching within a single already-paginated page.
  const RANKING_FETCH_CAP = 500;

  let candidates = await ProviderProfile.find(filter)
    .populate('user', 'firstName lastName email phone')
    .populate('categories', 'name')
    .sort('-averageRating')
    .limit(RANKING_FETCH_CAP);

  if (search) {
    const regex = new RegExp(search, 'i');
    candidates = candidates.filter(
      (p) => regex.test(p.bio) || regex.test(`${p.user.firstName} ${p.user.lastName}`)
    );
  }

  if (customerLocation) {
    candidates = candidates.filter((provider) => sameLocation(customerLocation, provider.workingArea));
    candidates = sortByLocationPriority(
      candidates,
      customerLocation,
      (provider) => provider.workingArea
    );
  }

  const providers = candidates.slice((pageNum - 1) * limitNum, (pageNum - 1) * limitNum + limitNum);

  return {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
    data: providers,
  };
};

const getProviderById = async (id) => {
  const provider = await ProviderProfile.findById(id)
    .populate('user', 'firstName lastName email phone profileImage')
    .populate('categories', 'name');

  if (!provider) throw new Error('Provider not found');

  // Everything the profile page shows about track record, gathered in one
  // round trip. Counted live rather than denormalised onto the document —
  // these change with every booking and review, and a stale "120+ jobs" is
  // worse than one extra query.
  const [services, bookingCounts, ratingBuckets] = await Promise.all([
    Service.find({ provider: provider._id, isActive: true })
      .populate('category', 'name')
      .sort('-averageRating')
      .limit(12),

    Booking.aggregate([
      { $match: { provider: provider._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    Review.aggregate([
      { $match: { provider: provider._id } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]),
  ]);

  const byStatus = Object.fromEntries(bookingCounts.map((row) => [row._id, row.count]));
  const completed = byStatus.completed || 0;
  const cancelled = (byStatus.cancelled || 0) + (byStatus.rejected || 0);
  const decided = completed + cancelled;

  // Honest proxy for reliability: of the jobs that reached an outcome, how
  // many were seen through. NOT punctuality — nothing records promised vs
  // actual arrival time, so a real "on-time rate" isn't computable yet.
  const completionRate = decided > 0 ? Math.round((completed / decided) * 100) : null;

  const totalRatings = ratingBuckets.reduce((sum, row) => sum + row.count, 0);
  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = ratingBuckets.find((row) => Math.round(row._id) === stars)?.count || 0;
    return {
      stars,
      count,
      percent: totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0,
    };
  });

  return {
    ...provider.toObject(),
    services,
    stats: {
      completedJobs: completed,
      activeBookings: (byStatus.pending || 0) + (byStatus.accepted || 0) + (byStatus.on_the_way || 0),
      completionRate,
      totalServices: services.length,
    },
    ratingDistribution,
  };
};

const getPendingProviders = async () => {
  // Highest score first — the score was snapshotted at submit time, so this
  // ordering is stable even if the rubric changes later.
  return await ProviderProfile.find({ verificationStatus: "pending" })
    .populate("user", "firstName lastName email phone")
    .populate("categories", "name")
    .sort("-verificationScore -createdAt");
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

  // The admin's decision is the provider's cue to start listing services or
  // to fix their documents — previously this flipped silently.
  await notificationService.createNotification({
    user: profile.user._id,
    type: status === "approved" ? "profile_approved" : "profile_rejected",
    audience: "provider",
    message:
      status === "approved"
        ? "Your provider profile was approved — you can now publish services and take bookings."
        : "Your verification was rejected. Review your documents and submit again.",
    referenceId: profile._id,
  });

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

// ---- Verification checklist (selfie, portfolio, certificates, payout) ---

const uploadSelfieImage = async (userId, imageUrl) => {
  const profile = await ProviderProfile.findOneAndUpdate(
    { user: userId },
    { selfieImage: imageUrl },
    { new: true }
  );
  if (!profile) throw new Error("Provider profile not found");
  return profile;
};

const MAX_PORTFOLIO_IMAGES = 10;

const addPortfolioImages = async (userId, imageUrls) => {
  const profile = await ProviderProfile.findOne({ user: userId });
  if (!profile) throw new Error("Provider profile not found");

  const combined = [...profile.portfolioImages, ...imageUrls].slice(0, MAX_PORTFOLIO_IMAGES);
  profile.portfolioImages = combined;
  await profile.save();
  return profile;
};

const removePortfolioImage = async (userId, imageUrl) => {
  const profile = await ProviderProfile.findOneAndUpdate(
    { user: userId },
    { $pull: { portfolioImages: imageUrl } },
    { new: true }
  );
  if (!profile) throw new Error("Provider profile not found");
  return profile;
};

const addCertificate = async (userId, { title, fileUrl }) => {
  const profile = await ProviderProfile.findOneAndUpdate(
    { user: userId },
    { $push: { certificates: { title, fileUrl } } },
    { new: true }
  );
  if (!profile) throw new Error("Provider profile not found");
  return profile;
};

const removeCertificate = async (userId, certificateId) => {
  const profile = await ProviderProfile.findOneAndUpdate(
    { user: userId },
    { $pull: { certificates: { _id: certificateId } } },
    { new: true }
  );
  if (!profile) throw new Error("Provider profile not found");
  return profile;
};

// Merged onto the existing subdocument rather than replaced outright, same
// reasoning as workingArea elsewhere — a partial update here must not wipe
// fields the provider already filled in.
const updatePayoutDetails = async (userId, payoutDetails) => {
  const profile = await ProviderProfile.findOne({ user: userId });
  if (!profile) throw new Error("Provider profile not found");

  profile.payoutDetails = {
    bankName: payoutDetails.bankName ?? profile.payoutDetails?.bankName ?? "",
    accountNumber: payoutDetails.accountNumber ?? profile.payoutDetails?.accountNumber ?? "",
    accountHolderName: payoutDetails.accountHolderName ?? profile.payoutDetails?.accountHolderName ?? "",
    branch: payoutDetails.branch ?? profile.payoutDetails?.branch ?? "",
  };
  await profile.save();
  return profile;
};

const getVerificationScore = async (userId) => {
  const profile = await ProviderProfile.findOne({ user: userId }).populate("categories", "name");
  if (!profile) throw new Error("Provider profile not found");

  const user = await User.findById(userId).select("isEmailVerified isPhoneVerified");
  return { profile, score: calculateVerificationScore(profile, user) };
};

const submitForReview = async (userId) => {
  const profile = await ProviderProfile.findOne({ user: userId });
  if (!profile) throw new Error("Provider profile not found");

  if (!["draft", "rejected"].includes(profile.verificationStatus)) {
    throw new Error(`This profile is already ${profile.verificationStatus}`);
  }

  const user = await User.findById(userId).select("isEmailVerified isPhoneVerified");
  const { total } = calculateVerificationScore(profile, user);

  profile.verificationScore = total;
  profile.verificationStatus = "pending";
  profile.verificationSubmittedAt = new Date();
  await profile.save();

  await notificationService.notifyAdmins({
    type: "provider_verification",
    message: `A provider submitted their verification checklist — score ${total}/100.`,
    referenceId: profile._id,
  });

  return { profile, score: total, passed: total >= PASS_THRESHOLD };
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
  uploadSelfieImage,
  addPortfolioImages,
  removePortfolioImage,
  addCertificate,
  removeCertificate,
  updatePayoutDetails,
  getVerificationScore,
  submitForReview,
};