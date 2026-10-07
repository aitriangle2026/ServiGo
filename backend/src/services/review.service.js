const Review = require("../models/Review");
const Booking = require("../models/Booking");
const ProviderProfile = require("../models/ProviderProfile");
const notificationService = require("./notification.service");

const createReview = async (userId, reviewData) => {
  const {
    booking,
    rating,
    review
  } = reviewData;

  // Find booking
  const bookingData = await Booking.findById(booking);

  if (!bookingData) {
    throw new Error("Booking not found");
  }

  // Only the customer can review
  if (bookingData.customer.toString() !== userId.toString()) {
    throw new Error("You can only review your own bookings");
  }

  // Booking must be completed
  if (bookingData.status !== "completed") {
    throw new Error("Booking is not completed");
  }

  // Prevent duplicate review
  const existingReview = await Review.findOne({
    booking,
    customer: userId,
  });

  if (existingReview) {
    throw new Error("You have already reviewed this booking");
  }

  // Create review
  const newReview = await Review.create({
    customer: userId,
    provider: bookingData.provider,
    service: bookingData.service,
    booking,
    rating,
    review,
  });

  // -----------------------------
  // Update provider average rating
  // -----------------------------

  const reviews = await Review.find({
    provider: bookingData.provider,
  });

  const totalReviews = reviews.length;

  const averageRating =
    reviews.reduce((sum, item) => sum + item.rating, 0) / totalReviews;

  await ProviderProfile.findByIdAndUpdate(
  bookingData.provider,
  {
    averageRating,
    totalReviews,
  }
);

// Update service average rating too
  const Service = require("../models/Service");
  const serviceReviews = await Review.find({
    service: bookingData.service,
  });

  const serviceTotalReviews = serviceReviews.length;
  const serviceAverageRating =
    serviceReviews.reduce((sum, item) => sum + item.rating, 0) / serviceTotalReviews;

  await Service.findByIdAndUpdate(bookingData.service, {
    averageRating: serviceAverageRating,
    totalReviews: serviceTotalReviews,
  });

// Get provider profile to retrieve the associated User ID
const provider = await ProviderProfile.findById(bookingData.provider);

// Get service title for notification message
const service = await Booking.findById(booking)
  .populate("service", "title");

const reviewedServiceTitle = service?.service?.title || "your service";

await Promise.all([
  notificationService.createNotification({
    user: provider.user,
    type: "review_received",
    audience: "provider",
    message: `Your service "${reviewedServiceTitle}" received a new ${rating}-star review.`,
    referenceId: newReview._id,
  }),
  notificationService.createNotification({
    user: userId,
    type: "review_submitted",
    audience: "customer",
    message: `Thanks — your review for "${reviewedServiceTitle}" was submitted.`,
    referenceId: newReview._id,
  }),
  notificationService.notifyAdmins({
    type: "new_review",
    message: `A customer left a ${rating}-star review on "${reviewedServiceTitle}".`,
    referenceId: newReview._id,
  }),
]);

return await Review.findById(newReview._id)
  .populate("customer", "firstName lastName")
  .populate("service", "title")
  .populate("provider", "bio averageRating");
};



const getProviderReviews = async (providerId) => {
  return await Review.find({
    provider: providerId,
  })
    .populate("customer", "firstName lastName profileImage")
    .populate("service", "title")
    .sort("-createdAt");
};

const getServiceReviews = async (serviceId) => {
  return await Review.find({
    service: serviceId,
  })
    .populate("customer", "firstName lastName profileImage")
    .populate("provider", "bio averageRating")
    .sort("-createdAt");
};

const updateReview = async (reviewId, userId, reviewData) => {
  const review = await Review.findOne({
    _id: reviewId,
    customer: userId,
  });

  if (!review) {
    throw new Error("Review not found");
  }

  review.rating = reviewData.rating;
  review.review = reviewData.review;

  await review.save();

  // Recalculate provider rating
  const reviews = await Review.find({
    provider: review.provider,
  });

  const totalReviews = reviews.length;

  const averageRating =
    reviews.reduce((sum, item) => sum + item.rating, 0) / totalReviews;

  await ProviderProfile.findByIdAndUpdate(review.provider, {
    averageRating,
    totalReviews,
  });

  const Service = require("../models/Service");
  const serviceReviews = await Review.find({ service: review.service });
  const serviceTotalReviews = serviceReviews.length;
  const serviceAverageRating =
    serviceReviews.reduce((sum, item) => sum + item.rating, 0) / serviceTotalReviews;

  await Service.findByIdAndUpdate(review.service, {
    averageRating: serviceAverageRating,
    totalReviews: serviceTotalReviews,
  });

  return await Review.findById(review._id)
    .populate("customer", "firstName lastName")
    .populate("service", "title");
};

const deleteReview = async (reviewId, userId) => {
  const review = await Review.findOne({
    _id: reviewId,
    customer: userId,
  });

  if (!review) {
    throw new Error("Review not found");
  }

  const providerId = review.provider;
  const serviceId = review.service;

  await review.deleteOne();

  // Recalculate provider rating
  const reviews = await Review.find({
    provider: providerId,
  });

  const totalReviews = reviews.length;

  const averageRating =
    totalReviews === 0
      ? 0
      : reviews.reduce((sum, item) => sum + item.rating, 0) / totalReviews;

  await ProviderProfile.findByIdAndUpdate(providerId, {
    averageRating,
    totalReviews,
  });

  const Service = require("../models/Service");
  const serviceReviews = await Review.find({ service: serviceId });
  const serviceTotalReviews = serviceReviews.length;
  const serviceAverageRating =
    serviceTotalReviews === 0
      ? 0
      : serviceReviews.reduce((sum, item) => sum + item.rating, 0) / serviceTotalReviews;

  await Service.findByIdAndUpdate(serviceId, {
    averageRating: serviceAverageRating,
    totalReviews: serviceTotalReviews,
  });

  return;
};

module.exports = {
  createReview,
  getProviderReviews,
  getServiceReviews,
  updateReview,
  deleteReview,
};