const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: 50,
    },

    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: 50,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },

    role: {
      type: String,
      enum: ["customer", "provider", "admin"],
      default: "customer",
    },

    profileImage: {
      type: String,
      default: "",
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    isPhoneVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    refreshToken: {
      type: String,
      default: null,
      select: false,
    },

    // Addresses the customer books to. Kept on the user rather than copied
    // into every Booking so "Home" can be corrected once and the label is
    // reusable at checkout; the Booking still snapshots the address text at
    // the time of booking, since a later edit here must not silently change
    // where a provider was told to go.
    addresses: [
      {
        label: { type: String, trim: true, default: "Home" },
        addressLine: { type: String, trim: true, required: true },
        city: { type: String, trim: true, default: "" },
        isDefault: { type: Boolean, default: false },
      },
    ],

    // Customer's saved location, used to prioritize search results from
    // their own city/country. Optional — guests and users who haven't set
    // this yet just get unranked results.
    // NOTE: deliberately not named "location" — this database already has a
    // 2dsphere geo index on that field name from earlier map-related work,
    // and colliding with it makes every save() fail with "Can't extract geo
    // keys". Keep this name distinct from any GeoJSON coordinate field.
    preferredLocation: {
      city: {
        type: String,
        default: "",
        trim: true,
      },
      district: {
        type: String,
        default: "",
        trim: true,
      },
      country: {
        type: String,
        default: "Sri Lanka",
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  }
);
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);