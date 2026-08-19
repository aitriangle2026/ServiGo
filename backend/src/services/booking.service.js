const Booking = require("../models/Booking");
const Service = require("../models/Service");
const notificationService = require("./notification.service");


const createBooking = async (customerId, bookingData) => {
  const service = await Service.findById(bookingData.service);

  if (!service) {
    throw new Error("Service not found");
  }

  const booking = await Booking.create({
    customer: customerId,
    provider: service.provider,
    service: service._id,
    bookingDate: bookingData.bookingDate,
    bookingTime: bookingData.bookingTime,
    address: bookingData.address,
    notes: bookingData.notes,
    totalPrice: service.price,
  });

  // NEW: Find provider profile to get the User ID
  const provider = await ProviderProfile.findById(service.provider);

  // NEW: Create notification for provider
  await notificationService.createNotification({
    user: provider.user,
    title: "New Booking",
    message: `You received a new booking for "${service.title}".`,
    type: "booking",
    referenceId: booking._id,
  });

  return await Booking.findById(booking._id)
    .populate("customer", "firstName lastName email phone")
    .populate({
      path: "provider",
      populate: {
        path: "user",
        select: "firstName lastName email phone",
      },
    })
    .populate("service", "title price");
};

const ProviderProfile = require("../models/ProviderProfile");

const getProviderBookings = async (userId) => {
  const provider = await ProviderProfile.findOne({ user: userId });

  if (!provider) {
    throw new Error("Provider profile not found");
  }

  return await Booking.find({
    provider: provider._id,
  })
    .populate("customer", "firstName lastName email phone")
    .populate("service", "title price")
    .sort("-createdAt");
};

const getCustomerBookings = async (userId) => {
  return await Booking.find({
    customer: userId,
  })
    .populate({
      path: "provider",
      populate: {
        path: "user",
        select: "firstName lastName email phone",
      },
    })
    .populate("service", "title price images")
    .sort("-createdAt");
};

const updateBookingStatus = async (bookingId, userId, status) => {
  const provider = await ProviderProfile.findOne({ user: userId });

  if (!provider) {
    throw new Error("Provider profile not found");
  }

  const booking = await Booking.findOne({
    _id: bookingId,
    provider: provider._id,
  })
    .populate("customer", "firstName lastName email phone")
    .populate("service", "title price");

  if (!booking) {
    throw new Error("Booking not found");
  }

  const allowedTransitions = {
    pending: ["accepted", "rejected"],
    accepted: ["on_the_way"],
    on_the_way: ["completed"],
    completed: [],
    rejected: [],
    cancelled: [],
  };

  if (!allowedTransitions[booking.status].includes(status)) {
    throw new Error(
      `Cannot change booking status from '${booking.status}' to '${status}'`
    );
  }

  booking.status = status;

  await booking.save();

  await notificationService.createNotification({
  user: booking.customer._id,
  title: "Booking Status Updated",
  message: `Your booking for "${booking.service.title}" has been ${status.replace(/_/g, " ")}.`,
  type: "booking_status",
  referenceId: booking._id,
});

  return booking;
};

const getAllBookings = async (query) => {
  const { status, page = 1, limit = 20 } = query;

  const filter = {};
  if (status) filter.status = status;

  const total = await Booking.countDocuments(filter);

  const bookings = await Booking.find(filter)
    .populate("customer", "firstName lastName email phone")
    .populate({
      path: "provider",
      populate: { path: "user", select: "firstName lastName email phone" },
    })
    .populate("service", "title price")
    .sort("-createdAt")
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  return {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / Number(limit)),
    data: bookings,
  };
};

module.exports = {
  createBooking,
  getProviderBookings,
  getCustomerBookings,
  updateBookingStatus,
  getAllBookings,
};