import axios from '@/api/axios';
import { ENDPOINTS } from '@/api/endpoints';

export const bookingService = {
  create: async (payload) => {
    const { data } = await axios.post(ENDPOINTS.BOOKINGS.CREATE, payload);
    return data;
  },

  getMyBookings: async () => {
    // Backend returns { success, count, data: [...] }
    const { data } = await axios.get(ENDPOINTS.BOOKINGS.CUSTOMER);
    return data;
  },

  getProviderBookings: async () => {
    const { data } = await axios.get(ENDPOINTS.BOOKINGS.PROVIDER);
    return data;
  },

  updateStatus: async (bookingId, status) => {
    const { data } = await axios.put(ENDPOINTS.BOOKINGS.UPDATE_STATUS(bookingId), { status });
    return data;
  },
};