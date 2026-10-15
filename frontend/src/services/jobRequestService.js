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

  // ── Quotes (proposals) ──────────────────────────────────────────────
  /** Provider: every request they can act on, each with a `stage` and `myProposal`. */
  getPipeline: async () => {
    const { data } = await axios.get(ENDPOINTS.JOB_REQUESTS.PIPELINE);
    return data;
  },

  /** Provider: send a quote, or edit the one still pending. */
  submitProposal: async (id, { amount, message, proposedDate, proposedTime }) => {
    const { data } = await axios.post(ENDPOINTS.JOB_REQUESTS.PROPOSALS(id), { amount, message, proposedDate, proposedTime });
    return data;
  },

  withdrawProposal: async (proposalId) => {
    const { data } = await axios.put(ENDPOINTS.PROPOSALS.WITHDRAW(proposalId));
    return data;
  },

  /** Provider: "Not interested" — hides the request for them only. */
  dismiss: async (id) => {
    const { data } = await axios.put(ENDPOINTS.JOB_REQUESTS.DISMISS(id));
    return data;
  },

  undismiss: async (id) => {
    const { data } = await axios.put(ENDPOINTS.JOB_REQUESTS.UNDISMISS(id));
    return data;
  },

  /** Customer: the quotes on one of their requests. */
  getProposals: async (id) => {
    const { data } = await axios.get(ENDPOINTS.JOB_REQUESTS.PROPOSALS(id));
    return data;
  },

  /** Customer: accept a quote — returns { proposal, booking }. */
  acceptProposal: async (proposalId) => {
    const { data } = await axios.put(ENDPOINTS.PROPOSALS.ACCEPT(proposalId));
    return data;
  },

  rejectProposal: async (proposalId) => {
    const { data } = await axios.put(ENDPOINTS.PROPOSALS.REJECT(proposalId));
    return data;
  },

  cancel: async (id) => {
    const { data } = await axios.put(ENDPOINTS.JOB_REQUESTS.CANCEL(id));
    return data;
  },
};