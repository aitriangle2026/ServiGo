import axios from '@/api/axios';
import { ENDPOINTS } from '@/api/endpoints';

export const supportService = {
  // Provider only
  createRequest: async ({ subject, message }) => {
    const { data } = await axios.post(ENDPOINTS.SUPPORT.CREATE_REQUEST, { subject, message });
    return data;
  },

  myRequests: async () => {
    const { data } = await axios.get(ENDPOINTS.SUPPORT.MY_REQUESTS);
    return data;
  },

  myConversation: async () => {
    const { data } = await axios.get(ENDPOINTS.SUPPORT.MY_CONVERSATION);
    return data;
  },

  // Admin only
  pendingRequests: async () => {
    const { data } = await axios.get(ENDPOINTS.SUPPORT.PENDING_REQUESTS);
    return data;
  },

  // action: 'approve' | 'reject'
  reviewRequest: async (id, { action, rejectionReason }) => {
    const { data } = await axios.put(ENDPOINTS.SUPPORT.REVIEW_REQUEST(id), { action, rejectionReason });
    return data;
  },

  adminConversations: async () => {
    const { data } = await axios.get(ENDPOINTS.SUPPORT.ADMIN_CONVERSATIONS);
    return data;
  },

  // Shared — provider viewing their own thread, admin viewing any thread
  getMessages: async (conversationId) => {
    const { data } = await axios.get(ENDPOINTS.SUPPORT.MESSAGES(conversationId));
    return data;
  },

  // type: 'text' | 'image' | 'document' | 'voice'
  sendMessage: async (conversationId, { type = 'text', text = '', file = null, duration = 0 }) => {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('text', text);
    formData.append('duration', String(duration));
    if (file) formData.append('file', file);

    const { data } = await axios.post(ENDPOINTS.SUPPORT.MESSAGES(conversationId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};