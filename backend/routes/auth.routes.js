const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  logout,
} = require('../controllers/auth.controller');
const { inviteUser, verifyInvitation } = require('../controllers/invitation.controller');
const { protect, authorize } = require('../middleware/auth');
const uploadFiles = require('../middleware/multer');

// Public routes
router.post('/register/:token', uploadFiles, register);
router.post('/login', login);
router.get('/verify-invite/:token', verifyInvitation);

// Protected routes
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);

// Admin routes
router.post('/invite', protect, authorize('admin'), inviteUser);

module.exports = router;
