const supportService = require("../services/support.service");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const { getIO } = require("../sockets/socket");

const notifySocket = (userId, event, payload) => {
  try {
    getIO().to(String(userId)).emit(event, payload);
  } catch {
    // Socket.IO not initialized — safe to skip, data is already persisted.
  }
};

const createRequest = async (req, res) => {
  try {
    const { subject, message } = req.body;
    const { request, adminIds } = await supportService.createRequest(req.user._id, { subject, message });

    adminIds.forEach((adminId) => notifySocket(adminId, "supportRequestCreated", { request }));

    res.status(201).json({ success: true, data: request });
  } catch (error) {
    res.status(error.status || 400).json({ success: false, message: error.message });
  }
};

const listMyRequests = async (req, res) => {
  try {
    const requests = await supportService.listMyRequests(req.user._id);
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const listPendingRequests = async (req, res) => {
  try {
    const requests = await supportService.listPendingRequests();
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const reviewRequest = async (req, res) => {
  try {
    const { request, conversation } = await supportService.reviewRequest(req.user._id, req.params.id, req.body);

    notifySocket(request.provider._id || request.provider, "supportRequestUpdated", { request, conversation });

    res.status(200).json({ success: true, data: { request, conversation } });
  } catch (error) {
    res.status(error.status || 400).json({ success: false, message: error.message });
  }
};

const getMyConversation = async (req, res) => {
  try {
    const conversation = await supportService.getMyConversation(req.user._id);
    res.status(200).json({ success: true, data: conversation });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const listAdminConversations = async (req, res) => {
  try {
    const conversations = await supportService.listAdminConversations();
    res.status(200).json({ success: true, data: conversations });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const { conversation, messages } = await supportService.listMessages(req.params.id, req.user._id, req.user.role);
    res.status(200).json({ success: true, data: { conversation, messages } });
  } catch (error) {
    res.status(error.status || 400).json({ success: false, message: error.message });
  }
};

const RESOURCE_TYPE_BY_MESSAGE_TYPE = {
  image: "image",
  voice: "video",
  document: "raw",
};

const sendMessage = async (req, res) => {
  try {
    const { type = "text", text = "", duration = 0 } = req.body;

    let attachmentUrl = "";
    let attachmentName = "";

    if (req.file) {
      const resourceType = RESOURCE_TYPE_BY_MESSAGE_TYPE[type] || "auto";
      const result = await uploadToCloudinary(req.file.buffer, "servigo/support", resourceType);
      attachmentUrl = result.secure_url;
      attachmentName = req.file.originalname;
    }

    if (type === "text" && !text.trim()) {
      return res.status(400).json({ success: false, message: "Message text can't be empty" });
    }

    if (["image", "document", "voice"].includes(type) && !attachmentUrl) {
      return res.status(400).json({ success: false, message: "A file is required for this message type" });
    }

    const { message, recipientIds } = await supportService.sendMessage(req.params.id, req.user._id, req.user.role, {
      type,
      text,
      attachmentUrl,
      attachmentName,
      duration: Number(duration) || 0,
    });

    recipientIds.forEach((recipientId) =>
      notifySocket(recipientId, "newSupportMessage", { conversationId: req.params.id, message })
    );

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    res.status(error.status || 400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createRequest,
  listMyRequests,
  listPendingRequests,
  reviewRequest,
  getMyConversation,
  listAdminConversations,
  getMessages,
  sendMessage,
};