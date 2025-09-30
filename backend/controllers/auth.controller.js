const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/user.model');
const sendEmail = require('../utils/sendEmail');
const { sendGarbaPassEmail } = require('../utils/garbaPassEmail');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../middleware/asyncHandler')

// @desc    Register user with invitation token
// @route   POST /api/v1/auth/register/:token
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const { name, password, college, aadharNumber } = req.body;

  console.log('Registration request received:', { 
    token,
    name: !!name,
    college: !!college,
    aadharNumber: !!aadharNumber,
    hasAadharPhoto: !!(req.files && req.files.aadharPhoto),
    hasCollegeIdPhoto: !!(req.files && req.files.collegeIdPhoto)
  });

  // Validate required fields
  if (!name || !password || !college || !aadharNumber) {
    return next(new ErrorResponse('Please provide all required fields: name, password, college, and Aadhar number', 400));
  }

  // Check if files were uploaded
  if (!req.files || !req.files.aadharPhoto || !req.files.collegeIdPhoto) {
    return next(new ErrorResponse('Please upload both Aadhar and College ID photos', 400));
  }

  // Validate Aadhar number format (12 digits)
  if (!/^\d{12}$/.test(aadharNumber)) {
    return next(new ErrorResponse('Aadhar number must be 12 digits', 400));
  }

  // Find user by invitation token
  const user = await User.findOne({
    invitationToken: token,
    invitationExpires: { $gt: Date.now() },
    status: 'invited'
  });

  if (!user) {
    return next(new ErrorResponse('Invalid or expired invitation token', 400));
  }

  try {
    // Get file paths from multer middleware
    const aadharPhotoPath = req.aadharPhotoPath || '';
    const collegeIdPhotoPath = req.collegeIdPhotoPath || '';

    // Update user details
    user.name = name;
    user.password = password;
    user.college = college;
    user.aadharNumber = aadharNumber;
    user.aadharPhoto = aadharPhotoPath.replace('public', '');
    user.collegeIdPhoto = collegeIdPhotoPath.replace('public', '');
    user.invitationToken = undefined;
    user.invitationExpires = undefined;
    user.status = 'pending'; // Set to pending until admin verification
    
    await user.save();

    console.log('User registered successfully:', user.email);

    // Send Garba Pass email
    sendGarbaPassEmail(user.email, user.name)
        .then(() => console.log(`Garba Pass email sent to ${user.email}`))
        .catch(err => console.error('Failed to send Garba Pass email:', err));

    // Create token
    const authToken = user.getSignedJwtToken();

    res.status(200).json({ 
      success: true, 
      token: authToken,
      message: 'Registration successful! Your account is pending admin approval.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle duplicate Aadhar number
    if (error.code === 11000 && error.keyPattern && error.keyPattern.aadharNumber) {
      return next(new ErrorResponse('Aadhar number is already registered', 400));
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return next(new ErrorResponse(messages.join(', '), 400));
    }
    
    // Handle other errors
    next(new ErrorResponse('Registration failed. Please try again.', 500));
  }
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    // Check if request body exists and has the required fields
    if (!req.body) {
      return next(new ErrorResponse('Request body is missing', 400));
    }

    const { email, password } = req.body;
    
    // Validate email & password
    if (!email || !password) {
      return next(new ErrorResponse('Please provide both email and password', 400));
    }
    
    // Check for user
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }
    
    if(user.role !== 'admin') {
      return next(new ErrorResponse('Users cannot login', 401));
    }
    
    // Check if password matches
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }
    
    sendTokenResponse(user, 200, res);
    console.log(email, password);
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Log user out / clear cookie
// @route   GET /api/v1/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
  });
};
