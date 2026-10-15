const Booking = require("../models/Booking");
const Service = require("../models/Service");
const ProviderProfile = require("../models/ProviderProfile");
const notificationService = require("./notification.service");

/**
 * Builds the display reference: SG + YYYYMMDD + a 3-digit sequence counting
 * that day's bookings. Read aloud easily and sortable by eye.
 */
const buildReference = async () => {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");

  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayCount = await Booking.countDocuments({ createdAt: { $gte: dayStart } });

  return `SG${stamp}${String(todayCount + 1).padStart(3, "0")}`;
};

// Reads nicely inside a notification message ("on_the_way" -> "on the way").
const humanizeStatus = (status) => status.replace(/_/g, " ");


const createBooking = async (customerId, bookingData) => {
  const service = await Service.findById(bookingData.service);

  if (!service) {
    throw new Error("Service not found");
  }

  // Inactive services are hidden from search, but the listing URL still
  // works — so the check has to live here too.
  if (service.isActive === false) {
    throw new Error("This service isn't taking bookings right now");
  }

  const booking = await Booking.create({
    reference: await buildReference(),
    customer: customerId,
    provider: service.provider,
    service: service._id,
    bookingDate: bookingData.bookingDate,
    bookingTime: bookingData.bookingTime,
    address: bookingData.address,
    notes: bookingData.notes,
    // Only "cash" is actually offered in the UI; anything else falls back
    // rather than letting an unvalidated value through.
    paymentMethod: bookingData.paymentMethod === "card" ? "card" : "cash",
    totalPrice: service.price,
  });

  const provider = await ProviderProfile.findById(service.provider);

  // One event, three audiences: the customer gets an acknowledgement, the
  // provider gets the actionable request, and admins get it for oversight.
  await Promise.all([
    notificationService.createNotification({
      user: customerId,
      type: "booking_created",
      audience: "customer",
      message: `Your booking request for "${service.title}" was sent. You'll hear back once the provider responds.`,
      referenceId: booking._id,
    }),
    notificationService.createNotification({
      user: provider.user,
      type: "booking_created",
      audience: "provider",
      message: `You received a new booking request for "${service.title}".`,
      referenceId: booking._id,
    }),
    notificationService.notifyAdmins({
      type: "booking_created",
      message: `A new booking was created for "${service.title}".`,
      referenceId: booking._id,
    }),
  ]);

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

const getProviderBookings = async (userId) => {
  const provider = await ProviderProfile.findOne({ user: userId });

  if (!provider) {
    throw new Error("Provider profile not found");
  }

  return await Booking.find({
    provider: provider._id,
  })
    .populate("customer", "firstName lastName email phone profileImage")
    .populate({
      path: "service",
      select: "title price images category",
      populate: { path: "category", select: "name" },
    })
    .sort("-createdAt");
};

// What a customer may see of the provider they booked. The profile also holds
// NIC numbers, ID scans, a selfie and bank details — none of which belong in
// a customer's booking list.
const PUBLIC_PROVIDER_FIELDS =
  "user profileImage bio tagline experience isVerified isAvailable averageRating totalReviews";

const getCustomerBookings = async (userId) => {
  return await Booking.find({
    customer: userId,
  })
    .populate({
      path: "provider",
      select: PUBLIC_PROVIDER_FIELDS,
      populate: {
        path: "user",
        select: "firstName lastName email phone profileImage",
      },
    })
    // category feeds the dashboard's "Recommended for you" and the provider's
    // trade line on My Bookings.
    .populate({
      path: "service",
      select: "title price images category",
      populate: { path: "category", select: "name" },
    })
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
    // "cancelled" is reached through cancelBooking (customer-initiated),
    // not through this provider-facing status endpoint.
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

  await notifyCustomerOfStatus(booking, status);

  return booking;
};

// Each provider-driven status change has its own headline for the customer
// (see config/notificationTypes.js), so the message is written per status
// rather than templated from the raw enum value.
const STATUS_NOTIFICATIONS = {
  accepted: {
    type: "booking_accepted",
    message: (title) => `Your booking for "${title}" was accepted by the provider.`,
  },
  rejected: {
    type: "booking_rejected",
    message: (title) => `Your booking for "${title}" was rejected by the provider.`,
  },
  on_the_way: {
    type: "booking_on_the_way",
    message: (title) => `The provider is on the way for your "${title}" booking.`,
  },
  completed: {
    type: "booking_completed",
    message: (title) => `Your "${title}" service has been marked as completed.`,
  },
};

const notifyCustomerOfStatus = async (booking, status) => {
  const serviceTitle = booking.service?.title || "your booking";
  const entry = STATUS_NOTIFICATIONS[status];

  if (!entry) {
    // Any status without a dedicated type still reaches the customer rather
    // than passing silently.
    await notificationService.createNotification({
      user: booking.customer._id,
      type: "system",
      audience: "customer",
      message: `Your booking for "${serviceTitle}" is now ${humanizeStatus(status)}.`,
      referenceId: booking._id,
    });
    return;
  }

  await notificationService.createNotification({
    user: booking.customer._id,
    type: entry.type,
    audience: "customer",
    message: entry.message(serviceTitle),
    referenceId: booking._id,
  });

  // A finished job is also the moment to ask for a review — sent as its own
  // notification so it survives in the list after the completion one is read.
  if (status === "completed") {
    await notificationService.createNotification({
      user: booking.customer._id,
      type: "review_reminder",
      audience: "customer",
      message: `How did "${serviceTitle}" go? Leave a review to help other customers.`,
      referenceId: booking._id,
    });
  }
};

/**
 * Customer-initiated cancellation. Allowed while the job hasn't started —
 * once the provider is on the way, cancelling is a conversation, not a
 * button.
 */
const cancelBooking = async (bookingId, customerId) => {
  const booking = await Booking.findOne({ _id: bookingId, customer: customerId })
    .populate("service", "title price")
    .populate("provider", "user");

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (!["pending", "accepted"].includes(booking.status)) {
    throw new Error(`Cannot cancel a booking that is already ${humanizeStatus(booking.status)}`);
  }

  booking.status = "cancelled";
  await booking.save();

  const serviceTitle = booking.service?.title || "your booking";

  await Promise.all([
    notificationService.createNotification({
      user: customerId,
      type: "booking_cancelled",
      audience: "customer",
      message: `Your booking for "${serviceTitle}" was cancelled.`,
      referenceId: booking._id,
    }),
    notificationService.createNotification({
      user: booking.provider.user,
      type: "booking_cancelled",
      audience: "provider",
      message: `The customer cancelled their booking for "${serviceTitle}".`,
      referenceId: booking._id,
    }),
    notificationService.notifyAdmins({
      type: "booking_cancelled",
      message: `A booking for "${serviceTitle}" was cancelled by the customer.`,
      referenceId: booking._id,
    }),
  ]);

  return booking;
};

/**
 * Customer moves a booking to another date/slot. Allowed on the same terms
 * as cancelling. The provider agreed to the old time, not the new one, so an
 * accepted booking goes back to pending for them to confirm again.
 *
 * @param {{ bookingDate: string, bookingTime: string }} change bookingDate is
 *   "YYYY-MM-DD", bookingTime one of TIME_SLOTS — same shape as createBooking.
 */
const rescheduleBooking = async (bookingId, customerId, { bookingDate, bookingTime } = {}) => {
  // Required lazily: service.service is the owner of the slot rules.
  const { getServiceAvailability, TIME_SLOTS } = require("./service.service");

  const booking = await Booking.findOne({ _id: bookingId, customer: customerId })
    .populate("service", "title")
    .populate("provider", "user");

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (!["pending", "accepted"].includes(booking.status)) {
    throw new Error(`Cannot reschedule a booking that is already ${humanizeStatus(booking.status)}`);
  }

  // Invoice-driven bookings have no service and no slot grid — their timing
  // is agreed in chat.
  if (!booking.service) {
    throw new Error("This booking was arranged over chat. Message the provider to change the time.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate || "") || !TIME_SLOTS.includes(bookingTime)) {
    throw new Error("Pick a valid date and time slot");
  }

  const today = new Date().toISOString().slice(0, 10);
  if (bookingDate < today) {
    throw new Error("Pick a date from today onwards");
  }

  const currentDate = booking.bookingDate ? booking.bookingDate.toISOString().slice(0, 10) : null;
  if (currentDate === bookingDate && booking.bookingTime === bookingTime) {
    throw new Error("Your booking is already at that time");
  }

  const { slots } = await getServiceAvailability(booking.service._id, bookingDate);
  if (!slots.find((slot) => slot.time === bookingTime)?.available) {
    throw new Error("That slot was just taken. Please pick another time.");
  }

  const wasAccepted = booking.status === "accepted";
  booking.bookingDate = bookingDate;
  booking.bookingTime = bookingTime;
  if (wasAccepted) booking.status = "pending";
  await booking.save();

  const serviceTitle = booking.service.title || "your booking";
  const when = `${new Date(bookingDate).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  })} at ${bookingTime}`;

  await Promise.all([
    notificationService.createNotification({
      user: customerId,
      type: "booking_rescheduled",
      audience: "customer",
      message: wasAccepted
        ? `"${serviceTitle}" moved to ${when}. Waiting for the provider to confirm the new time.`
        : `"${serviceTitle}" moved to ${when}.`,
      referenceId: booking._id,
    }),
    notificationService.createNotification({
      user: booking.provider.user,
      type: "booking_rescheduled",
      audience: "provider",
      message: `The customer moved "${serviceTitle}" to ${when}. Please confirm the new time.`,
      referenceId: booking._id,
    }),
  ]);

  return booking;
};

/**
 * One booking, readable by the customer who made it, the provider assigned
 * to it, or an admin. Anyone else gets "not found" rather than a 403, so the
 * endpoint can't be used to probe which booking ids exist.
 */
const getBookingById = async (bookingId, user) => {
  const booking = await Booking.findById(bookingId)
    .populate("customer", "firstName lastName email phone")
    .populate("service", "title price images portfolioImages duration category")
    .populate({
      path: "provider",
      populate: [
        { path: "user", select: "firstName lastName email phone" },
        { path: "categories", select: "name" },
      ],
    });

  if (!booking) throw new Error("Booking not found");

  const isCustomer = String(booking.customer?._id) === String(user._id);
  const isAdmin = user.role === "admin";

  let isProvider = false;
  if (user.role === "provider") {
    const profile = await ProviderProfile.findOne({ user: user._id }).select("_id");
    isProvider = profile && String(profile._id) === String(booking.provider?._id);
  }

  if (!isCustomer && !isProvider && !isAdmin) {
    throw new Error("Booking not found");
  }

  // Track record for the provider card on the confirmation screen.
  const completedJobs = await Booking.countDocuments({
    provider: booking.provider?._id,
    status: "completed",
  });

  return { ...booking.toObject(), providerStats: { completedJobs } };
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
  buildReference,
  createBooking,
  getProviderBookings,
  getCustomerBookings,
  updateBookingStatus,
  cancelBooking,
  rescheduleBooking,
  getBookingById,
  getAllBookings,
};