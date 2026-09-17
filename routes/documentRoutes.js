const express = require('express');
const router = express.Router();
const { uploadDocument, getDocuments } = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware'); // Protects the paths

// Define paths wrapped by our authorization middleware checkpoint
router.post('/', protect, uploadDocument);
router.get('/', protect, getDocuments);

module.exports = router;
