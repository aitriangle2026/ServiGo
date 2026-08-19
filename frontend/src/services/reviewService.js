import axios from '@/api/axios';
import { ENDPOINTS } from '@/api/endpoints';

export const reviewService = {
  getByProvider: async (providerId) => {
    const { data } = await axios.get(ENDPOINTS.REVIEWS.BY_PROVIDER(providerId));
    return data;
  },
  getByService: async (serviceId) => {
    const { data } = await axios.get(ENDPOINTS.REVIEWS.BY_SERVICE(serviceId));
    return data;
  },
  create: async (payload) => {
    const { data } = await axios.post(ENDPOINTS.REVIEWS.CREATE, payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await axios.put(ENDPOINTS.REVIEWS.UPDATE(id), payload);
    return data;
  },
  remove: async (id) => {
    const { data } = await axios.delete(ENDPOINTS.REVIEWS.DELETE(id));
    return data;
  },
};