const express = require('express');
const router = express.Router();

// 💡 1. IMPORT FIX: Added getProfileAnalytics cleanly inside the destructured object line below!
const { getDirectory, updateProfile, incrementProfileView, getProfileAnalytics } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// 2. Secured REST Route channels
router.get('/directory', protect, getDirectory);
router.put('/profile', protect, updateProfile);
router.post('/view/:id', protect, incrementProfileView);

// Line 11: This will resolve your reference error perfectly now!
router.get('/profile/analytics', protect, getProfileAnalytics);

module.exports = router;
