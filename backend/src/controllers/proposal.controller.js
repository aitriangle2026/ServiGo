const proposalService = require("../services/proposal.service");

// Every handler has the same shape: call the service, 200 with its result,
// or 400 with its message.
const handle = (fn, status = 200) => async (req, res) => {
  try {
    const data = await fn(req);
    res.status(status).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  // Provider
  getProviderPipeline: handle((req) => proposalService.getProviderPipeline(req.user._id)),
  submitProposal: handle((req) => proposalService.submitProposal(req.user._id, req.params.id, req.body), 201),
  withdrawProposal: handle((req) => proposalService.withdrawProposal(req.user._id, req.params.id)),
  dismiss: handle((req) => proposalService.setDismissed(req.user._id, req.params.id, true)),
  undismiss: handle((req) => proposalService.setDismissed(req.user._id, req.params.id, false)),

  // Customer
  listForCustomer: handle((req) => proposalService.listForCustomer(req.user._id, req.params.id)),
  acceptProposal: handle((req) => proposalService.acceptProposal(req.user._id, req.params.id)),
  rejectProposal: handle((req) => proposalService.rejectProposal(req.user._id, req.params.id)),
};
