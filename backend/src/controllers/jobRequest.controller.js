const jobRequestService = require("../services/jobRequest.service");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const { getIO } = require("../sockets/socket");

// Same notifySocket convention already used in support.controller.js /
// invoice.controller.js / chat.controller.js — kept local to this file
// rather than shared, matching how those three do it.
const notifySocket = (userId, event, payload) => {
  try {
    getIO().to(String(userId)).emit(event, payload);
  } catch {
    // Socket.IO not initialized, or provider isn't connected right now —
    // safe to skip, the persistent Notification record already covers it.
  }
};

const createJobRequest = async (req, res) => {
  try {
    let attachmentUrls = [];
    if (req.files && req.files.length > 0) {
      const uploads = req.files.map((file) =>
        uploadToCloudinary(
          file.buffer,
          "servigo/job-requests",
          file.mimetype.startsWith("image/") ? "image" : "raw"
        )
      );
      const results = await Promise.all(uploads);
      attachmentUrls = results.map((r) => r.secure_url);
    }

    const { jobRequest, notifiedProviderIds } = await jobRequestService.createJobRequest(
      req.user._id,
      req.body,
      attachmentUrls
    );

    // Real-time push to every matching provider's own room, on top of the
    // persistent Notification already created inside the service.
    notifiedProviderIds.forEach((providerId) =>
      notifySocket(providerId, "jobRequestCreated", { jobRequest })
    );

    res.status(201).json({ success: true, message: "Job request posted successfully", data: jobRequest });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getMyJobRequests = async (req, res) => {
  try {
    const data = await jobRequestService.getMyJobRequests(req.user._id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getRelevantJobRequests = async (req, res) => {
  try {
    const result = await jobRequestService.getRelevantJobRequests(req.user._id, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getJobRequestById = async (req, res) => {
  try {
    const jobRequest = await jobRequestService.getJobRequestById(req.params.id, req.user);
    res.status(200).json({ success: true, data: jobRequest });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

const cancelJobRequest = async (req, res) => {
  try {
    const jobRequest = await jobRequestService.cancelJobRequest(req.params.id, req.user._id);
    res.status(200).json({ success: true, message: "Job request cancelled", data: jobRequest });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAllJobRequestsAdmin = async (req, res) => {
  try {
    const result = await jobRequestService.getAllJobRequestsAdmin(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createJobRequest,
  getMyJobRequests,
  getRelevantJobRequests,
  getJobRequestById,
  cancelJobRequest,
  getAllJobRequestsAdmin,
};