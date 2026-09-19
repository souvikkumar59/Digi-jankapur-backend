const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  phoneNumber: {
    type: String,
    default: ''
  },
  otp: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    enum: ['register', 'login', 'reset'],
    default: 'register'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // Automatically delete after 5 minutes (300 seconds)
  }
});

module.exports = mongoose.model('Otp', OtpSchema);
