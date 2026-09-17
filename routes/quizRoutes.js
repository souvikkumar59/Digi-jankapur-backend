const express = require('express');
const router = express.Router();
const { createQuiz, getAvailableQuizzes, submitQuiz } = require('../controllers/quizController');
const { protect } = require('../middleware/authMiddleware');

// Wrap endpoints with our token security shield
router.post('/', protect, createQuiz);
router.get('/', protect, getAvailableQuizzes);
router.post('/:id/submit', protect, submitQuiz); // Dynamic link parameterized by specific Quiz ID

module.exports = router;
