const express = require('express');
const router = express.Router();
const {
  getCampusData,
  updatePoll,
  votePoll,
  updateRiddle,
  createSpotlight,
  updateSpotlight,
  deleteSpotlight,
} = require('../controllers/campusController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getCampusData);
router.put('/poll', protect, updatePoll);
router.post('/poll/vote', protect, votePoll);
router.put('/riddle', protect, updateRiddle);
router.post('/spotlight', protect, createSpotlight);
router.put('/spotlight/:id', protect, updateSpotlight);
router.delete('/spotlight/:id', protect, deleteSpotlight);

module.exports = router;
