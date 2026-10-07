const express = require("express");
const router = express.Router();

const supportController = require("../controllers/support.controller");
const { protect, authorize } = require("../middleware/auth.middleware");
const { uploadChatAttachment } = require("../middleware/upload.middleware");

router.use(protect);

// Provider: submit a request, track its own requests
router.post("/requests", authorize("provider"), supportController.createRequest);
router.get("/requests/mine", authorize("provider"), supportController.listMyRequests);

// Admin: review queue
router.get("/requests/pending", authorize("admin"), supportController.listPendingRequests);
router.put("/requests/:id/review", authorize("admin"), supportController.reviewRequest);

// Conversations — literal routes stay ahead of the generic "/:id" route below.
router.get("/conversations/mine", authorize("provider"), supportController.getMyConversation);
router.get("/conversations/admin", authorize("admin"), supportController.listAdminConversations);
router.get("/conversations/:id/messages", supportController.getMessages);
router.post("/conversations/:id/messages", uploadChatAttachment, supportController.sendMessage);

module.exports = router;