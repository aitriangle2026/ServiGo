const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const ProviderProfile = require("../models/ProviderProfile");

const CONVO_POPULATE = [
  { path: "customer", select: "firstName lastName email phone profileImage" },
  {
    path: "provider",
    select: "profileImage bio user",
    populate: { path: "user", select: "firstName lastName email phone profileImage" },
  },
  { path: "service", select: "title images price priceType" },
];

// Every conversation participant check boils down to: is this userId either
// the customer, or the User behind the provider's ProviderProfile?
const isParticipant = (conversation, userId) => {
  const uid = String(userId);
  if (String(conversation.customer?._id || conversation.customer) === uid) return true;
  const providerUser = conversation.provider?.user;
  const providerUserId = providerUser?._id || providerUser;
  return providerUserId && String(providerUserId) === uid;
};

const getRole = (conversation, userId) => {
  const uid = String(userId);
  return String(conversation.customer?._id || conversation.customer) === uid ? "customer" : "provider";
};

const assertParticipant = (conversation, userId) => {
  if (!conversation) throw new Error("Conversation not found");
  if (!isParticipant(conversation, userId)) {
    const err = new Error("Not authorized to access this conversation");
    err.status = 403;
    throw err;
  }
};

// Resolves the *other* participant's User id, for Socket.IO room targeting
// (rooms are keyed by User id — see sockets/socket.js).
const getOtherUserId = (conversation, userId) => {
  const uid = String(userId);
  const customerId = String(conversation.customer?._id || conversation.customer);
  const providerUser = conversation.provider?.user;
  const providerUserId = String(providerUser?._id || providerUser);
  return uid === customerId ? providerUserId : customerId;
};

const getOrCreateConversation = async (customerId, providerProfileId, serviceId) => {
  const providerProfile = await ProviderProfile.findById(providerProfileId);
  if (!providerProfile) throw new Error("Provider not found");

  if (String(providerProfile.user) === String(customerId)) {
    throw new Error("You can't start a conversation with yourself");
  }

  let conversation = await Conversation.findOne({
    customer: customerId,
    provider: providerProfileId,
  });

  if (!conversation) {
    conversation = await Conversation.create({
      customer: customerId,
      provider: providerProfileId,
      service: serviceId || null,
    });
  } else if (serviceId && !conversation.service) {
    conversation.service = serviceId;
    await conversation.save();
  }

  return Conversation.findById(conversation._id).populate(CONVO_POPULATE);
};

const listConversations = async (userId, role) => {
  const filter =
    role === "provider"
      ? { provider: (await ProviderProfile.findOne({ user: userId }))?._id }
      : { customer: userId };

  if (role === "provider" && !filter.provider) return [];

  return Conversation.find(filter).sort("-lastMessageAt").populate(CONVO_POPULATE);
};

const getConversation = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId).populate(CONVO_POPULATE);
  assertParticipant(conversation, userId);
  return conversation;
};

const listMessages = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId).populate(CONVO_POPULATE);
  assertParticipant(conversation, userId);

  const messages = await Message.find({ conversation: conversationId })
    .sort("createdAt")
    .populate("sender", "firstName lastName profileImage role")
    .populate({
      path: "invoice",
      select:
        "items subtotal notes status proposedDate proposedTime commissionAmount providerPayoutAmount paidAt releasedAt",
    });

  // Mark everything the other side sent as read, and clear this role's
  // unread counter on the conversation.
  await Message.updateMany(
    { conversation: conversationId, sender: { $ne: userId }, isRead: false },
    { isRead: true }
  );

  const role = getRole(conversation, userId);
  const unreadField = role === "customer" ? "customerUnreadCount" : "providerUnreadCount";
  if (conversation[unreadField] !== 0) {
    conversation[unreadField] = 0;
    await conversation.save();
  }

  return { conversation, messages };
};

const sendMessage = async (conversationId, senderId, payload) => {
  const conversation = await Conversation.findById(conversationId).populate(CONVO_POPULATE);
  assertParticipant(conversation, senderId);

  const { type = "text", text = "", attachmentUrl = "", attachmentName = "", duration = 0, invoice = null } =
    payload;

  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    type,
    text,
    attachmentUrl,
    attachmentName,
    duration,
    invoice,
  });

  const preview =
    type === "text"
      ? text.slice(0, 140)
      : type === "image"
      ? "📷 Photo"
      : type === "document"
      ? `📄 ${attachmentName || "Document"}`
      : type === "voice"
      ? "🎤 Voice message"
      : type === "invoice"
      ? "🧾 Invoice"
      : "Call";

  const role = getRole(conversation, senderId);
  const otherUnreadField = role === "customer" ? "providerUnreadCount" : "customerUnreadCount";

  conversation.lastMessage = preview;
  conversation.lastMessageAt = new Date();
  conversation.lastSender = senderId;
  conversation[otherUnreadField] = (conversation[otherUnreadField] || 0) + 1;
  await conversation.save();

  const populatedMessage = await Message.findById(message._id)
    .populate("sender", "firstName lastName profileImage role")
    .populate({
      path: "invoice",
      select:
        "items subtotal notes status proposedDate proposedTime commissionAmount providerPayoutAmount paidAt releasedAt",
    });

  return {
    message: populatedMessage,
    conversation,
    recipientUserId: getOtherUserId(conversation, senderId),
  };
};

module.exports = {
  getOrCreateConversation,
  listConversations,
  getConversation,
  listMessages,
  sendMessage,
  assertParticipant,
  getOtherUserId,
  getRole,
};