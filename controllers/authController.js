const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Register a new student, teacher, or admin
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, phoneNumber, password, gender, schoolName, classOrBatch } = req.body;

    // 1. Check if the user already exists in the village cluster
    const userExists = await User.findOne({ phoneNumber });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'This phone number is already registered' });
    }

    // 2. Encrypt the password using bcryptjs hashes
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create the user database document record inside MongoDB Cloud
    const user = await User.create({
      name,
      phoneNumber,
      password: hashedPassword,
      gender,
      schoolName,
      classOrBatch
    });

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

// Make sure to export the new control method at the bottom object!
module.exports = { registerUser, loginUser, adminCreateTeacher };



