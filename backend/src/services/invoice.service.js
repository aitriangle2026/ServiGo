const Invoice = require("../models/Invoice");
const Conversation = require("../models/Conversation");
const Booking = require("../models/Booking");
const ProviderProfile = require("../models/ProviderProfile");
const User = require("../models/User");
const chatService = require("./chat.service");
const notificationService = require("./notification.service");
const { COMMISSION_RATE } = require("../config/commission");
const { formatCurrency } = require("../utils/formatCurrency");

const INVOICE_POPULATE = [
  { path: "customer", select: "firstName lastName email phone" },
  { path: "provider", select: "profileImage bio user", populate: { path: "user", select: "firstName lastName email phone" } },
  { path: "service", select: "title" },
  { path: "booking", select: "status bookingDate bookingTime" },
];

const createInvoice = async (providerUserId, conversationId, payload) => {
  const conversation = await Conversation.findById(conversationId).populate("provider");
  if (!conversation) throw new Error("Conversation not found");

  if (String(conversation.provider.user) !== String(providerUserId)) {
    const err = new Error("Only the provider in this conversation can send an invoice");
    err.status = 403;
    throw err;
  }

  const { items, notes = "", proposedDate = null, proposedTime = "" } = payload;

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Add at least one line item");
  }

  const cleanItems = items.map((item) => ({
    description: String(item.description || "").trim(),
    amount: Number(item.amount) || 0,
  }));

  if (cleanItems.some((item) => !item.description || item.amount <= 0)) {
    throw new Error("Every line item needs a description and an amount greater than 0");
  }

  const subtotal = cleanItems.reduce((sum, item) => sum + item.amount, 0);

  const invoice = await Invoice.create({
    conversation: conversationId,
    provider: conversation.provider._id,
    customer: conversation.customer,
    service: conversation.service || null,
    items: cleanItems,
    subtotal,
    notes,
    proposedDate,
    proposedTime,
  });

  // The chat message (and its invoice card) is visible to the customer
  // right away — as "Awaiting ServiGo review" with no action buttons — so
  // they know a quote is coming, even though they can't act on it until an
  // admin vets it below.
  const { message, recipientUserId } = await chatService.sendMessage(conversationId, providerUserId, {
    type: "invoice",
    text: `Invoice sent — ${formatCurrency(subtotal)}`,
    invoice: invoice._id,
  });

  await notificationService.notifyAdmins({
    type: "invoice_pending_admin",
    message: `A new invoice for ${formatCurrency(subtotal)} needs your approval before it reaches the customer.`,
    referenceId: invoice._id,
  });

  return { invoice: await Invoice.findById(invoice._id).populate(INVOICE_POPULATE), message, recipientUserId };
};

const listPendingAdminReview = async () => {
  return Invoice.find({ status: "pending_admin" }).sort("createdAt").populate(INVOICE_POPULATE);
};

// The gate between "provider sent a quote" and "customer can act on it".
const adminReviewInvoice = async (adminUserId, invoiceId, { action, rejectionReason = "" }) => {
  const invoice = await Invoice.findById(invoiceId).populate("provider");
  if (!invoice) throw new Error("Invoice not found");

  if (invoice.status !== "pending_admin") {
    throw new Error(`This invoice already left admin review — current status is "${invoice.status}"`);
  }

  invoice.adminReviewedAt = new Date();
  invoice.adminReviewedBy = adminUserId;

  if (action === "approve") {
    invoice.status = "awaiting_customer";
  } else if (action === "reject") {
    invoice.status = "rejected_by_admin";
    invoice.adminRejectionReason = rejectionReason;
  } else {
    throw new Error("action must be 'approve' or 'reject'");
  }

  await invoice.save();

  if (action === "approve") {
    await notificationService.createNotification({
      user: invoice.customer,
      type: "invoice_received",
      audience: "customer",
      message: `You received an invoice for ${formatCurrency(invoice.subtotal)}`,
      referenceId: invoice._id,
    });
  }

  await notificationService.createNotification({
    user: invoice.provider.user,
    type: "invoice_reviewed",
    audience: "provider",
    title: action === "approve" ? "Invoice approved by ServiGo" : "Invoice rejected by ServiGo",
    message:
      action === "approve"
        ? `Your invoice for ${formatCurrency(invoice.subtotal)} passed review and is now with the customer.`
        : `Your invoice for ${formatCurrency(invoice.subtotal)} was rejected before reaching the customer${
            rejectionReason ? `: ${rejectionReason}` : "."
          }`,
    referenceId: invoice._id,
  });

  return Invoice.findById(invoice._id).populate(INVOICE_POPULATE);
};

const getInvoice = async (invoiceId, userId) => {
  const invoice = await Invoice.findById(invoiceId).populate(INVOICE_POPULATE);
  if (!invoice) throw new Error("Invoice not found");

  const uid = String(userId);
  const providerUserId = String(invoice.provider.user._id || invoice.provider.user);
  if (String(invoice.customer._id) !== uid && providerUserId !== uid) {
    const err = new Error("Not authorized to view this invoice");
    err.status = 403;
    throw err;
  }

  return invoice;
};

