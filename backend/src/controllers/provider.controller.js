const providerService = require("../services/provider.service");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

const createProfile = async (req, res) => {
  try {
    const profile = await providerService.createProfile(
      req.user._id,
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Provider profile created successfully",
      data: profile,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getMyProfile = async (req, res) => {
  try {
    const profile = await providerService.getMyProfile(
      req.user._id
    );

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const profile = await providerService.updateProfile(
      req.user._id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Provider profile updated successfully",
      data: profile,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded",
      });
    }

    const result = await uploadToCloudinary(
      req.file.buffer,
      "service-marketplace/profile-images"
    );

    const profile = await providerService.uploadProfileImage(
      req.user._id,
      result.secure_url
    );

    res.status(200).json({
      success: true,
      message: "Profile image uploaded successfully",
      data: profile,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllProviders = async (req, res) => {
  try {
    const result = await providerService.getAllProviders(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getProviderById = async (req, res) => {
  try {
    const provider = await providerService.getProviderById(req.params.id);
    res.status(200).json({ success: true, data: provider });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

const getPendingProviders = async (req, res) => {
  try {
    const providers = await providerService.getPendingProviders();
    res.status(200).json({ success: true, count: providers.length, data: providers });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateVerificationStatus = async (req, res) => {
  try {
    const provider = await providerService.updateVerificationStatus(
      req.params.id,
      req.body.status
    );
    res.status(200).json({
      success: true,
      message: `Provider ${req.body.status} successfully`,
      data: provider,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const uploadNicImages = async (req, res) => {
  try {
    if (!req.files || (!req.files.nicFrontImage && !req.files.nicBackImage)) {
      return res.status(400).json({
        success: false,
        message: "At least one NIC image is required",
      });
    }

    const uploads = {};

    if (req.files.nicFrontImage) {
      const result = await uploadToCloudinary(
        req.files.nicFrontImage[0].buffer,
        "service-marketplace/nic-images"
      );
      uploads.nicFrontImage = result.secure_url;
    }

    if (req.files.nicBackImage) {
      const result = await uploadToCloudinary(
        req.files.nicBackImage[0].buffer,
        "service-marketplace/nic-images"
      );
      uploads.nicBackImage = result.secure_url;
    }

    const profile = await providerService.uploadNicImages(req.user._id, uploads);

    res.status(200).json({
      success: true,
      message: "NIC images uploaded successfully",
      data: profile,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createProfile,
  getMyProfile,
  updateProfile,
  uploadProfileImage,
  getAllProviders,
  getProviderById,
  getPendingProviders,
  updateVerificationStatus,
  uploadNicImages,
};