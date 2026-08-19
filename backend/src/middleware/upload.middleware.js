const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
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
};