const cloudinary = require("../config/cloudinary");

// resourceType: "image" (default, existing behavior) | "video" (Cloudinary
// stores audio files, e.g. chat voice notes, under "video") | "raw" (PDFs,
// docs, and anything else that isn't image/audio/video).
const uploadToCloudinary = (fileBuffer, folder, resourceType = "image") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
         return reject(error);
        }

        resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
};

module.exports = uploadToCloudinary;