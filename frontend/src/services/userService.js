import axios from '@/api/axios';
import { ENDPOINTS } from '@/api/endpoints';

export const userService = {
  updateProfile: async (payload) => {
    const { data } = await axios.put(ENDPOINTS.USERS.UPDATE_PROFILE, payload);
    return data;
  },
};