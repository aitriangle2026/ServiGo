const JobRequest = require("../models/JobRequest");
const Proposal = require("../models/Proposal");
const ProviderProfile = require("../models/ProviderProfile");
const Booking = require("../models/Booking");
const { countryEquals } = require("../utils/countryFilter");
const notificationService = require("./notification.service");
const { buildReference } = require("./booking.service");

// The Job Request → Proposal → Booking pipeline.
//
//   provider sends a quote (Proposal, pending)
//   customer accepts one  → Booking created, request "awarded",
//                           every other pending quote rejected
//   customer declines one → that quote rejected
//   provider withdraws    → quote withdrawn (they may quote again)
//
// A provider can also mark a request "Not interested" (JobRequest.dismissedBy),
// which hides it for them alone.

const POPULATE_CATEGORY = { path: "category", select: "name" };
const POPULATE_CUSTOMER = { path: "customer", select: "firstName lastName phone profileImage" };
const PUBLIC_PROVIDER = "user profileImage bio experience categories isVerified averageRating totalReviews";

const getProviderProfile = async (userId) => {
  const provider = await ProviderProfile.findOne({ user: userId }).select("categories workingArea user");
  if (!provider) throw new Error("Provider profile not found");
  return provider;
};

const isEligible = (provider, jobRequest) =>
  provider.categories.some((c) => String(c) === String(jobRequest.category?._id || jobRequest.category)) &&
  countryEquals(provider.workingArea?.country || "Sri Lanka").test(jobRequest.location?.country || "");

/**
 * Where a request stands for this provider — drives the Service Requests tabs.
 *   new       open, not dismissed, no live quote from me
 *   quoted    my quote is waiting on the customer
 *   converted my quote was accepted (a booking exists)
 *   declined  I passed on it, my quote was turned down, or it closed without me
 */
const stageFor = (jobRequest, proposal, dismissed) => {
  if (proposal?.status === "accepted") return "converted";
  if (proposal?.status === "pending" && jobRequest.status === "open") return "quoted";
  if (jobRequest.status === "open" && !dismissed && (!proposal || proposal.status === "withdrawn")) return "new";
  return "declined";
};

