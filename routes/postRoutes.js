const express = require('express');
const router = express.Router();
const { createPost, getAllPosts, commentOnPost, likePost } = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware'); // Import security shield

// Wrap access paths inside our authorization checkpoint token guard
router.post('/', protect, createPost);
router.get('/', protect, getAllPosts);
router.post('/:id/comment', protect, commentOnPost);
router.post('/:id/like', protect, likePost);

module.exports = router;
