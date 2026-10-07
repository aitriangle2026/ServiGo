const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

// Chat attachments (images, PDFs/docs, voice recordings) get a larger cap
// than profile photos — voice notes and phone photos routinely exceed 5MB.
const uploadChat = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB
  },
});

module.exports = {
  uploadProfileImage: upload.single("image"),
  uploadServiceImages: upload.array("images", 5),
  uploadPortfolioImages: upload.array("portfolioImages", 10),
  uploadNicImages: upload.fields([
    { name: "nicFrontImage", maxCount: 1 },
    { name: "nicBackImage", maxCount: 1 },
  ]),
  uploadChatAttachment: uploadChat.single("file"),
  // Job request attachments are the same mix of phone photos and documents
  // that chat handles (a customer photographing a broken pipe, or attaching
  // a quote they already have), so they share the larger 20MB cap rather
  // than the 5MB profile-photo one.
  uploadJobRequestAttachments: uploadChat.array("attachments", 5),
  uploadSelfieImage: upload.single("selfie"),
  uploadCertificateFile: upload.single("file"),
};