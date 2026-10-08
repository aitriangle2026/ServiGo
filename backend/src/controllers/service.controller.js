const serviceService = require("../services/service.service");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

const createService = async (req, res) => {
  try {
    const { workDetails, duration, tags, ...rest } = req.body;

    const service = await serviceService.createService(
      req.user._id,
      {
        ...rest,
        workDetails,
        duration,
        tags,
      }
    );

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: service,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllServices = async (req, res) => {
  try {
    const result = await serviceService.getAllServices(req.query, req.user);

    res.status(200).json({
      success: true,
      ...result,
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getServiceById = async (req, res) => {
  try {
    const service = await serviceService.getServiceById(req.params.id);

    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const updateService = async (req, res) => {
  try {
    const { workDetails, duration, tags, ...rest } = req.body;

    const service = await serviceService.updateService(
      req.params.id,
      req.user._id,
      {
        ...rest,
        workDetails,
        duration,
        tags,
      }
    );

    res.status(200).json({
      success: true,
      message: "Service updated successfully",
      data: service,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteService = async (req, res) => {
  try {
    await serviceService.deleteService(req.params.id, req.user._id);

    res.status(200).json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const uploadServiceImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No images uploaded",
      });
    }

    const imageUrls = [];

    for (const file of req.files) {
      const result = await uploadToCloudinary(
        file.buffer,
        "service-marketplace/service-images"
      );

      imageUrls.push(result.secure_url);
    }

    const service = await serviceService.uploadServiceImages(
      req.params.id,
      req.user._id,
      imageUrls
    );

    res.status(200).json({
      success: true,
      message: "Service images uploaded successfully",
      data: service,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const uploadPortfolioImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No portfolio images uploaded",
      });
    }

    const uploadPromises = req.files.map((file) =>
      uploadToCloudinary(
        file.buffer,
        "service-marketplace/portfolio-images"
      )
    );

    const uploadResults = await Promise.all(uploadPromises);
    const imageUrls = uploadResults.map((result) => result.secure_url);

    const service = await serviceService.uploadPortfolioImages(
      req.params.id,
      req.user._id,
      imageUrls
    );

    res.status(200).json({
      success: true,
      message: "Portfolio images uploaded successfully",
      data: service,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getServiceAvailability = async (req, res) => {
  try {
    const result = await serviceService.getServiceAvailability(req.params.id, req.query.date);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getServiceAvailability,
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService,
  uploadServiceImages,
  uploadPortfolioImages,
};