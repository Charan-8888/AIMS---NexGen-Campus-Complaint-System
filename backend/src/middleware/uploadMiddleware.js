const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const env = require('../config/environment');
const { sendError } = require('../utils/apiResponse');

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

// Use memory storage (buffer) — upload to Cloudinary manually
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed. Only images are accepted.`), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: (env.MAX_FILE_SIZE_MB || 10) * 1024 * 1024, // bytes
  },
  fileFilter,
});

/**
 * Upload a buffer to Cloudinary.
 * @param {Buffer} buffer
 * @param {string} folder - Cloudinary folder path
 * @param {string} filename - public_id prefix
 * @returns {Promise<{ url: string, publicId: string }>}
 */
const uploadToCloudinary = (buffer, folder = 'aims-campus/complaints', filename = '') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: filename || undefined,
        resource_type: 'image',
        quality: 'auto',
        fetch_format: 'auto',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    uploadStream.end(buffer);
  });
};

/**
 * Delete a file from Cloudinary.
 */
const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    // Log but don't throw — cleanup failure shouldn't crash the request
    console.warn(`[Cloudinary] Failed to delete ${publicId}:`, err.message);
  }
};

module.exports = { upload, uploadToCloudinary, deleteFromCloudinary, cloudinary };
