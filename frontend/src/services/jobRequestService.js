import axios from '@/api/axios';
import { ENDPOINTS } from '@/api/endpoints';

export const jobRequestService = {
  // `payload` is a plain object; `files` is a FileList/array of attachments
  // (optional). Sent as multipart since attachments may be present.
  create: async (payload, files = []) => {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') formData.append(key, value);
    });
    Array.from(files).forEach((f) => formData.append('attachments', f));

    const { data } = await axios.post(ENDPOINTS.JOB_REQUESTS.CREATE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  getMine: async () => {
    const { data } = await axios.get(ENDPOINTS.JOB_REQUESTS.MINE);
    return data;
  },

  getRelevant: async (params = {}) => {
    const { data } = await axios.get(ENDPOINTS.JOB_REQUESTS.RELEVANT, { params });
    return data;
  },

  getAllAdmin: async (params = {}) => {
    const { data } = await axios.get(ENDPOINTS.JOB_REQUESTS.ADMIN_LIST, { params });
    return data;
  },

  getById: async (id) => {
    const { data } = await axios.get(ENDPOINTS.JOB_REQUESTS.DETAILS(id));
    return data;
  },

  cancel: async (id) => {
    const { data } = await axios.put(ENDPOINTS.JOB_REQUESTS.CANCEL(id));
    return data;
  },
};