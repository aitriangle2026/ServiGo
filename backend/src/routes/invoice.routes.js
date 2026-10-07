const express = require("express");
const router = express.Router();

const invoiceController = require("../controllers/invoice.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

router.use(protect);

router.post(
  "/conversations/:conversationId",
  authorize("provider"),
  invoiceController.createInvoice
);

router.get("/mine", invoiceController.listMyInvoices);

// Admin queues — must stay ahead of the generic "/:id" route below.
router.get("/admin/pending", authorize("admin"), invoiceController.listPendingAdminReview);
router.get("/payouts/pending", authorize("admin"), invoiceController.listPendingPayouts);

router.get("/:id", invoiceController.getInvoice);
router.put("/:id/admin-review", authorize("admin"), invoiceController.adminReview);
router.put("/:id/respond", authorize("customer"), invoiceController.respondToInvoice);
router.put("/:id/pay", authorize("customer"), invoiceController.payInvoice);
router.put("/:id/release", authorize("admin"), invoiceController.releasePayout);

module.exports = router;