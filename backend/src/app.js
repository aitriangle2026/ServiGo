const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const authRoutes = require("./routes/auth.routes");
const app = express();
const testRoutes = require("./routes/test.routes");
const categoryRoutes = require("./routes/category.routes");
const providerRoutes = require("./routes/provider.routes");
const serviceRoutes = require("./routes/service.routes");
const bookingRoutes = require("./routes/booking.routes");
const reviewRoutes = require("./routes/review.routes");
const favoriteRoutes = require("./routes/favorite.routes");
const notificationRoutes = require("./routes/notification.routes");
const userRoutes = require("./routes/user.routes");
const chatRoutes = require("./routes/chat.routes");
const invoiceRoutes = require("./routes/invoice.routes");
const supportRoutes = require("./routes/support.routes");
const jobRequestRoutes = require("./routes/jobRequest.routes");

// Middlewares
//
// Allowed browser origins. Local dev is always permitted; production domains
// come from CLIENT_URL in .env (comma-separated for more than one), so
// deploying to a new domain is a config change rather than a code change.
//   CLIENT_URL=https://servigo.lk,https://www.servigo.lk
const allowedOrigins = [
  "http://localhost:5173",
  ...(process.env.CLIENT_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { success: false, message: "Too many requests, please try again later." },
});

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/test", testRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/provider", providerRoutes);
app.use("/api/v1/services", serviceRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/favorites", favoriteRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/invoices", invoiceRoutes);
app.use("/api/v1/support", supportRoutes);
app.use("/api/v1/job-requests", jobRequestRoutes);
app.use("/api/v1/auth/forgot-password", otpLimiter);
app.use("/api/v1/auth/send-otp", otpLimiter);
app.use("/api/v1/auth/resend-otp", otpLimiter);

// Test Route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "🚀 Service Marketplace API is running...",
    });
});

module.exports = app;