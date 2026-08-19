import axios from '@/api/axios';
import { ENDPOINTS } from '@/api/endpoints';

export const favoriteService = {
  getMyFavorites: async () => {
    const { data } = await axios.get(ENDPOINTS.FAVORITES.LIST);
    return data;
  },
  addService: async (serviceId) => {
    const { data } = await axios.post(ENDPOINTS.FAVORITES.ADD_SERVICE(serviceId));
    return data;
  },
  addProvider: async (providerId) => {
    const { data } = await axios.post(ENDPOINTS.FAVORITES.ADD_PROVIDER(providerId));
    return data;
  },
  remove: async (favoriteId) => {
    const { data } = await axios.delete(ENDPOINTS.FAVORITES.REMOVE(favoriteId));
    return data;
  },
};