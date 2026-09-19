const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phoneNumber: { type: String, default: '' },
  password: { type: String, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
  schoolName: { type: String, required: true },
  classOrBatch: { type: String, default: '' },
  bio: { type: String, default: 'Hello! I am a student using Jankapur Hub.' },
  role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  profilePicture: { type: String, default: '' },
  profileViews: { type: Number, default: 0 },
  
  // 💡 NEW LOGICAL ENGINE ARRAYS FOR TRACKING VIEW HISTORIES:
  viewersHistory: [{
    viewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    viewedAt: { type: Date, default: Date.now }
  }],
  isAnalyticsUnlocked: { type: Boolean, default: false } // Becomes true after paying ₹29 via Razorpay!
}, { timestamps: true });

UserSchema.index({ name: 'text', schoolName: 1 });

module.exports = mongoose.model('User', UserSchema);
