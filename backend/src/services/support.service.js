const SupportRequest = require("../models/SupportRequest");
const SupportConversation = require("../models/SupportConversation");
const SupportMessage = require("../models/SupportMessage");
const User = require("../models/User");
const notificationService = require("./notification.service");

const REQUEST_POPULATE = [
  { path: "provider", select: "firstName lastName email phone profileImage" },
  { path: "reviewedBy", select: "firstName lastName" },
];

const CONVERSATION_POPULATE = [
  { path: "provider", select: "firstName lastName email phone profileImage" },
  { path: "lastSender", select: "firstName lastName" },
];

const getAdminIds = async () => {
  const admins = await User.find({ role: "admin" }).select("_id");
  return admins.map((a) => a._id);
};

// ---- Requests (the gate before any chat can happen) ------------------

const createRequest = async (providerUserId, { subject, message }) => {
  const cleanSubject = String(subject || "").trim();
  const cleanMessage = String(message || "").trim();

  if (!cleanSubject || !cleanMessage) {
    throw new Error("Subject and message are both required");
  }

  const existingPending = await SupportRequest.findOne({
    provider: providerUserId,
    status: "pending",
  });
  if (existingPending) {
    const err = new Error("You already have a support request awaiting review");
    err.status = 400;
    throw err;
  }

  const request = await SupportRequest.create({
    provider: providerUserId,
    subject: cleanSubject,
    message: cleanMessage,
  });

  const adminIds = await getAdminIds();
  await Promise.all(
    adminIds.map((adminId) =>
      notificationService.createNotification({
        user: adminId,
        type: "support_request",
        audience: "admin",
        message: `A provider requested to chat with the ServiGo team: "${cleanSubject}"`,
        referenceId: request._id,
      })
    )
  );

  return {
    request: await SupportRequest.findById(request._id).populate(REQUEST_POPULATE),
    adminIds,
  };
};

const listMyRequests = async (providerUserId) => {
  return SupportRequest.find({ provider: providerUserId }).sort("-createdAt").populate(REQUEST_POPULATE);
};

const listPendingRequests = async () => {
  return SupportRequest.find({ status: "pending" }).sort("createdAt").populate(REQUEST_POPULATE);
};

const reviewRequest = async (adminUserId, requestId, { action, rejectionReason = "" }) => {
  const request = await SupportRequest.findById(requestId);
  if (!request) throw new Error("Request not found");

  if (request.status !== "pending") {
    throw new Error(`This request was already ${request.status}`);
  }

  request.reviewedBy = adminUserId;
  request.reviewedAt = new Date();

  let conversation = null;

  if (action === "approve") {
    conversation = await SupportConversation.findOneAndUpdate(
      { provider: request.provider },
      { $setOnInsert: { provider: request.provider, status: "open" } },
      { new: true, upsert: true }
    );
    // Reopen a previously-closed thread if this is a repeat request.
    if (conversation.status !== "open") {
      conversation.status = "open";
      await conversation.save();
    }

    request.status = "accepted";
    request.conversation = conversation._id;

    await notificationService.createNotification({
      user: request.provider,
      type: "support_request_reviewed",
      audience: "provider",
      title: "Support request approved",
      message: "ServiGo approved your request — you can now chat with the team.",
      referenceId: request._id,
    });
  } else if (action === "reject") {
    request.status = "rejected";
    request.rejectionReason = rejectionReason;

    await notificationService.createNotification({
      user: request.provider,
      type: "support_request_reviewed",
      audience: "provider",
      title: "Support request declined",
      message: rejectionReason
        ? `ServiGo declined your request: ${rejectionReason}`
        : "ServiGo declined your request.",
      referenceId: request._id,
    });
  } else {
    throw new Error("action must be 'approve' or 'reject'");
  }

  await request.save();

  return {
    request: await SupportRequest.findById(request._id).populate(REQUEST_POPULATE),
    conversation,
  };
};

// ---- Conversations & messages ------------------------------------------

const getMyConversation = async (providerUserId) => {
  return SupportConversation.findOne({ provider: providerUserId }).populate(CONVERSATION_POPULATE);
};

const listAdminConversations = async () => {
  return SupportConversation.find({}).sort("-lastMessageAt").populate(CONVERSATION_POPULATE);
};

const assertAccess = (conversation, userId, role) => {
  if (!conversation) throw new Error("Conversation not found");
  if (role === "admin") return;
  if (String(conversation.provider._id || conversation.provider) !== String(userId)) {
    const err = new Error("Not authorized to access this conversation");
    err.status = 403;
    throw err;
  }
};

const listMessages = async (conversationId, userId, role) => {
  const conversation = await SupportConversation.findById(conversationId).populate(CONVERSATION_POPULATE);
  assertAccess(conversation, userId, role);

  const messages = await SupportMessage.find({ conversation: conversationId })
    .sort("createdAt")
    .populate("sender", "firstName lastName profileImage role");

  await SupportMessage.updateMany(
    { conversation: conversationId, sender: { $ne: userId }, isRead: false },
    { isRead: true }
  );

  const unreadField = role === "admin" ? "adminUnreadCount" : "providerUnreadCount";
  if (conversation[unreadField] !== 0) {
    conversation[unreadField] = 0;
    await conversation.save();
  }

  return { conversation, messages };
};

const sendMessage = async (conversationId, senderId, role, payload) => {
  const conversation = await SupportConversation.findById(conversationId).populate(CONVERSATION_POPULATE);
  assertAccess(conversation, senderId, role);

  const { type = "text", text = "", attachmentUrl = "", attachmentName = "", duration = 0 } = payload;

  const message = await SupportMessage.create({
    conversation: conversationId,
    sender: senderId,
    type,
    text,
    attachmentUrl,
    attachmentName,
    duration,
  });

  const preview =
    type === "text"
      ? text.slice(0, 140)
      : type === "image"
      ? "📷 Photo"
      : type === "document"
      ? `📄 ${attachmentName || "Document"}`
      : "🎤 Voice message";

  const otherUnreadField = role === "admin" ? "providerUnreadCount" : "adminUnreadCount";

  conversation.lastMessage = preview;
  conversation.lastMessageAt = new Date();
  conversation.lastSender = senderId;
  conversation[otherUnreadField] = (conversation[otherUnreadField] || 0) + 1;
  await conversation.save();

  const populatedMessage = await SupportMessage.findById(message._id).populate(
    "sender",
    "firstName lastName profileImage role"
  );

  // Provider sent it -> every admin should get the live push. Admin sent it
  // -> only the one provider on the thread needs it.
  const recipientIds =
    role === "admin" ? [conversation.provider._id || conversation.provider] : await getAdminIds();

  return { message: populatedMessage, conversation, recipientIds };
};

module.exports = {
  createRequest,
  listMyRequests,
  listPendingRequests,
  reviewRequest,
  getMyConversation,
  listAdminConversations,
  listMessages,
  sendMessage,
};