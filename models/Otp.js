const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // Automatically delete after 5 minutes (300 seconds)
  }
});

module.exports = mongoose.model('Otp', OtpSchema);
