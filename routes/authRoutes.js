const express = require('express');
const router = express.Router();
const { registerUser, sendRegistrationOtp, loginUser, adminCreateTeacher, resetPassword } = require('../controllers/authController');

// 💡 ADD THIS LINE AT THE TOP TO FIX THE CRASH:
const { protect } = require('../middleware/authMiddleware');  

// Define API paths and map them to our controller methods
router.post('/send-otp', sendRegistrationOtp);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/reset-password', resetPassword);


// Secure Admin Endpoint: Requires a valid token AND admin privileges checked in the controller
router.post('/admin/create-teacher', protect, adminCreateTeacher);


module.exports = router;
