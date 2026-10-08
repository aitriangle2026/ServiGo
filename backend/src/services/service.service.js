const Service = require("../models/Service");
const Booking = require("../models/Booking");
const ProviderProfile = require("../models/ProviderProfile");
const { countryEquals, sameLocation } = require("../utils/countryFilter");
const { sortByLocationPriority } = require("../utils/locationPriority");
const notificationService = require("./notification.service");

const createService = async (userId, serviceData) => {
  const provider = await ProviderProfile.findOne({ user: userId });

  if (!provider) {
    throw new Error("Provider profile not found");
  }

  const { workDetails, duration, tags, ...rest } = serviceData;

  const service = await Service.create({
    ...rest,
    provider: provider._id,
    ...(workDetails !== undefined ? { workDetails } : {}),
    ...(duration !== undefined ? { duration } : {}),
    ...(tags !== undefined ? { tags } : {}),
  });

  await notificationService.notifyAdmins({
    type: "service_created",
    message: `A provider published a new service: "${service.title}".`,
    referenceId: service._id,
  });

  return await Service.findById(service._id)
    .populate("category", "name")
    .populate("provider", "bio experience");
};

const getAllServices = async (query, currentUser) => {
  const {
    search,
    category,
    provider,
    minPrice,
    maxPrice,
    sort = "-createdAt",
    page = 1,
    limit = 10,
  } = query;

  const filter = {
    isActive: true,
  };

  // Search by title
  if (search) {
    filter.title = {
      $regex: search,
      $options: "i",
    };
  }

  // Filter by category
  if (category) {
    filter.category = category;
  }

  // Filter by provider
  if (provider) {
    filter.provider = provider;
  }
  
  // Filter by price
  if (minPrice || maxPrice) {
    filter.price = {};

    if (minPrice) {
      filter.price.$gte = Number(minPrice);
    }

    if (maxPrice) {
      filter.price.$lte = Number(maxPrice);
    }
  }

  const customerLocation = currentUser?.role === 'customer' ? currentUser.preferredLocation : null;
  let scopedProviderIds = null;

  if (customerLocation) {
    const providerFilter = { isVerified: true, isAvailable: true };

    if (customerLocation.country) {
      providerFilter['workingArea.country'] = countryEquals(customerLocation.country);
    }

    if (customerLocation.city) {
      providerFilter.$or = [
        { 'workingArea.city': new RegExp(`^${customerLocation.city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
        { 'workingArea.city': { $in: ["", null, undefined] } },
      ];
    }

    const providerMatches = await ProviderProfile.find(providerFilter).select('_id');
    scopedProviderIds = providerMatches.map((provider) => provider._id);

    if (scopedProviderIds.length === 0) {
      return {
        page: Number(page),
        limit: Number(limit),
        total: 0,
        totalPages: 0,
        data: [],
      };
    }

    filter.provider = { $in: scopedProviderIds };
  }

  const total = await Service.countDocuments(filter);

  const pageNum = Number(page);
  const limitNum = Number(limit);

  let services;

  if (customerLocation) {
    // Re-ranking by location priority has to happen after we have the full
    // matching set in hand — Mongo's skip/limit can't express "sort by a
    // custom city/country priority tier" without rewriting this as an
    // aggregation pipeline. RANKING_FETCH_CAP keeps this from becoming an
    // unbounded query on a large catalog; revisit with $lookup-based
    // aggregation if the service count grows well past this.
    const RANKING_FETCH_CAP = 500;

    const candidates = await Service.find(filter)
      .populate("category", "name")
      .populate({
        path: "provider",
        populate: {
          path: "user",
          select: "firstName lastName email phone",
        },
      })
      .sort(sort)
      .limit(RANKING_FETCH_CAP);

    const ranked = candidates.filter((service) => sameLocation(customerLocation, service.provider?.workingArea));
    const sorted = sortByLocationPriority(
      ranked,
      customerLocation,
      (service) => service.provider?.workingArea
    );

    services = sorted.slice((pageNum - 1) * limitNum, (pageNum - 1) * limitNum + limitNum);
  } else {
    services = await Service.find(filter)
      .populate("category", "name")
      .populate({
        path: "provider",
        populate: {
          path: "user",
          select: "firstName lastName email phone",
        },
      })
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);
  }

  return {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
    data: services,
  };
};

// The slots a provider can be booked into. Kept here rather than in the UI
// so the booking endpoint and the availability check agree on what a valid
// time looks like.
const TIME_SLOTS = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
];

// A booking occupies its slot unless it was rejected or cancelled.
const BLOCKING_STATUSES = ["pending", "accepted", "on_the_way", "completed"];

const getServiceById = async (id) => {
  const service = await Service.findById(id)
    .populate("category", "name")
    .populate({
      path: "provider",
      populate: {
        path: "user",
        select: "firstName lastName email phone profileImage",
      },
    });

  if (!service) {
    throw new Error("Service not found");
  }

  // Figures the detail page shows about the provider. Counted live rather
  // than denormalised onto the profile — these change on every booking and
  // a stale "120+ completed jobs" is worse than one extra query.
  const [completedJobs, activeServices] = await Promise.all([
    Booking.countDocuments({ provider: service.provider?._id, status: "completed" }),
    Service.countDocuments({ provider: service.provider?._id, isActive: true }),
  ]);

  return {
    ...service.toObject(),
    providerStats: { completedJobs, activeServices },
  };
};

/**
 * Which of the day's slots are still free for this service's provider.
 *
 * Availability is derived from the bookings that already exist — there's no
 * separate calendar model, so a slot is "taken" when the provider has a
 * live booking at that date and time.
 *
 * @param {string} serviceId
 * @param {string} date an ISO date ("2026-08-28")
 */
const getServiceAvailability = async (serviceId, date) => {
  const service = await Service.findById(serviceId).select("provider");
  if (!service) {
    throw new Error("Service not found");
  }

  if (!date) {
    return { date: null, slots: TIME_SLOTS.map((time) => ({ time, available: true })) };
  }

  // Compare against the whole calendar day; bookingDate is stored as a Date,
  // so an exact-value match would miss anything with a time component.
  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  if (Number.isNaN(dayStart.getTime())) {
    throw new Error("Invalid date");
  }

  const booked = await Booking.find({
    provider: service.provider,
    status: { $in: BLOCKING_STATUSES },
    bookingDate: { $gte: dayStart, $lte: dayEnd },
  }).select("bookingTime");

  const takenTimes = new Set(booked.map((booking) => booking.bookingTime));

  return {
    date,
    slots: TIME_SLOTS.map((time) => ({ time, available: !takenTimes.has(time) })),
  };
};

const updateService = async (serviceId, userId, serviceData) => {
  const provider = await ProviderProfile.findOne({ user: userId });

  if (!provider) {
    throw new Error("Provider profile not found");
  }

  const { workDetails, duration, tags, ...rest } = serviceData;
  const updateData = { ...rest };

  if (workDetails !== undefined) {
    updateData.workDetails = workDetails;
  }

  if (duration !== undefined) {
    updateData.duration = duration;
  }

  if (tags !== undefined) {
    updateData.tags = tags;
  }

  const service = await Service.findOneAndUpdate(
    {
      _id: serviceId,
      provider: provider._id,
    },
    updateData,
    {
      returnDocument: "after",
    }
  )
    .populate("category", "name")
    .populate({
      path: "provider",
      populate: {
        path: "user",
        select: "firstName lastName email phone",
      },
    });

  if (!service) {
    throw new Error("Service not found");
  }

  return service;
};

const deleteService = async (serviceId, userId) => {
  const provider = await ProviderProfile.findOne({ user: userId });

  if (!provider) {
    throw new Error("Provider profile not found");
  }

  const service = await Service.findOneAndDelete({
    _id: serviceId,
    provider: provider._id,
  });

  if (!service) {
    throw new Error("Service not found");
  }

  return service;
};

const uploadServiceImages = async (serviceId, userId, imageUrls) => {
  const provider = await ProviderProfile.findOne({ user: userId });

  if (!provider) {
    throw new Error("Provider profile not found");
  }

  const service = await Service.findOneAndUpdate(
    {
      _id: serviceId,
      provider: provider._id,
    },
    {
      $push: {
        images: { $each: imageUrls },
      },
    },
    {
      returnDocument: "after",
    }
  );

  if (!service) {
    throw new Error("Service not found");
  }

  return service;
};

const uploadPortfolioImages = async (serviceId, userId, imageUrls) => {
  const provider = await ProviderProfile.findOne({ user: userId });

  if (!provider) {
    throw new Error("Provider profile not found");
  }

  const service = await Service.findOneAndUpdate(
    {
      _id: serviceId,
      provider: provider._id,
    },
    {
      $push: {
        portfolioImages: { $each: imageUrls },
      },
    },
    {
      returnDocument: "after",
    }
  );

  if (!service) {
    throw new Error("Service not found");
  }

  return service;
};

module.exports = {
  createService,
  getAllServices,
  getServiceById,
  getServiceAvailability,
  TIME_SLOTS,
  updateService,
  deleteService,
  uploadServiceImages,
  uploadPortfolioImages,
};