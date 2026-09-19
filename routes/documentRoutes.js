const express = require('express');
const router = express.Router();
const { uploadDocument, getDocuments, deleteDocument } = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware'); // Protects the paths

// Define paths wrapped by our authorization middleware checkpoint
router.post('/', protect, uploadDocument);
router.get('/', protect, getDocuments);
router.delete('/:id', protect, deleteDocument);

module.exports = router;

