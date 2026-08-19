const Notification = require("../models/Notification");

const createNotification = async ({
  user,
  title,
  message,
  type,
 referenceId,
}) => {
  return await Notification.create({
    user,
    title,
    message,
    type,
    referenceId,
  });
};

const getMyNotifications = async (userId) => {
  return await Notification.find({
    user: userId,
  }).sort("-createdAt");
};

const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    {
      _id: notificationId,
      user: userId,
    },
    {
      isRead: true,
    },
    {
      new: true,
    }
  );

  if (!notification) {
    throw new Error("Notification not found");
  }

  return notification;
};

module.exports = {
  createNotification,
  getMyNotifications,
  markAsRead,
};