const express = require("express");
const router = express.Router();

const proposalController = require("../controllers/proposal.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

router.use(protect);

// /api/v1/proposals/:id/...
router.put("/:id/accept", authorize("customer"), proposalController.acceptProposal);
router.put("/:id/reject", authorize("customer"), proposalController.rejectProposal);
router.put("/:id/withdraw", authorize("provider"), proposalController.withdrawProposal);

module.exports = router;
