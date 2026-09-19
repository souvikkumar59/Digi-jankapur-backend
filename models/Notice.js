const mongoose = require('mongoose');

const NoticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a notice title'],
    trim: true,
  },
  content: {
    type: String,
    required: [true, 'Please provide notice content'],
    trim: true,
  },
  badge: {
    type: String,
    default: 'GENERAL NOTICE',
    trim: true,
  },
  dateText: {
    type: String,
    default: 'Today',
    trim: true,
  },
  schoolTag: {
    type: String,
    default: 'Jankapur High School',
    trim: true,
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Notice', NoticeSchema);
