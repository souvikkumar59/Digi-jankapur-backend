const express = require('express');
const router = express.Router();
const {
  registerUser,
  sendRegistrationOtp,
  loginUser,
  sendLoginOtp,
  loginWithOtp,
  adminCreateTeacher,
  sendResetPasswordOtp,
  resetPassword
} = require('../controllers/authController');

// 💡 ADD THIS LINE AT THE TOP TO FIX THE CRASH:
const { protect } = require('../middleware/authMiddleware');  

// Registration Endpoints
router.post('/send-otp', sendRegistrationOtp);
router.post('/register', registerUser);

// Login Endpoints (Password + OTP)
router.post('/login', loginUser);
router.post('/send-login-otp', sendLoginOtp);
router.post('/login-otp', loginWithOtp);

// Account Recovery Endpoints (OTP-protected)
router.post('/send-reset-otp', sendResetPasswordOtp);
router.post('/reset-password', resetPassword);

// Profile sync endpoint
router.get('/me', protect, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});


// Secure Admin Endpoint: Requires a valid token AND admin privileges checked in the controller
router.post('/admin/create-teacher', protect, adminCreateTeacher);


module.exports = router;
