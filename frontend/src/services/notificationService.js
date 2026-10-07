import axios from '@/api/axios';
import { ENDPOINTS } from '@/api/endpoints';

export const notificationService = {
  /**
   * @param {{ page?: number, limit?: number, unreadOnly?: boolean }} params
   * @returns {Promise<{ data: Array, unreadCount: number, page: number, totalPages: number, total: number }>}
   */
  getMine: async (params = {}) => {
    const { data } = await axios.get(ENDPOINTS.NOTIFICATIONS.LIST, { params });
    return data;
  },

  getUnreadCount: async () => {
    const { data } = await axios.get(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
    return data;
  },

  markAsRead: async (id) => {
    const { data } = await axios.put(ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
    return data;
  },

  markAllAsRead: async () => {
    const { data } = await axios.put(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
    return data;
  },

  remove: async (id) => {
    const { data } = await axios.delete(ENDPOINTS.NOTIFICATIONS.DELETE(id));
    return data;
  },
};

export default notificationService;
