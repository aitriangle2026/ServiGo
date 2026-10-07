const express = require("express");
const router = express.Router();

const chatController = require("../controllers/chat.controller");
const { protect } = require("../middleware/auth.middleware");
const { uploadChatAttachment } = require("../middleware/upload.middleware");

router.use(protect);

router.post("/conversations", chatController.startConversation);
router.get("/conversations", chatController.getConversations);
router.get("/conversations/:id/messages", chatController.getMessages);
router.post("/conversations/:id/messages", uploadChatAttachment, chatController.sendMessage);

module.exports = router;