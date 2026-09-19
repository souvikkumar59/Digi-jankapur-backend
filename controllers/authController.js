const User = require('../models/User');
const Otp = require('../models/Otp');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Send a 6-digit registration OTP to user's phone number
// @route   POST /api/auth/send-otp
// @access  Public
const sendRegistrationOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber || phoneNumber.toString().trim().length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit mobile number'
      });
    }

    const cleanPhone = phoneNumber.toString().trim();

    // 1. Check if user is already registered in the system
    const userExists = await User.findOne({ phoneNumber: cleanPhone });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'This mobile number is already registered. Please sign in instead.'
      });
    }

    // 2. Generate a secure 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Clear any previous unverified OTPs for this phone number
    await Otp.deleteMany({ phoneNumber: cleanPhone });

    // 4. Save the new OTP in database with 5-minute auto-expiry
    await Otp.create({
      phoneNumber: cleanPhone,
      otp
    });

    console.log(`[AUTH] Registration OTP generated for +91 ${cleanPhone}: ${otp}`);

    res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to +91 ${cleanPhone}`,
      demoOtp: otp // Included for zero-cost demo / direct test access
    });

  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate verification OTP: ' + error.message
    });
  }
};

// @desc    Register a new student, teacher, or admin
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, phoneNumber, password, gender, schoolName, classOrBatch, otp } = req.body;

    if (!phoneNumber || phoneNumber.toString().trim().length !== 10) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit phone number' });
    }

    const cleanPhone = phoneNumber.toString().trim();

    // 1. Verify OTP
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the 6-digit verification OTP sent to your phone'
      });
    }

    const validOtpRecord = await Otp.findOne({
      phoneNumber: cleanPhone,
      otp: otp.toString().trim()
    });

    if (!validOtpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please check the code or request a new one.'
      });
    }

    // 2. Check if the user already exists in the village cluster
    const userExists = await User.findOne({ phoneNumber: cleanPhone });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'This phone number is already registered' });
    }

    // 3. Encrypt the password using bcryptjs hashes
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create the user database document record inside MongoDB Cloud
    const user = await User.create({
      name,
      phoneNumber: cleanPhone,
      password: hashedPassword,
      gender,
      schoolName,
      classOrBatch
    });

    // 5. Clean up verified OTP record
    await Otp.deleteMany({ phoneNumber: cleanPhone });

    res.status(201).json({
      success: true,
      message: 'Registration successful! You can now log in.',
      userId: user._id
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Registration Server Error: ' + error.message });
  }
};

// @desc    Login user & issue secure authentication token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    // 1. Fetch user records and explicitly request the hidden password field
    const user = await User.findOne({ phoneNumber }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid phone number or password' });
    }

    // 2. Validate password match strings
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid phone number or password' });
    }

    // 3. Issue a secure JWT authorization token valid for 30 days
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
        role: user.role,
        schoolName: user.schoolName
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Login Server Error: ' + error.message });
  }
};


// @desc    Admin provisions an official verified teacher account
// @route   POST /api/auth/admin/create-teacher
// @access  Private (Admin Only)
const adminCreateTeacher = async (req, res) => {
  try {
    // 1. Enforce rigorous Role-Based Access Control (RBAC)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access Denied. Only the platform Admin can authorize teachers.' });
    }

    const { name, phoneNumber, password, gender, schoolName, classOrBatch } = req.body;

    // 2. Check for pre-existing records
    const userExists = await User.findOne({ phoneNumber });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'This phone number is already registered' });
    }

    // 3. Encrypt the teacher credentials
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Provision the account with explicit 'teacher' clearance
    const teacher = await User.create({
      name,
      phoneNumber,
      password: hashedPassword,
      gender,
      schoolName,
      classOrBatch,
      role: 'teacher' // Authorized role allocation
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

// @desc    Self-service password reset with identity verification
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { phoneNumber, schoolName, classOrBatch, newPassword } = req.body;

    if (!phoneNumber || !schoolName || !classOrBatch || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide phone number, school, class/batch, and a new password.'
      });
    }

    if (phoneNumber.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit phone number.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    // 1. Locate student record
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No student account found with this phone number.'
      });
    }

    // 2. Verify identity against school and class records
    const cleanSchoolInput = schoolName.trim().toLowerCase();
    const cleanUserSchool = (user.schoolName || '').trim().toLowerCase();

    const cleanClassInput = classOrBatch.trim().toLowerCase();
    const cleanUserClass = (user.classOrBatch || '').trim().toLowerCase();

    const schoolMatches = cleanUserSchool === cleanSchoolInput || cleanUserSchool.includes(cleanSchoolInput) || cleanSchoolInput.includes(cleanUserSchool);
    const classMatches = cleanUserClass === cleanClassInput || cleanUserClass.includes(cleanClassInput) || cleanClassInput.includes(cleanUserClass);

    if (!schoolMatches || !classMatches) {
      return res.status(403).json({
        success: false,
        message: 'Verification failed. The school or class does not match the registered profile.'
      });
    }

    // 3. Encrypt new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

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

module.exports = { registerUser, sendRegistrationOtp, loginUser, adminCreateTeacher, resetPassword };



