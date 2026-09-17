const Document = require('../models/Document');
const Order = require('../models/Order');

// @desc    Upload a new study material/PYQ
// @route   POST /api/documents
// @access  Private (Admin/Teacher only)
const uploadDocument = async (req, res) => {
  try {
    const { title, description, schoolTag, classLevel, subject, fileUrl, isPremium, price } = req.body;

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
      price,
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

// @desc    Get filtered documents by school selection, class, or subject
// @route   GET /api/documents
// @access  Private
const getDocuments = async (req, res) => {
  try {
    const { schoolTag, classLevel, subject } = req.query;
    
    let query = {};
    if (schoolTag) query.schoolTag = schoolTag;
    if (classLevel) query.classLevel = classLevel;
    if (subject) query.subject = subject;

    // 1. FIXED: Corrected lowercase 'documents' typo to the valid 'Document' Mongoose model mapping
    const documents = await Document.find(query).populate('uploadedBy', 'name role');

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

// 💡 FIXED: Removed the invalid 'purchasedDocIds' reference out of exports
module.exports = { 
  uploadDocument, 
  getDocuments
};
