// The single source of truth for every notification ServiGo can send.
//
// A notification's *message* is always written by the caller (it carries the
// specifics — which service, how much, whose name). Everything else about a
// type lives here: its headline, which roles may receive it, where clicking
// it takes that role, and which icon/colour family the UI should use.
//
// Keeping it in one table means the Notification model's enum, the backend
// triggers and the frontend rendering can never drift apart — the model
// derives its enum from these keys, and the service refuses to create a
// notification for a (type, audience) pair that isn't declared below.
//
// `link` is either a static path or a function of the notification's
// referenceId, so a row can deep-link to the exact booking/service/provider
// it's about. `null` means the row isn't clickable.


// Booking, invoice and review notifications all carry the id of the record
// they're about, but the app has list pages rather than a page per record.
// Passing the id through as ?highlight= lets the destination list scroll to
// and flag the exact row — real navigation driven by type + referenceId,
// without inventing detail routes that don't exist.
const highlight = (basePath) => (referenceId) =>
  referenceId ? `${basePath}?highlight=${referenceId}` : basePath;

const NOTIFICATION_TYPES = {
  // ─── Bookings ──────────────────────────────────────────────────────────
  booking_created: {
    category: "booking",
    audiences: {
      customer: { title: "Booking Request Sent", link: highlight("/customer/bookings") },
      provider: { title: "New Booking Request", link: highlight("/provider/bookings") },
      admin: { title: "New Booking Created", link: highlight("/admin/bookings") },
    },
  },

  booking_accepted: {
    category: "booking",
    audiences: {
      customer: { title: "Booking Accepted", link: highlight("/customer/bookings") },
    },
  },

  booking_rejected: {
    category: "booking",
    audiences: {
      customer: { title: "Booking Rejected", link: highlight("/customer/bookings") },
    },
  },

  booking_on_the_way: {
    category: "booking",
    audiences: {
      customer: { title: "Provider Is On The Way", link: highlight("/customer/bookings") },
    },
  },

  booking_completed: {
    category: "booking",
    audiences: {
      customer: { title: "Service Completed", link: highlight("/customer/bookings") },
    },
  },

  booking_cancelled: {
    category: "booking",
    audiences: {
      customer: { title: "Booking Cancelled", link: highlight("/customer/bookings") },
      provider: { title: "Booking Cancelled", link: highlight("/provider/bookings") },
      admin: { title: "Booking Cancelled", link: highlight("/admin/bookings") },
    },
  },

  booking_rescheduled: {
    category: "booking",
    audiences: {
      customer: { title: "Booking Rescheduled", link: highlight("/customer/bookings") },
      provider: { title: "Booking Rescheduled", link: highlight("/provider/bookings") },
    },
  },

  booking_reminder: {
    category: "booking",
    audiences: {
      customer: { title: "Booking Reminder", link: highlight("/customer/bookings") },
      provider: { title: "Upcoming Booking Reminder", link: highlight("/provider/bookings") },
    },
  },

  // ─── Payments & earnings ───────────────────────────────────────────────
  payment_success: {
    category: "payment",
    audiences: {
      customer: { title: "Payment Successful", link: highlight("/customer/bookings") },
      provider: { title: "Payment Received", link: highlight("/provider/earnings") },
    },
  },

  payment_failed: {
    category: "payment",
    audiences: {
      customer: { title: "Payment Failed", link: highlight("/customer/bookings") },
      provider: { title: "Payment Failed", link: highlight("/provider/earnings") },
    },
  },

  payment_refunded: {
    category: "payment",
    audiences: {
      customer: { title: "Payment Refunded", link: highlight("/customer/bookings") },
    },
  },

  payment_issue: {
    category: "payment",
    audiences: {
      admin: { title: "Payment Issue", link: highlight("/admin/invoices") },
    },
  },

  earnings_update: {
    category: "payment",
    audiences: {
      provider: { title: "Earnings Updated", link: highlight("/provider/earnings") },
    },
  },

  // ─── Chat invoices (the escrow flow in Invoice.service.js) ─────────────
  // These predate the catalog and carry titles that change with the admin's
  // or customer's decision, so their callers pass an explicit `title`
  // override. Everything else about them still resolves from here.
  invoice_pending_admin: {
    category: "payment",
    audiences: {
      admin: { title: "Invoice Awaiting Review", link: highlight("/admin/invoices") },
    },
  },

  invoice_received: {
    category: "payment",
    audiences: {
      customer: { title: "New Invoice", link: "/messages" },
    },
  },

  invoice_reviewed: {
    category: "payment",
    audiences: {
      provider: { title: "Invoice Reviewed", link: "/messages" },
    },
  },

  invoice_responded: {
    category: "payment",
    audiences: {
      provider: { title: "Invoice Update", link: "/messages" },
    },
  },

  // ─── Support (support.service.js) ──────────────────────────────────────
  support_request: {
    category: "system",
    audiences: {
      admin: { title: "New Support Request", link: "/admin/support-requests" },
    },
  },

  support_request_reviewed: {
    category: "system",
    audiences: {
      provider: { title: "Support Request Update", link: "/provider/support" },
    },
  },

  // ─── Reviews ───────────────────────────────────────────────────────────
  review_reminder: {
    category: "review",
    audiences: {
      customer: { title: "Please Leave a Review", link: highlight("/customer/bookings") },
    },
  },

  review_submitted: {
    category: "review",
    audiences: {
      customer: { title: "Review Submitted", link: highlight("/customer/bookings") },
    },
  },

  review_received: {
    category: "review",
    audiences: {
      provider: { title: "New Review Received", link: highlight("/provider/reviews") },
    },
  },

  new_review: {
    category: "review",
    audiences: {
      admin: { title: "New Review Submitted", link: null },
    },
  },

  review_reported: {
    category: "report",
    audiences: {
      admin: { title: "Review Reported", link: null },
    },
  },

  // ─── Provider profile & verification ───────────────────────────────────
  profile_approved: {
    category: "profile",
    audiences: {
      provider: { title: "Profile Approved", link: "/provider/verification" },
    },
  },

  profile_rejected: {
    category: "profile",
    audiences: {
      provider: { title: "Profile Verification Rejected", link: "/provider/verification" },
    },
  },

  profile_update_required: {
    category: "profile",
    audiences: {
      provider: { title: "Profile Update Required", link: "/provider/verification" },
    },
  },

  provider_verification: {
    category: "profile",
    audiences: {
      admin: { title: "Provider Verification Required", link: "/admin/providers" },
    },
  },

  provider_update: {
    category: "profile",
    audiences: {
      customer: {
        title: "Provider Update",
        link: (referenceId) => (referenceId ? `/providers/${referenceId}` : "/customer/favorites"),
      },
    },
  },

  // ─── Services ──────────────────────────────────────────────────────────
  service_approved: {
    category: "service",
    audiences: {
      provider: { title: "Service Approved", link: "/provider/services" },
    },
  },

  service_rejected: {
    category: "service",
    audiences: {
      provider: { title: "Service Rejected", link: "/provider/services" },
    },
  },

  service_disabled: {
    category: "service",
    audiences: {
      provider: { title: "Service Disabled", link: "/provider/services" },
    },
  },

  service_created: {
    category: "service",
    audiences: {
      admin: {
        title: "New Service Created",
        link: (referenceId) => (referenceId ? `/services/${referenceId}` : null),
      },
    },
  },

  favorite_update: {
    category: "service",
    audiences: {
      customer: { title: "Favorite Update", link: "/customer/favorites" },
    },
  },

  // ─── Accounts & reports (admin) ────────────────────────────────────────
  new_customer: {
    category: "account",
    audiences: {
      admin: { title: "New Customer Registered", link: "/admin/users" },
    },
  },

  new_provider: {
    category: "account",
    audiences: {
      admin: { title: "New Provider Registered", link: "/admin/users" },
    },
  },

  new_report: {
    category: "report",
    audiences: {
      admin: { title: "New Report", link: null },
    },
  },

  // ─── Marketplace ───────────────────────────────────────────────────────
  job_request: {
    category: "booking",
    audiences: {
      provider: { title: "New Job Request", link: highlight("/provider/job-requests") },
      customer: { title: "Job Request Update", link: highlight("/customer/job-requests") },
    },
  },

  system: {
    category: "system",
    audiences: {
      customer: { title: "System Notification", link: null },
      provider: { title: "System Notification", link: null },
      admin: { title: "System Notification", link: null },
    },
  },
};

