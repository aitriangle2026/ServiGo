const JobRequest = require("../models/JobRequest");
const Proposal = require("../models/Proposal");
const ProviderProfile = require("../models/ProviderProfile");
const User = require("../models/User");
const { countryEquals } = require("../utils/countryFilter");
const notificationService = require("./notification.service");

const POPULATE_CATEGORY = { path: "category", select: "name icon" };
const POPULATE_CUSTOMER = { path: "customer", select: "firstName lastName email phone" };

// Attaches a `proposalCount` to each job request in one extra query rather
// than N — cheap enough at this scale, and avoids a $lookup aggregation for
// what's still a simple count.
const withProposalCounts = async (jobRequests) => {
  const ids = jobRequests.map((jr) => jr._id);
  if (ids.length === 0) return jobRequests;

  const counts = await Proposal.aggregate([
    { $match: { jobRequest: { $in: ids }, status: { $ne: "withdrawn" } } },
    { $group: { _id: "$jobRequest", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));

  return jobRequests.map((jr) => {
    const obj = jr.toObject ? jr.toObject() : jr;
    return { ...obj, proposalCount: countMap.get(jr._id.toString()) || 0 };
  });
};

const createJobRequest = async (customerId, data, attachmentUrls = []) => {
  const { category, description, city, district, country, preferredDate, preferredTime, budget } = data;

  if (!category || !description) {
    throw new Error("Category and description are required");
  }

  const customer = await User.findById(customerId).select("preferredLocation");
  const finalCountry = country || customer?.preferredLocation?.country || "Sri Lanka";

  const jobRequest = await JobRequest.create({
    customer: customerId,
    category,
    description,
    location: {
      city: city || customer?.preferredLocation?.city || "",
      district: district || customer?.preferredLocation?.district || "",
      country: finalCountry,
    },
    preferredDate: preferredDate || null,
    preferredTime: preferredTime || "",
    budget: budget !== undefined && budget !== "" ? Number(budget) : null,
    attachments: attachmentUrls,
  });

  const populatedJobRequest = await JobRequest.findById(jobRequest._id).populate(POPULATE_CATEGORY);

  // This is the piece that actually "pushes" the request out instead of
  // just leaving it for providers to stumble across on the browse page:
  // find every provider who (a) offers this exact category and (b) works
  // in this exact country — same matching rule getRelevantJobRequests
  // already uses the other way around — and notify each one. A plumbing
  // request finds every plumber in that country, nothing else changes.
  const matchingProviders = await ProviderProfile.find({
    categories: category,
    "workingArea.country": countryEquals(finalCountry),
  }).select("user");

  const locationLabel =
    populatedJobRequest.location.city ||
    populatedJobRequest.location.district ||
    populatedJobRequest.location.country;

  await Promise.all(
    matchingProviders.map((provider) =>
      notificationService.createNotification({
        user: provider.user,
        type: "job_request",
        audience: "provider",
        title: "New job request near you",
        message: `A customer posted a new ${populatedJobRequest.category?.name || "service"} job request in ${locationLabel}.`,
        referenceId: jobRequest._id,
      })
    )
  );

  // notifiedProviderIds lets the controller push the same event over
  // Socket.IO in real time (the persistent Notification above is what's
  // there if the provider is offline when this fires).
  return {
    jobRequest: populatedJobRequest,
    notifiedProviderIds: matchingProviders.map((p) => p.user),
  };
};

const getMyJobRequests = async (customerId) => {
  const jobRequests = await JobRequest.find({ customer: customerId })
    .populate(POPULATE_CATEGORY)
    .sort("-createdAt");
  return await withProposalCounts(jobRequests);
};

// Matches a provider to open job requests in their own country that fall
// under a category they actually offer — the same "must reach relevant
// providers based on country, location and category" requirement the
// client's spec calls out. Falls back to no results (rather than throwing)
// if the caller has no provider profile yet.
const getRelevantJobRequests = async (userId, query = {}) => {
  const { page = 1, limit = 10 } = query;
  const provider = await ProviderProfile.findOne({ user: userId }).select("categories workingArea");
  if (!provider) {
    return { page: 1, limit: Number(limit), total: 0, totalPages: 0, data: [] };
  }

  const filter = {
    status: "open",
    category: { $in: provider.categories },
    "location.country": countryEquals(provider.workingArea?.country || "Sri Lanka"),
  };

  const total = await JobRequest.countDocuments(filter);
  const pageNum = Number(page);
  const limitNum = Number(limit);

  const jobRequests = await JobRequest.find(filter)
    .populate(POPULATE_CATEGORY)
    .populate(POPULATE_CUSTOMER)
    .sort("-createdAt")
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

  return {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
    data: jobRequests,
  };
};

const getJobRequestById = async (id, requestingUser) => {
  const jobRequest = await JobRequest.findById(id)
    .populate(POPULATE_CATEGORY)
    .populate(POPULATE_CUSTOMER);

  if (!jobRequest) throw new Error("Job request not found");

  // Owning customer and any admin can always see it. A provider can see it
  // if it's still open (browsing) or if they've already proposed on it
  // (need to keep seeing it on "My Proposals" even after it's awarded).
  if (requestingUser.role === "admin" || jobRequest.customer._id.toString() === requestingUser._id.toString()) {
    return jobRequest;
  }

  if (requestingUser.role === "provider") {
    if (jobRequest.status === "open") return jobRequest;
    const providerProfile = await ProviderProfile.findOne({ user: requestingUser._id }).select("_id");
    const hasProposal = providerProfile
      ? await Proposal.exists({ jobRequest: jobRequest._id, provider: providerProfile._id })
      : false;
    if (hasProposal) return jobRequest;
  }

  throw new Error("You don't have access to this job request");
};

const cancelJobRequest = async (id, customerId) => {
  const jobRequest = await JobRequest.findOne({ _id: id, customer: customerId });
  if (!jobRequest) throw new Error("Job request not found");

  if (jobRequest.status !== "open") {
    throw new Error(`Cannot cancel a job request that is already ${jobRequest.status}`);
  }

  jobRequest.status = "cancelled";
  await jobRequest.save();

  // Any pending proposals against a cancelled request are dead too.
  const proposals = await Proposal.find({ jobRequest: jobRequest._id, status: "pending" });
  await Proposal.updateMany(
    { jobRequest: jobRequest._id, status: "pending" },
    { status: "rejected" }
  );

  await Promise.all(
    proposals.map(async (p) => {
      const provider = await ProviderProfile.findById(p.provider).select("user");
      if (!provider) return;
      await notificationService.createNotification({
        user: provider.user,
        type: "job_request",
        audience: "provider",
        title: "Job request cancelled",
        message: "A customer cancelled a job request you had proposed on.",
        referenceId: jobRequest._id,
      });
    })
  );

  return jobRequest;
};

// Called by proposal.service when a proposal is accepted — flips this job
// request out of "open" so it stops showing up for other providers.
const markAwarded = async (jobRequestId) => {
  await JobRequest.findByIdAndUpdate(jobRequestId, { status: "awarded" });
};

const getAllJobRequestsAdmin = async (query = {}) => {
  const { status, page = 1, limit = 20 } = query;
  const filter = {};
  if (status) filter.status = status;

  const total = await JobRequest.countDocuments(filter);
  const pageNum = Number(page);
  const limitNum = Number(limit);

  const jobRequests = await JobRequest.find(filter)
    .populate(POPULATE_CATEGORY)
    .populate(POPULATE_CUSTOMER)
    .sort("-createdAt")
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

  return {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
    data: await withProposalCounts(jobRequests),
  };
};

module.exports = {
  createJobRequest,
  getMyJobRequests,
  getRelevantJobRequests,
  getJobRequestById,
  cancelJobRequest,
  markAwarded,
  getAllJobRequestsAdmin,
};