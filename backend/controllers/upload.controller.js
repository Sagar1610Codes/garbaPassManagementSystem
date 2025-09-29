const ErrorResponse = require('../utils/errorResponse');
const { cloudinary } = require('../middleware/upload');
const User = require('../models/user.model');
const asyncHandler = require('../middleware/async');

// @desc    Upload photo for user
// @route   PUT /api/v1/users/:id/photo
// @access  Private
exports.userPhotoUpload = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if file is uploaded
  if (!req.file) {
    return next(new ErrorResponse(`Please upload a file`, 400));
  }

  // Update user with photo
  user.photo = req.file.path;
  await user.save();

  res.status(200).json({
    success: true,
    data: user.photo,
  });
});

// @desc    Upload document for user (college ID, Aadhar, etc.)
// @route   PUT /api/v1/users/:id/documents/:type
// @access  Private
exports.uploadDocument = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  const { type } = req.params;

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if file is uploaded
  if (!req.file) {
    return next(new ErrorResponse(`Please upload a file`, 400));
  }

  // Validate document type
  const validTypes = ['collegeId', 'aadhar'];
  if (!validTypes.includes(type)) {
    return next(new ErrorResponse(`Invalid document type: ${type}`, 400));
  }

  // Delete previous file if exists
  if (user[`${type}Photo`]) {
    const publicId = user[`${type}Photo`].split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(`garba-pass/${publicId}`);
  }

  // Update user with document
  user[`${type}Photo`] = req.file.path;
  await user.save();

  res.status(200).json({
    success: true,
    data: user[`${type}Photo`],
  });
});

// @desc    Delete file
// @route   DELETE /api/v1/upload/:public_id
// @access  Private/Admin
exports.deleteFile = asyncHandler(async (req, res, next) => {
  const { public_id } = req.params;

  try {
    await cloudinary.uploader.destroy(`garba-pass/${public_id}`);
    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    return next(new ErrorResponse('File could not be deleted', 500));
  }
});
