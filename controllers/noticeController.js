const Notice = require('../models/Notice');
const User = require('../models/User');

// Initial seed notices if collection is empty
const defaultSeedNotices = [
  {
    badge: 'MADHYAMIK 2025',
    dateText: 'Today',
    title: 'Class 10 Admit Card & Form Verification',
    content: 'All Class 10 candidates must check their registration names in Room 4 before 2:00 PM.',
    schoolTag: 'Jankapur High School',
  },
  {
    badge: 'SPORTS DAY',
    dateText: 'Friday 3:30 PM',
    title: 'Inter-Class Football: Class 10A vs 9B',
    content: 'Annual Football Quarter-Final match will be held on the Main Ground. Come support your class team!',
    schoolTag: 'Jankapur High School',
  },
  {
    badge: 'SCHOLARSHIPS',
    dateText: 'Open',
    title: 'Kanyashree K2 & SVMCM Renewal Desk',
    content: 'Eligible students can submit bank passbook photocopy and marksheets at the Headmaster\'s counter.',
    schoolTag: 'Jankapur High School',
  },
];

// @desc    Get all campus notices (seeded if empty)
// @route   GET /api/notices
// @access  Private
const getNotices = async (req, res) => {
  try {
    const count = await Notice.countDocuments();
    if (count === 0) {
      const admin = (await User.findOne({ role: 'admin' })) || (await User.findOne());
      if (admin) {
        await Notice.insertMany(
          defaultSeedNotices.map((n) => ({
            ...n,
            postedBy: admin._id,
          }))
        );
      }
    }

    const notices = await Notice.find()
      .sort({ createdAt: -1 })
      .populate('postedBy', 'name role');

    res.status(200).json({
      success: true,
      count: notices.length,
      data: notices,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Notice Retrieval Error: ' + error.message });
  }
};

// @desc    Create a new campus notice
// @route   POST /api/notices
// @access  Private (Admin & Teachers only)
const createNotice = async (req, res) => {
  try {
    if (req.user.role === 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only teachers and admins can publish school notices.',
      });
    }

    const { title, content, badge, dateText, schoolTag } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const newNotice = await Notice.create({
      title,
      content,
      badge: badge || 'GENERAL NOTICE',
      dateText: dateText || 'Today',
      schoolTag: schoolTag || 'Jankapur High School',
      postedBy: req.user.id,
    });

    const populated = await Notice.findById(newNotice._id).populate('postedBy', 'name role');

    if (req.io) {
      req.io.emit('new_notice', populated);
    }

    res.status(201).json({
      success: true,
      message: 'Notice published successfully!',
      data: populated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Notice Creation Error: ' + error.message });
  }
};

// @desc    Edit an existing notice
// @route   PUT /api/notices/:id
// @access  Private (Admin & Author only)
const updateNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    const isAuthor = notice.postedBy && notice.postedBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && !isAuthor) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this notice',
      });
    }

    const { title, content, badge, dateText, schoolTag } = req.body;

    if (title) notice.title = title;
    if (content) notice.content = content;
    if (badge) notice.badge = badge;
    if (dateText) notice.dateText = dateText;
    if (schoolTag) notice.schoolTag = schoolTag;

    await notice.save();

    const populated = await Notice.findById(notice._id).populate('postedBy', 'name role');

    if (req.io) {
      req.io.emit('notice_updated', populated);
    }

    res.status(200).json({
      success: true,
      message: 'Notice updated successfully!',
      data: populated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Notice Update Error: ' + error.message });
  }
};

// @desc    Delete a notice
// @route   DELETE /api/notices/:id
// @access  Private (Admin & Author only)
const deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    const isAuthor = notice.postedBy && notice.postedBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && !isAuthor) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this notice',
      });
    }

    await Notice.findByIdAndDelete(req.params.id);

    if (req.io) {
      req.io.emit('notice_deleted', req.params.id);
    }

    res.status(200).json({
      success: true,
      message: 'Notice deleted successfully!',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Notice Deletion Error: ' + error.message });
  }
};

module.exports = {
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice,
};
