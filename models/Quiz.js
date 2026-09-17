const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a test title'],
    trim: true
  },
  subject: {
    type: String,
    required: [true, 'Please add the subject name'],
    trim: true
  },
  schoolTag: {
    type: String,
    enum: [
      'Jankapur High School', 
      'Jankapur Primary School', 
      'Bodhi Bikash', 
      'Jankapur High Madrasha'
    ],
    required: true
  },
  classLevel: {
    type: String,
    required: [true, 'Please add the class level'],
    trim: true
  },
  duration: {
    type: Number,
    required: [true, 'Please add test duration in minutes']
  },
  questions: [
    {
      questionText: {
        type: String,
        required: true
      },
      options: [
        {
          type: String,
          required: true
        }
      ],
      correctOption: {
        type: String,
        enum: ['A', 'B', 'C', 'D'],
        required: true
      }
    }
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Quiz', QuizSchema);