/** Every request this provider can act on or has acted on, each with its stage. */
const getProviderPipeline = async (userId) => {
  const provider = await getProviderProfile(userId);

  const myProposals = await Proposal.find({ provider: provider._id }).sort("-createdAt").lean();
  const latestByRequest = new Map();
  myProposals.forEach((p) => {
    if (!latestByRequest.has(String(p.jobRequest))) latestByRequest.set(String(p.jobRequest), p);
  });

  const requests = await JobRequest.find({
    $or: [
      {
        status: "open",
        category: { $in: provider.categories },
        "location.country": countryEquals(provider.workingArea?.country || "Sri Lanka"),
      },
      { _id: { $in: [...latestByRequest.keys()] } },
    ],
  })
    .populate(POPULATE_CATEGORY)
    .populate(POPULATE_CUSTOMER)
    .sort("-createdAt")
    .lean();

  const counts = await Proposal.aggregate([
    { $match: { jobRequest: { $in: requests.map((r) => r._id) }, status: { $ne: "withdrawn" } } },
    { $group: { _id: "$jobRequest", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

  return {
    providerCity: provider.workingArea?.city || "",
    data: requests.map((request) => {
      const proposal = latestByRequest.get(String(request._id)) || null;
      const dismissed = (request.dismissedBy || []).some((id) => String(id) === String(provider._id));
      const { dismissedBy, ...rest } = request; // other providers' choices aren't this provider's business
      return {
        ...rest,
        proposalCount: countMap.get(String(request._id)) || 0,
        myProposal: proposal,
        dismissed,
        stage: stageFor(request, proposal, dismissed),
      };
    }),
  };
};

/** Send a quote, or edit the one already waiting on the customer. */
const submitProposal = async (userId, jobRequestId, { amount, message, proposedDate, proposedTime } = {}) => {
  const provider = await getProviderProfile(userId);
  const jobRequest = await JobRequest.findById(jobRequestId).populate(POPULATE_CATEGORY);
  if (!jobRequest) throw new Error("Job request not found");
  if (jobRequest.status !== "open") throw new Error("This request is no longer taking quotes");
  if (!isEligible(provider, jobRequest)) throw new Error("This request isn't in a category or country you work in");

  const price = Number(amount);
  if (!Number.isFinite(price) || price <= 0) throw new Error("Enter a price for the job");
  if (proposedDate && Number.isNaN(new Date(proposedDate).getTime())) throw new Error("Enter a valid date");

  const fields = {
    amount: price,
    message: (message || "").trim().slice(0, 1000),
    proposedDate: proposedDate || null,
    proposedTime: (proposedTime || "").trim(),
  };

  let proposal = await Proposal.findOne({ jobRequest: jobRequest._id, provider: provider._id, status: "pending" });
  const isEdit = Boolean(proposal);
  if (proposal) {
    Object.assign(proposal, fields);
    await proposal.save();
  } else {
    proposal = await Proposal.create({ jobRequest: jobRequest._id, provider: provider._id, ...fields });
  }

  // Quoting is the opposite of "not interested".
  await JobRequest.updateOne({ _id: jobRequest._id }, { $pull: { dismissedBy: provider._id } });

  await notificationService.createNotification({
    user: jobRequest.customer,
    type: "job_request",
    audience: "customer",
    title: isEdit ? "Quote updated" : "New quote received",
    message: `A professional ${isEdit ? "updated their" : "sent you a"} quote of LKR ${price.toLocaleString("en-LK")} for your ${
      jobRequest.category?.name || "job"
    } request.`,
    referenceId: jobRequest._id,
  });

  return proposal;
};

const withdrawProposal = async (userId, proposalId) => {
  const provider = await getProviderProfile(userId);
  const proposal = await Proposal.findOne({ _id: proposalId, provider: provider._id });
  if (!proposal) throw new Error("Quote not found");
  if (proposal.status !== "pending") throw new Error(`This quote is already ${proposal.status}`);
  proposal.status = "withdrawn";
  proposal.respondedAt = new Date();
  await proposal.save();
  return proposal;
};

const setDismissed = async (userId, jobRequestId, dismissed) => {
  const provider = await getProviderProfile(userId);
  const jobRequest = await JobRequest.findById(jobRequestId).select("_id");
  if (!jobRequest) throw new Error("Job request not found");
  await JobRequest.updateOne(
    { _id: jobRequestId },
    dismissed ? { $addToSet: { dismissedBy: provider._id } } : { $pull: { dismissedBy: provider._id } }
  );
  return { dismissed };
};

/** The quotes on one of the customer's own requests, best-rated first among equals. */
const listForCustomer = async (customerId, jobRequestId) => {
  const jobRequest = await JobRequest.findOne({ _id: jobRequestId, customer: customerId }).select("_id");
  if (!jobRequest) throw new Error("Job request not found");

  const proposals = await Proposal.find({ jobRequest: jobRequestId, status: { $ne: "withdrawn" } })
    .populate({
      path: "provider",
      select: PUBLIC_PROVIDER,
      populate: [
        { path: "user", select: "firstName lastName profileImage" },
        { path: "categories", select: "name" },
      ],
    })
    .sort("-createdAt")
    .lean();

  const completed = await Booking.aggregate([
    { $match: { provider: { $in: proposals.map((p) => p.provider?._id).filter(Boolean) }, status: "completed" } },
    { $group: { _id: "$provider", count: { $sum: 1 } } },
  ]);
  const completedMap = new Map(completed.map((c) => [String(c._id), c.count]));

  return proposals.map((p) => ({
    ...p,
    provider: p.provider ? { ...p.provider, completedJobs: completedMap.get(String(p.provider._id)) || 0 } : null,
  }));
};

const loadForCustomer = async (customerId, proposalId) => {
  const proposal = await Proposal.findById(proposalId).populate("provider", "user");
  if (!proposal) throw new Error("Quote not found");
  const jobRequest = await JobRequest.findOne({ _id: proposal.jobRequest, customer: customerId }).populate(POPULATE_CATEGORY);
  if (!jobRequest) throw new Error("Quote not found");
  return { proposal, jobRequest };
};

/**
 * Customer picks a quote. Creates the booking straight away as "accepted" —
 * the provider already committed to the price and time by quoting.
 */
const acceptProposal = async (customerId, proposalId) => {
  const { proposal, jobRequest } = await loadForCustomer(customerId, proposalId);
  if (proposal.status !== "pending") throw new Error(`This quote is already ${proposal.status}`);
  if (jobRequest.status !== "open") throw new Error(`This request is already ${jobRequest.status}`);

  // Claim the request first, so two quotes accepted at the same moment can't
  // both become bookings.
  const claimed = await JobRequest.findOneAndUpdate(
    { _id: jobRequest._id, status: "open" },
    { status: "awarded" },
    { new: true }
  );
  if (!claimed) throw new Error("This request was just closed");

  const booking = await Booking.create({
    reference: await buildReference(),
    customer: customerId,
    provider: proposal.provider._id,
    service: null,
    bookingDate: proposal.proposedDate || jobRequest.preferredDate || null,
    bookingTime: proposal.proposedTime || jobRequest.preferredTime || "",
    address: [jobRequest.location?.city, jobRequest.location?.district].filter(Boolean).join(", "),
    notes: jobRequest.description,
    totalPrice: proposal.amount,
    paymentMethod: "cash",
    status: "accepted",
  });

  claimed.awardedBooking = booking._id;
  await claimed.save();

  proposal.status = "accepted";
  proposal.respondedAt = new Date();
  await proposal.save();

  const others = await Proposal.find({ jobRequest: jobRequest._id, status: "pending", _id: { $ne: proposal._id } }).populate(
    "provider",
    "user"
  );
  await Proposal.updateMany(
    { jobRequest: jobRequest._id, status: "pending", _id: { $ne: proposal._id } },
    { status: "rejected", respondedAt: new Date() }
  );

  const label = jobRequest.category?.name || "job";
  await Promise.all([
    notificationService.createNotification({
      user: proposal.provider.user,
      // booking_created is the provider-facing "new booking" type; it links
      // to this booking in their list.
      type: "booking_created",
      audience: "provider",
      title: "Your quote was accepted",
      message: `The customer accepted your LKR ${proposal.amount.toLocaleString("en-LK")} quote for their ${label} request. It's now in your bookings.`,
      referenceId: booking._id,
    }),
    ...others.map((other) =>
      notificationService.createNotification({
        user: other.provider.user,
        type: "job_request",
        audience: "provider",
        title: "Request closed",
        message: `The customer chose another professional for their ${label} request.`,
        referenceId: jobRequest._id,
      })
    ),
  ]);

  return { proposal, booking };
};

const rejectProposal = async (customerId, proposalId) => {
  const { proposal, jobRequest } = await loadForCustomer(customerId, proposalId);
  if (proposal.status !== "pending") throw new Error(`This quote is already ${proposal.status}`);
  proposal.status = "rejected";
  proposal.respondedAt = new Date();
  await proposal.save();

  await notificationService.createNotification({
    user: proposal.provider.user,
    type: "job_request",
    audience: "provider",
    title: "Quote declined",
    message: `The customer declined your quote for their ${jobRequest.category?.name || "job"} request.`,
    referenceId: jobRequest._id,
  });
  return proposal;
};

module.exports = {
  getProviderPipeline,
  submitProposal,
  withdrawProposal,
  setDismissed,
  listForCustomer,
  acceptProposal,
  rejectProposal,
};
