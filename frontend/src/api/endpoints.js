export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    GOOGLE_LOGIN: '/auth/google',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh-token',
    ME: '/auth/profile',
    SEND_OTP: '/auth/send-otp',
    VERIFY_OTP: '/auth/verify-otp',
    RESEND_OTP: '/auth/resend-otp',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    UPLOAD_AVATAR: '/users/avatar',
  },
 SERVICES: {
    LIST: '/services',
    DETAILS: (id) => `/services/${id}`,
    IMAGES: (id) => `/services/${id}/images`,
  },
  CATEGORIES: {
    LIST: '/categories',
  },
  
  PROVIDERS: {
    PROFILE: '/provider/profile',
    PROFILE_IMAGE: '/provider/profile/image',
  },
  REVIEWS: {
    BY_PROVIDER: (providerId) => `/reviews/provider/${providerId}`,
    BY_SERVICE: (serviceId) => `/reviews/service/${serviceId}`,
    CREATE: '/reviews',
    UPDATE: (id) => `/reviews/${id}`,
    DELETE: (id) => `/reviews/${id}`,
  },

  BOOKINGS: {
    CREATE: '/bookings',
    CUSTOMER: '/bookings/customer',
    PROVIDER: '/bookings/provider',
    UPDATE_STATUS: (id) => `/bookings/${id}/status`,
  },

  FAVORITES: {
    LIST: '/favorites',
    ADD_SERVICE: (serviceId) => `/favorites/service/${serviceId}`,
    ADD_PROVIDER: (providerId) => `/favorites/provider/${providerId}`,
    REMOVE: (id) => `/favorites/${id}`,
  },
};