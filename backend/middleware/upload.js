const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const ErrorResponse = require('../utils/errorResponse');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set storage engine for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'garba-pass',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  },
});

// Check file type
const fileFilter = (req, file, cb) => {
  // Allowed extensions
  const filetypes = /jpeg|jpg|png|pdf/;
  // Check extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime type
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(
      new ErrorResponse(
        'Error: Images and PDFs only (JPEG, JPG, PNG, PDF)!',
        400
      ),
      false
    );
  }
};

// Initialize upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter,
});

// Single file upload
const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    const uploadItem = upload.single(fieldName);

    uploadItem(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        return next(new ErrorResponse(err.message, 400));
      } else if (err) {
        // An unknown error occurred
        return next(err);
      }
      next();
    });
  };
};

// Multiple files upload
const uploadMultiple = (fieldName, maxCount) => {
  return (req, res, next) => {
    const uploadItems = upload.array(fieldName, maxCount || 10);

    uploadItems(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        return next(new ErrorResponse(err.message, 400));
      } else if (err) {
        // An unknown error occurred
        return next(err);
      }
      next();
    });
  };
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  cloudinary,
};
