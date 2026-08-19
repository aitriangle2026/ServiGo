import axios from '@/api/axios';
import { ENDPOINTS } from '@/api/endpoints';

export const providerService = {
  createProfile: async (payload) => {
    const { data } = await axios.post(ENDPOINTS.PROVIDERS.PROFILE, payload);
    return data;
  },

  getMyProfile: async () => {
    const { data } = await axios.get(ENDPOINTS.PROVIDERS.PROFILE);
    return data;
  },

  updateProfile: async (payload) => {
    const { data } = await axios.put(ENDPOINTS.PROVIDERS.PROFILE, payload);
    return data;
  },

  uploadProfileImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await axios.put(ENDPOINTS.PROVIDERS.PROFILE_IMAGE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  search: async (params = {}) => {
    const { data } = await axios.get('/provider', { params });
    return data;
  },
  getById: async (id) => {
    const { data } = await axios.get(`/provider/${id}`);
    return data;
  },

  getPending: async () => {
    const { data } = await axios.get('/provider/pending');
    return data;
  },

  updateVerification: async (id, status) => {
    const { data } = await axios.put(`/provider/${id}/verify`, { status });
    return data;
  },

  uploadNicImages: async ({ nicFrontImage, nicBackImage }) => {
    const formData = new FormData();
    if (nicFrontImage) formData.append('nicFrontImage', nicFrontImage);
    if (nicBackImage) formData.append('nicBackImage', nicBackImage);

    const { data } = await axios.put('/provider/profile/nic-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};