const express = require('express');
const router = express.Router();

// Import route files
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const uploadRoutes = require('./upload.routes');
const passRoutes = require('./pass');

// Mount routers
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/upload', uploadRoutes);
router.use('/pass', passRoutes);

module.exports = router;
