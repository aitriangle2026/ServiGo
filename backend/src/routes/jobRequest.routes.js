const express = require("express");
const router = express.Router();

const jobRequestController = require("../controllers/jobRequest.controller");
const { protect, authorize } = require("../middleware/auth.middleware");
const { uploadJobRequestAttachments } = require("../middleware/upload.middleware");

// Literal-segment routes registered ahead of the "/:id" catch-all below,
// same discipline as the rest of this codebase's routers.
router.post(
  "/",
  protect,
  authorize("customer"),
  uploadJobRequestAttachments,
  jobRequestController.createJobRequest
);

router.get("/mine", protect, authorize("customer"), jobRequestController.getMyJobRequests);

router.get("/relevant", protect, authorize("provider"), jobRequestController.getRelevantJobRequests);

router.get("/admin", protect, authorize("admin"), jobRequestController.getAllJobRequestsAdmin);

router.get("/:id", protect, jobRequestController.getJobRequestById);

router.put("/:id/cancel", protect, authorize("customer"), jobRequestController.cancelJobRequest);

module.exports = router;