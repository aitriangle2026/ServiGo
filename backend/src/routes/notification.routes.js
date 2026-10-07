const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notification.controller");
const { protect } = require("../middleware/auth.middleware");

router.use(protect);

// Literal segments ahead of the "/:id" routes below.
router.get("/", notificationController.getMyNotifications);
router.get("/unread-count", notificationController.getUnreadCount);
router.put("/read-all", notificationController.markAllAsRead);

router.put("/:id/read", notificationController.markAsRead);
router.delete("/:id", notificationController.deleteNotification);

module.exports = router;
