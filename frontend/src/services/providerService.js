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
    const { data } = await axios.get(ENDPOINTS.PROVIDERS.PENDING);
    return data;
  },

  updateVerification: async (id, status) => {
    const { data } = await axios.put(ENDPOINTS.PROVIDERS.VERIFY(id), { status });
    return data;
  },

  uploadNicImages: async ({ nicFrontImage, nicBackImage }) => {
    const formData = new FormData();
    if (nicFrontImage) formData.append('nicFrontImage', nicFrontImage);
    if (nicBackImage) formData.append('nicBackImage', nicBackImage);

    const { data } = await axios.put(ENDPOINTS.PROVIDERS.NIC_IMAGES, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  // ---- Verification checklist ----

  getVerificationScore: async () => {
    const { data } = await axios.get(ENDPOINTS.PROVIDERS.VERIFICATION_SCORE);
    return data;
  },

  submitForReview: async () => {
    const { data } = await axios.post(ENDPOINTS.PROVIDERS.VERIFICATION_SUBMIT);
    return data;
  },

  uploadSelfieImage: async (file) => {
    const formData = new FormData();
    formData.append('selfie', file);
    const { data } = await axios.put(ENDPOINTS.PROVIDERS.SELFIE_IMAGE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  addPortfolioImages: async (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('portfolioImages', file));
    const { data } = await axios.post(ENDPOINTS.PROVIDERS.PORTFOLIO_IMAGES, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  removePortfolioImage: async (imageUrl) => {
    const { data } = await axios.delete(ENDPOINTS.PROVIDERS.PORTFOLIO_IMAGES, { data: { imageUrl } });
    return data;
  },

  addCertificate: async ({ title, file }) => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('file', file);
    const { data } = await axios.post(ENDPOINTS.PROVIDERS.CERTIFICATES, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  removeCertificate: async (certificateId) => {
    const { data } = await axios.delete(ENDPOINTS.PROVIDERS.CERTIFICATE_DELETE(certificateId));
    return data;
  },

  updatePayoutDetails: async (payoutDetails) => {
    const { data } = await axios.put(ENDPOINTS.PROVIDERS.PAYOUT_DETAILS, payoutDetails);
    return data;
  },
};