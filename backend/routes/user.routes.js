const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
} = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(protect);

// Apply admin authorization to all routes except specific ones
router.use(authorize('admin'));

// User routes
router.route('/')
  .get(getUsers) // Get all non-admin users with pagination
  .post(createUser); // Create new user (admin only)

// User by ID routes
router.route('/:id')
  .get(getUser) // Get single user by ID
  .put(updateUser) // Update user
  .delete(deleteUser); // Delete user

// User status update route
router.route('/:id/status')
  .put(updateUserStatus); // Update user status

module.exports = router;
