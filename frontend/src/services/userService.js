import axios from '@/api/axios';
import { ENDPOINTS } from '@/api/endpoints';

export const userService = {
  updateProfile: async (payload) => {
    const { data } = await axios.put(ENDPOINTS.USERS.UPDATE_PROFILE, payload);
    return data;
  },

  listAddresses: async () => {
    const { data } = await axios.get(ENDPOINTS.USERS.ADDRESSES);
    return data;
  },

  addAddress: async (payload) => {
    const { data } = await axios.post(ENDPOINTS.USERS.ADDRESSES, payload);
    return data;
  },

  updateAddress: async (id, payload) => {
    const { data } = await axios.put(ENDPOINTS.USERS.ADDRESS(id), payload);
    return data;
  },

  deleteAddress: async (id) => {
    const { data } = await axios.delete(ENDPOINTS.USERS.ADDRESS(id));
    return data;
  },
}