const respondToInvoice = async (customerId, invoiceId, { action, rejectionReason = "" }) => {
  const invoice = await Invoice.findById(invoiceId).populate("provider");
  if (!invoice) throw new Error("Invoice not found");

  if (String(invoice.customer) !== String(customerId)) {
    const err = new Error("Not authorized to respond to this invoice");
    err.status = 403;
    throw err;
  }

  if (invoice.status !== "awaiting_customer") {
    throw new Error(
      invoice.status === "pending_admin"
        ? "This invoice is still awaiting ServiGo's review"
        : `This invoice is already ${invoice.status}`
    );
  }

  if (action === "reject") {
    invoice.status = "rejected";
    invoice.rejectionReason = rejectionReason;
  } else if (action === "approve") {
    invoice.status = "approved";
    invoice.commissionRate = COMMISSION_RATE;
    invoice.commissionAmount = Math.round(invoice.subtotal * COMMISSION_RATE * 100) / 100;
    invoice.providerPayoutAmount = Math.round((invoice.subtotal - invoice.commissionAmount) * 100) / 100;
  } else {
    throw new Error("action must be 'approve' or 'reject'");
  }

  await invoice.save();

  await chatService.sendMessage(invoice.conversation, customerId, {
    type: "text",
    text:
      action === "approve"
        ? `✅ Invoice approved — ${formatCurrency(invoice.subtotal)}. Awaiting payment.`
        : `❌ Invoice declined${rejectionReason ? `: ${rejectionReason}` : "."}`,
  });

  await notificationService.createNotification({
    user: invoice.provider.user,
    type: "invoice_responded",
    audience: "provider",
    title: action === "approve" ? "Invoice approved" : "Invoice declined",
    message:
      action === "approve"
        ? `Your invoice for ${formatCurrency(invoice.subtotal)} was approved. Waiting on payment.`
        : `Your invoice for ${formatCurrency(invoice.subtotal)} was declined${
            rejectionReason ? `: ${rejectionReason}` : "."
          }`,
    referenceId: invoice._id,
  });

  return Invoice.findById(invoice._id).populate(INVOICE_POPULATE);
};

// Stands in for a real payment gateway (e.g. PayHere/Stripe) capturing the
// customer's payment. Swap this function's body for a real charge call —
// everything downstream (escrow status, commission math, admin payout,
// provider notification) already assumes "paid" means funds are being held
// by the platform, not yet by the provider.
const payInvoice = async (customerId, invoiceId, { address = "", bookingDate = null, bookingTime = "" }) => {
  const invoice = await Invoice.findById(invoiceId).populate("provider");
  if (!invoice) throw new Error("Invoice not found");

  if (String(invoice.customer) !== String(customerId)) {
    const err = new Error("Not authorized to pay this invoice");
    err.status = 403;
    throw err;
  }

  if (invoice.status !== "approved") {
    throw new Error(`This invoice can't be paid — current status is "${invoice.status}"`);
  }

  invoice.status = "paid";
  invoice.paidAt = new Date();
  invoice.paymentMethod = "manual";

  const booking = await Booking.create({
    customer: customerId,
    provider: invoice.provider._id,
    service: invoice.service || null,
    invoice: invoice._id,
    bookingDate: bookingDate || invoice.proposedDate || null,
    bookingTime: bookingTime || invoice.proposedTime || "",
    address,
    notes: invoice.notes || "",
    totalPrice: invoice.subtotal,
    status: "accepted",
  });

  invoice.booking = booking._id;
  await invoice.save();

  await chatService.sendMessage(invoice.conversation, customerId, {
    type: "text",
    text: `💳 Payment received — ${formatCurrency(invoice.subtotal)}. The job is confirmed.`,
  });

  // Both sides of a successful payment, each with its own headline
  // ("Payment Successful" vs "Payment Received").
  await Promise.all([
    notificationService.createNotification({
      user: customerId,
      type: "payment_success",
      audience: "customer",
      message: `Your payment of ${formatCurrency(invoice.subtotal)} went through. The job is confirmed.`,
      referenceId: invoice._id,
    }),
    notificationService.createNotification({
      user: invoice.provider.user,
      type: "payment_success",
      audience: "provider",
      message: `The customer paid ${formatCurrency(
        invoice.subtotal
      )}. It's held by ServiGo and will be released to you (minus commission) once an admin processes the payout.`,
      referenceId: invoice._id,
    }),
  ]);

  return { invoice: await Invoice.findById(invoice._id).populate(INVOICE_POPULATE), booking };
};

const listPendingPayouts = async () => {
  return Invoice.find({ status: "paid" }).sort("paidAt").populate(INVOICE_POPULATE);
};

const releasePayout = async (adminUserId, invoiceId) => {
  const invoice = await Invoice.findById(invoiceId).populate("provider");
  if (!invoice) throw new Error("Invoice not found");

  if (invoice.status !== "paid") {
    throw new Error(`Only paid invoices can be released — current status is "${invoice.status}"`);
  }

  invoice.status = "payout_released";
  invoice.releasedAt = new Date();
  invoice.releasedBy = adminUserId;
  await invoice.save();

  await notificationService.createNotification({
    user: invoice.provider.user,
    type: "earnings_update",
    audience: "provider",
    message: `${formatCurrency(invoice.providerPayoutAmount)} was sent to you for invoice ${String(
      invoice._id
    ).slice(-6).toUpperCase()} — ServiGo commission: ${formatCurrency(invoice.commissionAmount)} (${(
      invoice.commissionRate * 100
    ).toFixed(0)}%).`,
    referenceId: invoice._id,
  });

  return Invoice.findById(invoice._id).populate(INVOICE_POPULATE);
};

const listMyInvoices = async (userId, role) => {
  if (role === "provider") {
    const profile = await ProviderProfile.findOne({ user: userId });
    if (!profile) return [];
    return Invoice.find({ provider: profile._id }).sort("-createdAt").populate(INVOICE_POPULATE);
  }
  return Invoice.find({ customer: userId }).sort("-createdAt").populate(INVOICE_POPULATE);
};

module.exports = {
  createInvoice,
  getInvoice,
  listPendingAdminReview,
  adminReviewInvoice,
  respondToInvoice,
  payInvoice,
  listPendingPayouts,
  releasePayout,
  listMyInvoices,
};