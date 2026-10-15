const express = require("express");
const router = express.Router();

const jobRequestController = require("../controllers/jobRequest.controller");
const proposalController = require("../controllers/proposal.controller");
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

// Provider's Service Requests view: every request they can act on, with its stage.
router.get("/pipeline", protect, authorize("provider"), proposalController.getProviderPipeline);

router.get("/:id", protect, jobRequestController.getJobRequestById);

// Quotes
router.post("/:id/proposals", protect, authorize("provider"), proposalController.submitProposal);
router.get("/:id/proposals", protect, authorize("customer"), proposalController.listForCustomer);
router.put("/:id/dismiss", protect, authorize("provider"), proposalController.dismiss);
router.put("/:id/undismiss", protect, authorize("provider"), proposalController.undismiss);

router.put("/:id/cancel", protect, authorize("customer"), jobRequestController.cancelJobRequest);

module.exports = router;