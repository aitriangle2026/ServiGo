const express = require("express");

const router = express.Router();

const bookingController = require("../controllers/booking.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

router.post(
  "/",
  protect,
  authorize("customer"),
  bookingController.createBooking
);

router.get(
  "/provider",
  protect,
  authorize("provider"),
  bookingController.getProviderBookings
);

router.get(
  "/customer",
  protect,
  authorize("customer"),
  bookingController.getCustomerBookings
);

router.put(
  "/:id/status",
  protect,
  authorize("provider"),
  bookingController.updateBookingStatus
);

router.get(
  "/",
  protect,
  authorize("admin"),
  bookingController.getAllBookings
);

module.exports = router;