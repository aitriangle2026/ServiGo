const invoiceService = require("../services/invoice.service");
const { getIO } = require("../sockets/socket");
const chatService = require("../services/chat.service");

const notifySocket = (userId, event, payload) => {
  try {
    getIO().to(String(userId)).emit(event, payload);
  } catch {
    // Socket.IO not initialized — safe to skip, data is already persisted.
  }
};

const createInvoice = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { invoice, message, recipientUserId } = await invoiceService.createInvoice(
      req.user._id,
      conversationId,
      req.body
    );

    notifySocket(recipientUserId, "newMessage", { conversationId, message });
    notifySocket(recipientUserId, "invoiceUpdated", { conversationId, invoice });

    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(error.status || 400).json({ success: false, message: error.message });
  }
};

const listPendingAdminReview = async (req, res) => {
  try {
    const invoices = await invoiceService.listPendingAdminReview();
    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const adminReview = async (req, res) => {
  try {
    const invoice = await invoiceService.adminReviewInvoice(req.user._id, req.params.id, req.body);
    notifySocket(invoice.customer._id, "invoiceUpdated", { conversationId: invoice.conversation, invoice });
    notifySocket(invoice.provider.user._id || invoice.provider.user, "invoiceUpdated", {
      conversationId: invoice.conversation,
      invoice,
    });
    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    res.status(error.status || 400).json({ success: false, message: error.message });
  }
};

const getInvoice = async (req, res) => {
  try {
    const invoice = await invoiceService.getInvoice(req.params.id, req.user._id);
    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    res.status(error.status || 400).json({ success: false, message: error.message });
  }
};

const respondToInvoice = async (req, res) => {
  try {
    const invoice = await invoiceService.respondToInvoice(req.user._id, req.params.id, req.body);
    const otherUserId = chatService.getOtherUserId(
      { customer: invoice.customer._id, provider: invoice.provider },
      req.user._id
    );
    notifySocket(otherUserId, "invoiceUpdated", { conversationId: invoice.conversation, invoice });
    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    res.status(error.status || 400).json({ success: false, message: error.message });
  }
};

const payInvoice = async (req, res) => {
  try {
    const { invoice, booking } = await invoiceService.payInvoice(req.user._id, req.params.id, req.body);
    const otherUserId = chatService.getOtherUserId(
      { customer: invoice.customer._id, provider: invoice.provider },
      req.user._id
    );
    notifySocket(otherUserId, "invoiceUpdated", { conversationId: invoice.conversation, invoice });
    res.status(200).json({ success: true, data: { invoice, booking } });
  } catch (error) {
    res.status(error.status || 400).json({ success: false, message: error.message });
  }
};

const listMyInvoices = async (req, res) => {
  try {
    const invoices = await invoiceService.listMyInvoices(req.user._id, req.user.role);
    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const listPendingPayouts = async (req, res) => {
  try {
    const invoices = await invoiceService.listPendingPayouts();
    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const releasePayout = async (req, res) => {
  try {
    const invoice = await invoiceService.releasePayout(req.user._id, req.params.id);
    notifySocket(invoice.provider.user._id || invoice.provider.user, "invoiceUpdated", {
      conversationId: invoice.conversation,
      invoice,
    });
    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    res.status(error.status || 400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createInvoice,
  getInvoice,
  listPendingAdminReview,
  adminReview,
  respondToInvoice,
  payInvoice,
  listMyInvoices,
  listPendingPayouts,
  releasePayout,
};