// Values written by earlier versions of this codebase. Kept in the model's
// enum so documents already in the database stay valid on re-save, but not
// resolvable — nothing should create these any more.
const LEGACY_TYPES = ["booking", "booking_status", "review", "payment", "general"];

const NOTIFICATION_AUDIENCES = ["customer", "provider", "admin"];

/**
 * Looks up the headline, destination and icon family for one (type,
 * audience) pair.
 *
 * @param {string} type
 * @param {"customer" | "provider" | "admin"} audience
 * @param {string | import("mongoose").Types.ObjectId | null} referenceId
 * @returns {{ title: string, link: string | null, category: string }}
 * @throws if the type doesn't exist, or isn't meant for that audience —
 *   a loud failure beats silently sending a customer a provider's alert.
 */
const resolveNotification = (type, audience, referenceId = null) => {
  const definition = NOTIFICATION_TYPES[type];
  if (!definition) {
    throw new Error(`Unknown notification type "${type}"`);
  }

  const forAudience = definition.audiences[audience];
  if (!forAudience) {
    throw new Error(
      `Notification type "${type}" is not sent to "${audience}" — declared audiences: ${Object.keys(
        definition.audiences
      ).join(", ")}`
    );
  }

  const link =
    typeof forAudience.link === "function"
      ? forAudience.link(referenceId ? String(referenceId) : null)
      : forAudience.link ?? null;

  return { title: forAudience.title, link, category: definition.category };
};

module.exports = {
  NOTIFICATION_TYPES,
  NOTIFICATION_AUDIENCES,
  LEGACY_TYPES,
  NOTIFICATION_TYPE_KEYS: Object.keys(NOTIFICATION_TYPES),
  resolveNotification,
};
