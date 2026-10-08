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
    ADDRESSES: '/users/addresses',
    ADDRESS: (id) => `/users/addresses/${id}`,
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
    NIC_IMAGES: '/provider/profile/nic-images',
    SELFIE_IMAGE: '/provider/profile/selfie',
    PORTFOLIO_IMAGES: '/provider/profile/portfolio',
    CERTIFICATES: '/provider/profile/certificates',
    CERTIFICATE_DELETE: (certificateId) => `/provider/profile/certificates/${certificateId}`,
    PAYOUT_DETAILS: '/provider/profile/payout-details',
    VERIFICATION_SCORE: '/provider/verification/score',
    VERIFICATION_SUBMIT: '/provider/verification/submit',
    PENDING: '/provider/pending',
    VERIFY: (id) => `/provider/${id}/verify`,
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
    DETAILS: (id) => `/bookings/${id}`,
    CANCEL: (id) => `/bookings/${id}/cancel`,
  },

  FAVORITES: {
    LIST: '/favorites',
    ADD_SERVICE: (serviceId) => `/favorites/service/${serviceId}`,
    ADD_PROVIDER: (providerId) => `/favorites/provider/${providerId}`,
    REMOVE: (id) => `/favorites/${id}`,
  },

  CHAT: {
    START: '/chat/conversations',
    LIST: '/chat/conversations',
    MESSAGES: (conversationId) => `/chat/conversations/${conversationId}/messages`,
  },

  INVOICES: {
    CREATE: (conversationId) => `/invoices/conversations/${conversationId}`,
    MINE: '/invoices/mine',
    DETAILS: (id) => `/invoices/${id}`,
    ADMIN_PENDING: '/invoices/admin/pending',
    ADMIN_REVIEW: (id) => `/invoices/${id}/admin-review`,
    RESPOND: (id) => `/invoices/${id}/respond`,
    PAY: (id) => `/invoices/${id}/pay`,
    PAYOUTS_PENDING: '/invoices/payouts/pending',
    RELEASE: (id) => `/invoices/${id}/release`,
  },

  NOTIFICATIONS: {
    LIST: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    MARK_READ: (id) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
    DELETE: (id) => `/notifications/${id}`,
  },

  JOB_REQUESTS: {
    CREATE: '/job-requests',
    MINE: '/job-requests/mine',
    RELEVANT: '/job-requests/relevant',
    ADMIN_LIST: '/job-requests/admin',
    DETAILS: (id) => `/job-requests/${id}`,
    CANCEL: (id) => `/job-requests/${id}/cancel`,
  },

  SUPPORT: {
    CREATE_REQUEST: '/support/requests',
    MY_REQUESTS: '/support/requests/mine',
    PENDING_REQUESTS: '/support/requests/pending',
    REVIEW_REQUEST: (id) => `/support/requests/${id}/review`,
    MY_CONVERSATION: '/support/conversations/mine',
    ADMIN_CONVERSATIONS: '/support/conversations/admin',
    MESSAGES: (conversationId) => `/support/conversations/${conversationId}/messages`,
  },
};