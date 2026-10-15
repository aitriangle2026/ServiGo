const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const User = require("../models/User");
const {
  resolveNotification,
  PREFERENCE_CATEGORIES,
  categoryOf,
  typesInCategory,
} = require("../config/notificationTypes");

// Socket event names. The client subscribes to these in
// frontend/src/context/NotificationContext.jsx.
const EVENT_NEW = "notification:new";
const EVENT_READ = "notification:read";
const EVENT_READ_ALL = "notification:readAll";

// Adds the category the client filters by, so the type→category mapping
// lives only in config/notificationTypes.js.
const withCategory = (notification) => ({
  ...(notification.toObject ? notification.toObject() : notification),
  category: categoryOf(notification.type),
});

// Pushed to the recipient's personal room (every socket joins a room named
// by its own user id — see sockets/socket.js). The persistent row is what's
// there if they're offline when this fires, so a failure here is never
// fatal: the notification is still in their list on next load.
const emitToUser = (userId, event, payload) => {
  try {
    // Required lazily: sockets/socket.js is initialised by server.js after
    // the services have already been required, and getIO() throws until
    // then.
    const { getIO } = require("../sockets/socket");
    getIO().to(String(userId)).emit(event, payload);
  } catch {
    // Socket.IO not initialised, or nobody connected on that room.
  }
};

/**
 * Creates one notification and pushes it live to its recipient.
 *
 * The headline and destination come from the catalog in
 * config/notificationTypes.js — the caller only supplies the specifics.
 *
 * @param {{
 *   user: string | import("mongoose").Types.ObjectId,
 *   type: string,
 *   audience: "customer" | "provider" | "admin",
 *   message: string,
 *   referenceId?: string | import("mongoose").Types.ObjectId | null,
 *   title?: string,
 * }} params `title` overrides the catalog headline — only for the handful
 *   of pre-catalog notifications whose wording changes with the outcome
 *   (invoice approved vs. rejected, and the same for support requests).
 */
const createNotification = async ({
  user,
  type,
  audience,
  message,
  referenceId = null,
  title,
}) => {
  // Throws on an unknown type, or one not declared for this audience —
  // better a loud failure at the trigger than a customer quietly receiving
  // a provider's alert.
  const resolved = resolveNotification(type, audience, referenceId);

  // Respect Notification Settings. Returns null when muted — callers don't
  // use the return value, they fire and forget.
  if (PREFERENCE_CATEGORIES.includes(resolved.category)) {
    const recipient = await User.findById(user).select("notificationPreferences").lean();
    if (recipient?.notificationPreferences?.[resolved.category] === false) return null;
  }

  const notification = await Notification.create({
    user,
    type,
    audience,
    title: title || resolved.title,
    message,
    link: resolved.link,
    referenceId,
  });

  emitToUser(user, EVENT_NEW, { notification: withCategory(notification) });

  return notification;
};

/**
 * Same notification to many recipients — one insertMany rather than N
 * round-trips, then one push each. Used for "tell every admin" and "tell
 * every matching provider".
 *
 * @param {Array<string | import("mongoose").Types.ObjectId>} userIds
 */
const createNotificationForMany = async (userIds, { type, audience, message, referenceId = null, title }) => {
  const recipients = (userIds || []).filter(Boolean);
  if (recipients.length === 0) return [];

  const resolved = resolveNotification(type, audience, referenceId);

  const notifications = await Notification.insertMany(
    recipients.map((user) => ({
      user,
      type,
      audience,
      title: title || resolved.title,
      message,
      link: resolved.link,
      referenceId,
    }))
  );

  notifications.forEach((notification) =>
    emitToUser(notification.user, EVENT_NEW, { notification: withCategory(notification) })
  );

  return notifications;
};

/**
 * Notifies every admin. Admins are a small, rarely-changing set, so looking
 * them up per event is cheap and always current.
 */
const notifyAdmins = async ({ type, message, referenceId = null, title }) => {
  const admins = await User.find({ role: "admin" }).select("_id");
  return createNotificationForMany(
    admins.map((admin) => admin._id),
    { type, audience: "admin", message, referenceId, title }
  );
};

/**
 * The recipient's own notifications, newest first.
 *
 * @param {string} userId
 * @param {{ page?: number, limit?: number, unreadOnly?: boolean }} query
 */
const getMyNotifications = async (userId, query = {}) => {
  const { page = 1, limit = 20, unreadOnly, category } = query;

  const filter = { user: userId };
  if (unreadOnly === true || unreadOnly === "true") filter.isRead = false;
  // Comma-separated, so "System" can span several categories in one request.
  if (category) {
    filter.type = { $in: String(category).split(",").flatMap((c) => typesInCategory(c.trim())) };
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));

  const [total, unreadCount, data] = await Promise.all([
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: userId, isRead: false }),
    Notification.find(filter)
      .sort("-createdAt")
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
  ]);

  return {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
    unreadCount,
    data: data.map(withCategory),
  };
};

const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ user: userId, isRead: false });
};

/**
 * Totals per category for the filter list — counted over everything the user
 * has, not just the page the client happens to have loaded.
 *
 * @returns {Promise<{ total: number, unread: number, categories: Record<string, { total: number, unread: number }> }>}
 */
const getSummary = async (userId) => {
  const rows = await Notification.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(String(userId)) } },
    {
      $group: {
        _id: "$type",
        total: { $sum: 1 },
        unread: { $sum: { $cond: ["$isRead", 0, 1] } },
      },
    },
  ]);

  const summary = { total: 0, unread: 0, categories: {} };
  rows.forEach(({ _id: type, total, unread }) => {
    const category = categoryOf(type);
    const bucket = (summary.categories[category] ||= { total: 0, unread: 0 });
    bucket.total += total;
    bucket.unread += unread;
    summary.total += total;
    summary.unread += unread;
  });
  return summary;
};

const getPreferences = async (userId) => {
  const user = await User.findById(userId).select("notificationPreferences").lean();
  if (!user) throw new Error("User not found");
  // Users created before the field existed have nothing stored — every
  // category defaults to on.
  return Object.fromEntries(
    PREFERENCE_CATEGORIES.map((category) => [category, user.notificationPreferences?.[category] !== false])
  );
};

/** Only known categories and real booleans are accepted; anything else is ignored. */
const updatePreferences = async (userId, changes = {}) => {
  const update = {};
  PREFERENCE_CATEGORIES.forEach((category) => {
    if (typeof changes[category] === "boolean") {
      update[`notificationPreferences.${category}`] = changes[category];
    }
  });
  if (Object.keys(update).length === 0) throw new Error("Nothing to update");

  await User.updateOne({ _id: userId }, { $set: update });
  return getPreferences(userId);
};

const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    throw new Error("Notification not found");
  }

  // Keeps a second open tab's badge in step with the one that read it.
  const unreadCount = await getUnreadCount(userId);
  emitToUser(userId, EVENT_READ, { notificationId: String(notification._id), unreadCount });

  return notification;
};

const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { user: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  emitToUser(userId, EVENT_READ_ALL, { unreadCount: 0 });

  return { updated: result.modifiedCount ?? 0 };
};

const deleteNotification = async (notificationId, userId) => {
  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    user: userId,
  });

  if (!notification) {
    throw new Error("Notification not found");
  }

  return notification;
};

module.exports = {
  createNotification,
  createNotificationForMany,
  notifyAdmins,
  getMyNotifications,
  getUnreadCount,
  getSummary,
  getPreferences,
  updatePreferences,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
