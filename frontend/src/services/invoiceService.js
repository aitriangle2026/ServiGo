import axios from '@/api/axios';
import { ENDPOINTS } from '@/api/endpoints';

export const invoiceService = {
  // Provider only. items: [{ description, amount }]
  create: async (conversationId, { items, notes, proposedDate, proposedTime }) => {
    const { data } = await axios.post(ENDPOINTS.INVOICES.CREATE(conversationId), {
      items,
      notes,
      proposedDate,
      proposedTime,
    });
    return data;
  },

  getById: async (id) => {
    const { data } = await axios.get(ENDPOINTS.INVOICES.DETAILS(id));
    return data;
  },

  mine: async () => {
    const { data } = await axios.get(ENDPOINTS.INVOICES.MINE);
    return data;
  },

  // Customer only. action: 'approve' | 'reject'
  respond: async (id, { action, rejectionReason }) => {
    const { data } = await axios.put(ENDPOINTS.INVOICES.RESPOND(id), { action, rejectionReason });
    return data;
  },

  // Customer only — simulated payment capture (see backend invoice.service.js).
  pay: async (id, { address, bookingDate, bookingTime }) => {
    const { data } = await axios.put(ENDPOINTS.INVOICES.PAY(id), { address, bookingDate, bookingTime });
    return data;
  },

  // Admin only — invoices a provider sent that haven't been vetted yet
  pendingAdminReview: async () => {
    const { data } = await axios.get(ENDPOINTS.INVOICES.ADMIN_PENDING);
    return data;
  },

  // Admin only. action: 'approve' | 'reject'
  adminReview: async (id, { action, rejectionReason }) => {
    const { data } = await axios.put(ENDPOINTS.INVOICES.ADMIN_REVIEW(id), { action, rejectionReason });
    return data;
  },

  // Admin only
  pendingPayouts: async () => {
    const { data } = await axios.get(ENDPOINTS.INVOICES.PAYOUTS_PENDING);
    return data;
  },

  release: async (id) => {
    const { data } = await axios.put(ENDPOINTS.INVOICES.RELEASE(id));
    return data;
  },
};