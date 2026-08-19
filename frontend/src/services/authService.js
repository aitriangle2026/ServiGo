import axios from '@/api/axios';
import { ENDPOINTS } from '@/api/endpoints';

export const authService = {
  login: async ({ email, password, rememberMe }) => {
  const { data } = await axios.post(ENDPOINTS.AUTH.LOGIN, { email, password, rememberMe });
  return {
    accessToken: data.data.token,
    refreshToken: data.data.refreshToken,
    user: data.data.user,
  };
},

register: async (payload) => {
  const { data } = await axios.post(ENDPOINTS.AUTH.REGISTER, payload);
  // Backend register does NOT return a token — it only creates the account.
  // We return the user but no accessToken, so persistSession won't fake a session.
  return {
    user: data.data,
  };
},

  googleLogin: async (idToken, role) => {
    const { data } = await axios.post(ENDPOINTS.AUTH.GOOGLE_LOGIN, { idToken, role });
    return data;
  },

  logout: async () => {
    const { data } = await axios.post(ENDPOINTS.AUTH.LOGOUT);
    return data;
  },

  getCurrentUser: async () => {
    const { data } = await axios.get(ENDPOINTS.AUTH.ME);
    return { user: data.data };
  },
  
  forgotPassword: async (email) => {
    // Triggers backend to send a 6-digit OTP to the user's email
    const { data } = await axios.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
    return data;
  },

  verifyOtp: async ({ email, otp }) => {
    const { data } = await axios.post(ENDPOINTS.AUTH.VERIFY_OTP, { email, otp });
    return data;
  },

  resendOtp: async (email) => {
    const { data } = await axios.post(ENDPOINTS.AUTH.RESEND_OTP, { email });
    return data;
  },

  resetPassword: async ({ email, otp, newPassword }) => {
    const { data } = await axios.post(ENDPOINTS.AUTH.RESET_PASSWORD, {
      email,
      otp,
      newPassword,
    });
    return data;
  },
};
