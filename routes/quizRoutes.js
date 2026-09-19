const express = require('express');
const router = express.Router();
const { createQuiz, getAvailableQuizzes, submitQuiz, deleteQuiz } = require('../controllers/quizController');
const { protect } = require('../middleware/authMiddleware');

// Wrap endpoints with our token security shield
router.post('/', protect, createQuiz);
router.get('/', protect, getAvailableQuizzes);
router.post('/:id/submit', protect, submitQuiz); // Dynamic link parameterized by specific Quiz ID
router.delete('/:id', protect, deleteQuiz);

module.exports = router;

