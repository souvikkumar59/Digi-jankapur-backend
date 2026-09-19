const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a document title'],
    trim: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  schoolTag: {
    type: String,
    enum: [
      'Jankapur High School', 
      'Jankapur Primary School', 
      'Bodhi Bikash', 
      'Jankapur High Madrasha',
      'Janakpur High School', 
      'Janakpur Primary School', 
      'Janakpur High Madrasha',
      'General'
    ],
    required: true
  },
  classLevel: {
    type: String,
    required: [true, 'Please specify the class level'],
    trim: true
  },
  subject: {
    type: String,
    required: [true, 'Please add the subject name'],
    trim: true
  },
  category: {
    type: String,
    enum: ['PYQ', 'Notes', 'Assignment', 'Model Paper'],
    default: 'Notes'
  },
  year: {
    type: Number,
    default: null
  },
  examType: {
    type: String,
    enum: [
      'Madhyamik / Board',
      'Pre-Board / Selection Test',
      'Midterm Examination',
      'Annual Exam',
      'Model Question Paper',
      'General'
    ],
    default: 'General'
  },
  fileUrl: {
    type: String,
    required: [true, 'File upload link is missing']
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  price: {
    type: Number,
    default: 0
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Document', DocumentSchema);
