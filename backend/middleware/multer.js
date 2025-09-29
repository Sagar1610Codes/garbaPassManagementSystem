const multer = require('multer');
const path = require('path');
const ErrorResponse = require('../utils/errorResponse');

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter for allowed file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ErrorResponse('Invalid file type. Only JPEG, PNG, and PDF files are allowed.', 400), false);
  }
};

// Initialize multer with configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: fileFilter,
});

// Middleware for handling file uploads
const uploadFiles = (req, res, next) => {
  // Create upload directory if it doesn't exist
  const uploadDir = './public/uploads';
  const fs = require('fs');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const uploadHandler = upload.fields([
    { name: 'aadharPhoto', maxCount: 1 },
    { name: 'collegeIdPhoto', maxCount: 1 },
  ]);

  uploadHandler(req, res, function (err) {
    if (err) {
      console.error('File upload error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ErrorResponse('File size too large. Maximum size is 5MB.', 400));
      } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(new ErrorResponse('Unexpected file field. Please upload only Aadhar and College ID photos.', 400));
      } else if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        return next(new ErrorResponse(`File upload error: ${err.message}`, 400));
      } else {
        // An unknown error occurred
        return next(new ErrorResponse('Error uploading files. Please try again.', 500));
      }
    }
    
    // Log uploaded files for debugging
    if (req.files) {
      console.log('Uploaded files:', req.files);
      
      // Make file paths available in the request
      if (req.files.aadharPhoto) {
        req.aadharPhotoPath = req.files.aadharPhoto[0].path;
      }
      if (req.files.collegeIdPhoto) {
        req.collegeIdPhotoPath = req.files.collegeIdPhoto[0].path;
      }
    }
    
    // Continue to the next middleware
    next();
  });
};

module.exports = uploadFiles;
