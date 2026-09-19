const express = require('express');
const router = express.Router();
const {
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice,
} = require('../controllers/noticeController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getNotices);
router.post('/', protect, createNotice);
router.put('/:id', protect, updateNotice);
router.delete('/:id', protect, deleteNotice);

module.exports = router;
