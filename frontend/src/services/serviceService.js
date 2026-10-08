import axios from '@/api/axios';
import { ENDPOINTS } from '@/api/endpoints';

export const serviceService = {
  // Which of the day's slots the provider is still free for. Derived on the
  // server from existing bookings — see service.service.js.
  getAvailability: async (id, date) => {
    const { data } = await axios.get(`${ENDPOINTS.SERVICES.DETAILS(id)}/availability`, {
      params: { date },
    });
    return data;
  },

  getCategories: async () => {
    const { data } = await axios.get(ENDPOINTS.CATEGORIES.LIST);
    return data;
  },

  search: async (params = {}) => {
    // Backend filters via query params directly on GET /services
    const { data } = await axios.get(ENDPOINTS.SERVICES.LIST, { params });
    return data;
  },

  getById: async (id) => {
    const { data } = await axios.get(ENDPOINTS.SERVICES.DETAILS(id));
    return data;
  },

  create: async (payload) => {
    const { data } = await axios.post(ENDPOINTS.SERVICES.LIST, payload);
    return data;
  },

  update: async (id, payload) => {
    const { data } = await axios.put(ENDPOINTS.SERVICES.DETAILS(id), payload);
    return data;
  },

  remove: async (id) => {
    const { data } = await axios.delete(ENDPOINTS.SERVICES.DETAILS(id));
    return data;
  },

  uploadImages: async (id, files) => {
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append('images', f));
    const { data } = await axios.put(ENDPOINTS.SERVICES.IMAGES(id), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  uploadPortfolioImages: async (serviceId, files) => {
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append('portfolioImages', f));
    const { data } = await axios.put(`/services/${serviceId}/portfolio-images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};