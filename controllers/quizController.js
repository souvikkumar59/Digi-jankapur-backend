const Quiz = require('../models/Quiz');

// @desc    Create a new timed MCQ mock test
// @route   POST /api/quizzes
// @access  Private (Teachers/Admins only)
const createQuiz = async (req, res) => {
  try {
    const { title, subject, schoolTag, classLevel, duration, questions } = req.body;

    // Security Gate: Prevent students from deploying exams
    if (req.user.role === 'student') {
      return res.status(403).json({ success: false, message: 'Access denied. Students cannot create tests.' });
    }

    const quiz = await Quiz.create({
      title,
      subject,
      schoolTag,
      classLevel,
      duration, // in minutes
      questions, // Array of MCQs matching our model schema
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Mock test created and published successfully!',
      data: quiz
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Quiz Creation Error: ' + error.message });
  }
};

// @desc    Fetch available quizzes for all students
// @route   GET /api/quizzes
// @access  Private
const getAvailableQuizzes = async (req, res) => {
  try {
    const { schoolTag, classLevel, search } = req.query;
    
    let query = {};

    if (schoolTag && schoolTag !== 'All' && schoolTag !== 'All Schools') {
      // Match either Jankapur or Janakpur interchangeably for backwards compatibility
      const normalizedPattern = schoolTag.replace(/jan(?:a)?kapur/i, 'Jan(a)?kapur');
      const schoolRegex = new RegExp(normalizedPattern, 'i');
      query.$or = [
        { schoolTag: { $regex: schoolRegex } },
        { schoolTag: { $in: ['All Schools', 'Open to All', 'General', 'Open'] } },
        { schoolTag: { $exists: false } }
      ];
    }

    if (classLevel && classLevel !== 'All') {
      query.classLevel = { $regex: new RegExp(classLevel, 'i') };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch tests, returning everything EXCEPT correctOption to maintain exam integrity
    const quizzes = await Quiz.find(query)
      .select('-questions.correctOption')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: quizzes.length,
      data: quizzes
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Quiz Fetch Error: ' + error.message });
  }
};

// @desc    Submit an exam answer sheet and run automated grading checks
// @route   POST /api/quizzes/:id/submit
// @access  Private
const submitQuiz = async (req, res) => {
  try {
    const { answers } = req.body; // Array format expected: [{ questionId: '...', selectedOption: 'A' }]
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Exam paper not found' });
    }

    let totalQuestions = quiz.questions.length;
    let score = 0;
    let breakdown = [];

    // Loop through master question pool inside MongoDB to grade incoming student selections
    quiz.questions.forEach((question) => {
      const studentAnswer = answers.find(ans => ans.questionId === question._id.toString());
      const isCorrect = studentAnswer && studentAnswer.selectedOption === question.correctOption;

      if (isCorrect) score += 1;

      breakdown.push({
        question: question.questionText,
        correctAnswer: question.correctOption,
        studentSelection: studentAnswer ? studentAnswer.selectedOption : 'Unattempted',
        result: isCorrect ? 'Correct' : 'Incorrect'
      });
    });

    res.status(200).json({
      success: true,
      message: 'Exam graded successfully!',
      resultSummary: {
        totalMarks: totalQuestions,
        marksObtained: score,
        percentage: ((score / totalQuestions) * 100).toFixed(2) + '%'
      },
      detailedBreakdown: breakdown
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Grading Engine Fault: ' + error.message });
  }
};

// @desc    Delete an exam / mock test
// @route   DELETE /api/quizzes/:id
// @access  Private (Admin or Quiz Creator only)
const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Mock exam not found' });
    }

    // Security Gate: Only platform admin or the creator can delete
    const isCreator = quiz.createdBy && quiz.createdBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && !isCreator) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not authorized to delete this mock exam.'
      });
    }

    await Quiz.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Mock exam deleted successfully!'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Quiz Deletion Error: ' + error.message });
  }
};

module.exports = { createQuiz, getAvailableQuizzes, submitQuiz, deleteQuiz };

