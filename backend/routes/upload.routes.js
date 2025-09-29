const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const {
  userPhotoUpload,
  uploadDocument,
  deleteFile,
} = require('../controllers/upload.controller');

// Protected routes - user must be logged in
router.use(protect);

// User photo upload
router.route('/users/:id/photo').put(uploadSingle('photo'), userPhotoUpload);

// Document upload
router
  .route('/users/:id/documents/:type')
  .put(authorize('admin'), uploadSingle('document'), uploadDocument);

// Delete file (admin only)
router.route('/:public_id').delete(authorize('admin'), deleteFile);

module.exports = router;
