const Document = require('../models/Document');
const Order = require('../models/Order');

// @desc    Upload a new study material/PYQ
// @route   POST /api/documents
// @access  Private (Admin/Teacher only)
const uploadDocument = async (req, res) => {
  try {
    const { title, description, schoolTag, classLevel, subject, fileUrl, isPremium, price, category, year, examType } = req.body;

    // Check if the user trying to upload is a student (block them)
    if (req.user.role === 'student') {
      return res.status(403).json({ success: false, message: 'Access denied. Only teachers and admins can upload files.' });
    }

    // Create the document entry mapping it back to the uploader's database ID
    const newDoc = await Document.create({
      title,
      description,
      schoolTag,
      classLevel,
      subject,
      fileUrl,
      isPremium,
      price: price || 0,
      category: category || 'Notes',
      year: year ? parseInt(year, 10) : undefined,
      examType: examType || 'General',
      uploadedBy: req.user.id // Captured automatically by our authMiddleware
    });

    res.status(201).json({
      success: true,
      message: 'Study resource uploaded successfully to the vault!',
      data: newDoc
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Upload Failure: ' + error.message });
  }
};

// @desc    Get filtered documents by school selection, class, subject, category, year, or search
// @route   GET /api/documents
// @access  Private
const getDocuments = async (req, res) => {
  try {
    const { schoolTag, classLevel, subject, category, year, examType, search } = req.query;
    
    let query = {};
    if (schoolTag) query.schoolTag = schoolTag;
    if (classLevel) query.classLevel = classLevel;
    if (subject) query.subject = subject;
    if (category) query.category = category;
    if (year) query.year = parseInt(year, 10);
    if (examType) query.examType = examType;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort newest/highest year first
    const documents = await Document.find(query)
      .sort({ year: -1, createdAt: -1 })
      .populate('uploadedBy', 'name role');

    // 2. Fetch all completed orders purchased by the currently logged-in student account
    const completedOrders = await Order.find({
      buyer: req.user.id,
      status: 'completed',
      purchaseType: 'document'
    });

    // Check if the order contains a valid document reference entry before converting to string
    const purchasedDocIds = completedOrders
      .filter(order => order.documentItem)
      .map(order => order.documentItem.toString());

    // 3. Dynamically map through items. If a document ID matches the student's purchase history,
    // we bypass the premium flag for their session layout cleanly!
    const personalizedDocs = documents.map(doc => {
      const docObj = doc.toObject();
      if (purchasedDocIds.includes(docObj._id.toString())) {
        docObj.isPremium = false; // Safely unlocks the download anchor link button for this student!
      }
      return docObj;
    });

    res.status(200).json({
      success: true,
      count: personalizedDocs.length,
      data: personalizedDocs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Vault Retrieval Error: ' + error.message });
  }
};

// @desc    Delete a document/PYQ from vault
// @route   DELETE /api/documents/:id
// @access  Private (Admin or Document Uploader only)
const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found in vault' });
    }

    // Authorization: only platform admin or the uploader can delete
    const isUploader = document.uploadedBy && document.uploadedBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && !isUploader) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not authorized to delete this document.'
      });
    }

    await Document.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Document permanently deleted from the vault!'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Document Deletion Error: ' + error.message });
  }
};

module.exports = { 
  uploadDocument, 
  getDocuments,
  deleteDocument
};

