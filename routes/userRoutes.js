const express = require('express');
const router = express.Router();

// 💡 1. IMPORT FIX: Added getProfileAnalytics & getUserProfile cleanly inside the destructured object line below!
const { getDirectory, updateProfile, incrementProfileView, getProfileAnalytics, getUserProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// 2. Secured REST Route channels
router.get('/directory', protect, getDirectory);
router.put('/profile', protect, updateProfile);
router.post('/view/:id', protect, incrementProfileView);
router.get('/profile/analytics', protect, getProfileAnalytics);
router.get('/:id', protect, getUserProfile);

module.exports = router;
