const User = require('../models/User');
const Otp = require('../models/Otp');
const sendEmail = require('../utils/sendEmail');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper to validate email format
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// ==========================================
// 1. REGISTRATION WITH EMAIL OTP
// ==========================================

// @desc    Send a 6-digit registration OTP to user's email address
// @route   POST /api/auth/send-otp
// @access  Public
const sendRegistrationOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !isValidEmail(email.toString().trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    const cleanEmail = email.toString().trim().toLowerCase();

    // 1. Check if user is already registered in the system
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email is already registered. Please sign in instead.'
      });
    }

    // 2. Generate a secure 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Clear any previous unverified registration OTPs for this email
    await Otp.deleteMany({ email: cleanEmail, purpose: 'register' });

    // 4. Save the new OTP in database with 5-minute auto-expiry
    await Otp.create({
      email: cleanEmail,
      otp,
      purpose: 'register'
    });

    // 5. Dispatch code via Email
    await sendEmail({
      to: cleanEmail,
      subject: 'Verify Your Email - Jankapur Academic Network',
      otp,
      purpose: 'scholar account registration'
    });

    res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${cleanEmail}. Please check your inbox.`
    });

  } catch (error) {
    console.error('Send Registration OTP Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to dispatch verification email.'
    });
  }
};

// @desc    Register a new student, teacher, or admin after OTP verification
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, gender, schoolName, classOrBatch, otp, phoneNumber } = req.body;

    if (!email || !isValidEmail(email.toString().trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    const cleanEmail = email.toString().trim().toLowerCase();

    // 1. Verify OTP
    if (!otp || otp.toString().trim().length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the complete 6-digit verification code sent to your email'
      });
    }

    const cleanOtp = otp.toString().trim();
    const validOtpRecord = await Otp.findOne({
      email: cleanEmail,
      otp: cleanOtp,
      purpose: 'register'
    });

    if (!validOtpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code. Please request a new code.'
      });
    }

    // 2. Check if the user already exists
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'This email is already registered' });
    }

    // 3. Encrypt the password using bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create the user document
    const user = await User.create({
      name,
      email: cleanEmail,
      phoneNumber: phoneNumber ? phoneNumber.toString().trim() : '',
      password: hashedPassword,
      gender: gender || 'Male',
      schoolName: schoolName || 'Jankapur High School',
      classOrBatch: classOrBatch || ''
    });

    // 5. Clean up verified OTP record
    await Otp.deleteMany({ email: cleanEmail, purpose: 'register' });

    res.status(201).json({
      success: true,
      message: 'Registration successful! You can now log in.',
      userId: user._id
    });

  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, message: 'Registration Server Error: ' + error.message });
  }
};

// ==========================================
// 2. LOGIN (PASSWORD & EMAIL OTP)
// ==========================================

// @desc    Password-based Login
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide your email and password' });
    }

    const cleanEmail = email.toString().trim().toLowerCase();

    // 1. Fetch user records and explicitly request the hidden password field
    const user = await User.findOne({ email: cleanEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // 2. Validate password match
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // 3. Issue a secure JWT authorization token valid for 10 days
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '10d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolName: user.schoolName
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Login Server Error: ' + error.message });
  }
};

// @desc    Send a 6-digit OTP to user's email for passwordless login
// @route   POST /api/auth/send-login-otp
// @access  Public
const sendLoginOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !isValidEmail(email.toString().trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid registered email address'
      });
    }

    const cleanEmail = email.toString().trim().toLowerCase();

    // 1. Check if user is registered in the system
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No registered account found with this email. Please sign up first.'
      });
    }

    // 2. Generate a secure 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Clear any previous unverified login OTPs for this email
    await Otp.deleteMany({ email: cleanEmail, purpose: 'login' });

    // 4. Save the new OTP in database with 5-minute auto-expiry
    await Otp.create({
      email: cleanEmail,
      otp,
      purpose: 'login'
    });

    // 5. Dispatch code via Email
    await sendEmail({
      to: cleanEmail,
      subject: 'Your Jankapur Hub Login Code',
      otp,
      purpose: 'secure portal sign-in'
    });

    res.status(200).json({
      success: true,
      message: `Login verification code sent to ${cleanEmail}. Check your inbox.`
    });

  } catch (error) {
    console.error('Send Login OTP Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to dispatch login email.'
    });
  }
};

// @desc    Verify Email OTP and log user in
// @route   POST /api/auth/login-otp
// @access  Public
const loginWithOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !isValidEmail(email.toString().trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    if (!otp || otp.toString().trim().length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the complete 6-digit verification code'
      });
    }

    const cleanEmail = email.toString().trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    // 1. Verify OTP record
    const validOtpRecord = await Otp.findOne({
      email: cleanEmail,
      otp: cleanOtp,
      purpose: 'login'
    });

    if (!validOtpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code. Please check your email or request a new one.'
      });
    }

    // 2. Fetch user details
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found'
      });
    }

    // 3. Clear used login OTPs
    await Otp.deleteMany({ email: cleanEmail, purpose: 'login' });

    // 4. Issue a secure JWT authorization token valid for 10 days
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '10d' }
    );

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolName: user.schoolName
      }
    });

  } catch (error) {
    console.error('Login with OTP Error:', error);
    res.status(500).json({
      success: false,
      message: 'Login Server Error: ' + error.message
    });
  }
};

// ==========================================
// 3. PASSWORD RECOVERY (EMAIL OTP SECURED)
// ==========================================

// @desc    Send 6-digit OTP to user's registered email for secure password reset
// @route   POST /api/auth/send-reset-otp
// @access  Public
const sendResetPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !isValidEmail(email.toString().trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid registered email address'
      });
    }

    const cleanEmail = email.toString().trim().toLowerCase();

    // 1. Check if user is registered
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No student or teacher account found with this email. Please check your address.'
      });
    }

    // 2. Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Clear previous reset OTPs for this email
    await Otp.deleteMany({ email: cleanEmail, purpose: 'reset' });

    // 4. Save new OTP with 5-minute auto-expiry
    await Otp.create({
      email: cleanEmail,
      otp,
      purpose: 'reset'
    });

    // 5. Dispatch code via Email
    await sendEmail({
      to: cleanEmail,
      subject: 'Reset Your Jankapur Hub Password',
      otp,
      purpose: 'password reset'
    });

    res.status(200).json({
      success: true,
      message: `Password reset verification code sent to ${cleanEmail}. Check your inbox.`
    });

  } catch (error) {
    console.error('Send Reset OTP Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate reset email.'
    });
  }
};

// @desc    Self-service password reset with mandatory OTP verification
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !isValidEmail(email.toString().trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    if (!otp || otp.toString().trim().length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the 6-digit verification code sent to your email.'
      });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    const cleanEmail = email.toString().trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    // 1. Verify OTP record in database with purpose: 'reset'
    const validOtpRecord = await Otp.findOne({
      email: cleanEmail,
      otp: cleanOtp,
      purpose: 'reset'
    });

    if (!validOtpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code. Please check your email or request a new one.'
      });
    }

    // 2. Locate user record
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No student account found with this email address.'
      });
    }

    // 3. Encrypt new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    // 4. Purge used reset OTP
    await Otp.deleteMany({ email: cleanEmail, purpose: 'reset' });

    console.log(`[AUTH] Password successfully updated for user ${user.name} (${cleanEmail})`);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully! You can now sign in with your new password.'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Password Reset Server Error: ' + error.message
    });
  }
};

// ==========================================
// 4. ADMIN PRIVILEGES
// ==========================================

// @desc    Admin provisions an official verified teacher account
// @route   POST /api/auth/admin/create-teacher
// @access  Private (Admin Only)
const adminCreateTeacher = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access Denied. Only platform Admin can authorize teachers.' });
    }

    const { name, email, phoneNumber, password, gender, schoolName, classOrBatch } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Valid email address required.' });
    }

    const cleanEmail = email.toString().trim().toLowerCase();

    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'This email is already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const teacher = await User.create({
      name,
      email: cleanEmail,
      phoneNumber: phoneNumber || '',
      password: hashedPassword,
      gender,
      schoolName,
      classOrBatch,
      role: 'teacher'
    });

    res.status(201).json({
      success: true,
      message: `Verified teacher account for ${name} provisioned successfully!`,
      teacherId: teacher._id
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Admin Provisioning Error: ' + error.message });
  }
};

module.exports = {
  registerUser,
  sendRegistrationOtp,
  loginUser,
  sendLoginOtp,
  loginWithOtp,
  adminCreateTeacher,
  sendResetPasswordOtp,
  resetPassword
};
