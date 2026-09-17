const express = require('express');
const router = express.Router();

// 1. Import checkout and verification handler controls
const { checkout, verifyPayment } = require('../controllers/paymentController');

// 2. Import the secure auth middleware checkpoint guard
const { protect } = require('../middleware/authMiddleware');

// 3. Map paths wrapped inside your security token authorization checkpoint
router.post('/checkout', protect, checkout);
router.post('/verify', protect, verifyPayment);

module.exports = router;
