const Service = require("../models/Service");
const ProviderProfile = require("../models/ProviderProfile");

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

  return await Service.findById(service._id)
    .populate("category", "name")
    .populate("provider", "bio experience");
};

const getAllServices = async (query) => {
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

  const total = await Service.countDocuments(filter);

  const services = await Service.find(filter)
    .populate("category", "name")
    .populate({
      path: "provider",
      populate: {
        path: "user",
        select: "firstName lastName email phone",
      },
    })
    .sort(sort)
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  return {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / Number(limit)),
    data: services,
  };
};

const getServiceById = async (id) => {
  const service = await Service.findById(id)
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
  updateService,
  deleteService,
  uploadServiceImages,
  uploadPortfolioImages,
};