import {
  FaBell,
  FaCalendarCheck,
  FaCheckCircle,
  FaClipboardList,
  FaExclamationTriangle,
  FaFlag,
  FaMoneyBillWave,
  FaStar,
  FaTimesCircle,
  FaTools,
  FaTruck,
  FaUserCheck,
  FaUserPlus,
} from 'react-icons/fa';

// Icon and colour for each notification type. This is purely presentational,
// so it lives on the client — the server decides *what* to send (see
// backend/src/config/notificationTypes.js), the UI decides how it looks.
//
// Anything not listed falls back to a neutral bell, so a type added on the
// backend still renders sensibly before this map catches up.
const META = {
  // Bookings
  booking_created: { icon: FaCalendarCheck, tone: 'primary' },
  booking_accepted: { icon: FaCheckCircle, tone: 'success' },
  booking_rejected: { icon: FaTimesCircle, tone: 'danger' },
  booking_on_the_way: { icon: FaTruck, tone: 'accent' },
  booking_completed: { icon: FaCheckCircle, tone: 'success' },
  booking_cancelled: { icon: FaTimesCircle, tone: 'danger' },
  booking_rescheduled: { icon: FaCalendarCheck, tone: 'accent' },
  booking_reminder: { icon: FaBell, tone: 'accent' },
  job_request: { icon: FaClipboardList, tone: 'primary' },

  // Payments
  payment_success: { icon: FaMoneyBillWave, tone: 'success' },
  payment_failed: { icon: FaExclamationTriangle, tone: 'danger' },
  payment_refunded: { icon: FaMoneyBillWave, tone: 'accent' },
  payment_issue: { icon: FaExclamationTriangle, tone: 'danger' },
  earnings_update: { icon: FaMoneyBillWave, tone: 'success' },
  invoice_pending_admin: { icon: FaMoneyBillWave, tone: 'accent' },
  invoice_received: { icon: FaMoneyBillWave, tone: 'primary' },
  invoice_reviewed: { icon: FaMoneyBillWave, tone: 'primary' },
  invoice_responded: { icon: FaMoneyBillWave, tone: 'primary' },

  // Reviews
  review_reminder: { icon: FaStar, tone: 'accent' },
  review_submitted: { icon: FaStar, tone: 'success' },
  review_received: { icon: FaStar, tone: 'accent' },
  new_review: { icon: FaStar, tone: 'primary' },
  review_reported: { icon: FaFlag, tone: 'danger' },

  // Profile & verification
  profile_approved: { icon: FaUserCheck, tone: 'success' },
  profile_rejected: { icon: FaTimesCircle, tone: 'danger' },
  profile_update_required: { icon: FaExclamationTriangle, tone: 'accent' },
  provider_verification: { icon: FaUserCheck, tone: 'primary' },
  provider_update: { icon: FaUserCheck, tone: 'primary' },

  // Services
  service_approved: { icon: FaCheckCircle, tone: 'success' },
  service_rejected: { icon: FaTimesCircle, tone: 'danger' },
  service_disabled: { icon: FaExclamationTriangle, tone: 'danger' },
  service_created: { icon: FaTools, tone: 'primary' },
  favorite_update: { icon: FaTools, tone: 'accent' },

  // Accounts, reports, support
  new_customer: { icon: FaUserPlus, tone: 'primary' },
  new_provider: { icon: FaUserPlus, tone: 'primary' },
  new_report: { icon: FaFlag, tone: 'danger' },
  support_request: { icon: FaBell, tone: 'primary' },
  support_request_reviewed: { icon: FaBell, tone: 'primary' },

  system: { icon: FaBell, tone: 'neutral' },
};

const FALLBACK = { icon: FaBell, tone: 'neutral' };

// Tailwind classes per tone. Written out in full rather than interpolated so
// Tailwind's scanner can see every class it needs to generate.
export const TONE_CLASSES = {
  primary: 'bg-primary-light text-primary',
  success: 'bg-success-light text-success',
  danger: 'bg-danger-light text-danger',
  accent: 'bg-amber-50 text-accent-hover',
  neutral: 'bg-slate-100 text-text-muted',
};

/**
 * @param {string} type
 * @returns {{ icon: React.ComponentType, tone: keyof typeof TONE_CLASSES }}
 */
export const getNotificationMeta = (type) => META[type] || FALLBACK;

export default getNotificationMeta;
