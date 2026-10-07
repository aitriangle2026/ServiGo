import axios from '@/api/axios';
import { ENDPOINTS } from '@/api/endpoints';

export const chatService = {
  // Finds (or creates) the single conversation thread between the current
  // user and a provider. `serviceId` is optional context for the first message.
  startConversation: async ({ providerId, serviceId }) => {
    const { data } = await axios.post(ENDPOINTS.CHAT.START, { providerId, serviceId });
    return data;
  },

  getConversations: async () => {
    const { data } = await axios.get(ENDPOINTS.CHAT.LIST);
    return data;
  },

  getMessages: async (conversationId) => {
    const { data } = await axios.get(ENDPOINTS.CHAT.MESSAGES(conversationId));
    return data;
  },

  // `type` is 'text' | 'image' | 'document' | 'voice'. Pass `file` for
  // anything but text, and `duration` (seconds) for voice notes.
  sendMessage: async (conversationId, { type = 'text', text = '', file = null, duration = 0 }) => {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('text', text);
    formData.append('duration', String(duration));
    if (file) formData.append('file', file);

    const { data } = await axios.post(ENDPOINTS.CHAT.MESSAGES(conversationId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};