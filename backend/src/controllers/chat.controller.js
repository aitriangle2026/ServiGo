const chatService = require("../services/chat.service");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const { getIO, isViewingConversation } = require("../sockets/socket");
const notificationService = require("../services/notification.service");
const Notification = require("../models/Notification");

const startConversation = async (req, res) => {
  try {
    const { providerId, serviceId } = req.body;
    if (!providerId) {
      return res.status(400).json({ success: false, message: "providerId is required" });
    }

    const conversation = await chatService.getOrCreateConversation(req.user._id, providerId, serviceId);
    res.status(200).json({ success: true, data: conversation });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getConversations = async (req, res) => {
  try {
    const conversations = await chatService.listConversations(req.user._id, req.user.role);
    res.status(200).json({ success: true, data: conversations });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const { conversation, messages } = await chatService.listMessages(req.params.id, req.user._id);

    // Opening the chat is reading it — clear its "New Message" notification,
    // which also lets the next message raise a fresh one.
    Notification.find({ user: req.user._id, type: "new_message", referenceId: req.params.id, isRead: false })
      .select("_id")
      .then((rows) => Promise.all(rows.map((row) => notificationService.markAsRead(row._id, req.user._id))))
      .catch(() => {});

    res.status(200).json({ success: true, data: { conversation, messages } });
  } catch (error) {
    res.status(error.status || 400).json({ success: false, message: error.message });
  }
};

// Resource type per Cloudinary's own bucketing: images stay "image", audio
// notes are uploaded as "video" (Cloudinary's home for audio), everything
// else (PDFs, docs) goes up as "raw".
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
      const result = await uploadToCloudinary(req.file.buffer, "servigo/chat", resourceType);
      attachmentUrl = result.secure_url;
      attachmentName = req.file.originalname;
    }

    if (type === "text" && !text.trim()) {
      return res.status(400).json({ success: false, message: "Message text can't be empty" });
    }

    if (["image", "document", "voice"].includes(type) && !attachmentUrl) {
      return res.status(400).json({ success: false, message: "A file is required for this message type" });
    }

    const { message, conversation, recipientUserId } = await chatService.sendMessage(req.params.id, req.user._id, {
      type,
      text,
      attachmentUrl,
      attachmentName,
      duration: Number(duration) || 0,
    });

    try {
      getIO().to(String(recipientUserId)).emit("newMessage", {
        conversationId: req.params.id,
        message,
      });
    } catch {
      // Socket.IO not initialized (e.g. in a test context) — message is
      // still saved, the recipient just won't get a live push.
    }

    // Never fails the send — the message is already saved and delivered.
    notifyRecipient({ conversation, message, recipientUserId, senderId: req.user._id }).catch(() => {});

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    res.status(error.status || 400).json({ success: false, message: error.message });
  }
};

/**
 * A "New Message" notification for the other participant — unless they have
 * the chat open, or already have an unread one for this conversation (one
 * per unread run, not one per message).
 */
const notifyRecipient = async ({ conversation, message, recipientUserId, senderId }) => {
  if (!recipientUserId) return;
  const conversationId = conversation._id;

  if (await isViewingConversation(recipientUserId, conversationId)) return;

  const alreadyWaiting = await Notification.exists({
    user: recipientUserId,
    type: "new_message",
    referenceId: conversationId,
    isRead: false,
  });
  if (alreadyWaiting) return;

  const senderName =
    `${message.sender?.firstName || ""} ${message.sender?.lastName || ""}`.trim() || "Someone";
  const recipientRole = chatService.getRole(conversation, senderId) === "customer" ? "provider" : "customer";
  const preview = message.type === "text" ? `"${conversation.lastMessage}"` : conversation.lastMessage;

  await notificationService.createNotification({
    user: recipientUserId,
    type: "new_message",
    audience: recipientRole,
    message: `${senderName}: ${preview}`,
    referenceId: conversationId,
  });
};

module.exports = {
  startConversation,
  getConversations,
  getMessages,
  sendMessage,
};