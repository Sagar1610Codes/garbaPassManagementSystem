const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/user.model');

// @desc    Get user pass
// @route   GET /api/v1/pass/:email
// @access  Private
router.get('/:email', protect, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email }).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error fetching user pass:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
