require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");
const connectDB = require("../config/db");

const seedAdmin = async () => {
  try {
    await connectDB();

    const existingAdmin = await User.findOne({
      email: "admin@servicemarketplace.com",
    });

    if (existingAdmin) {
      console.log("✅ Admin already exists");
      process.exit();
    }

    await User.create({
      firstName: "System",
      lastName: "Administrator",
      email: "admin@servicemarketplace.com",
      phone: "0700000000",
      password: "Admin@123",
      role: "admin",
      isEmailVerified: true,
      isPhoneVerified: true,
    });

    console.log("✅ Admin account created successfully");

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedAdmin();