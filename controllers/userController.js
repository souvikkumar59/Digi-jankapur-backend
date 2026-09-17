const User = require('../models/User');

// @desc    Get all students for the directory grid with filters
// @route   GET /api/users/directory
// @access  Private
const getDirectory = async (req, res) => {
  try {
    const { schoolName, gender, name } = req.query;
    let query = { _id: { $ne: req.user.id } }; // Exclude currently logged-in user

    if (schoolName) query.schoolName = schoolName;
    if (gender) query.gender = gender;
    if (name) query.name = { $regex: name, $options: 'i' };

    const students = await User.find(query).select('-password');

    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Directory Error: ' + error.message });
  }
};

// @desc    Update currently logged-in student profile metadata
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { bio, profilePicture, classOrBatch } = req.body;
    let fieldsToUpdate = {};

    if (bio !== undefined) fieldsToUpdate.bio = bio;
    if (profilePicture !== undefined) fieldsToUpdate.profilePicture = profilePicture;
    if (classOrBatch !== undefined) fieldsToUpdate.classOrBatch = classOrBatch;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: fieldsToUpdate },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Your profile card has been polished successfully!',
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Profile Update Error: ' + error.message });
  }
};

// @desc    Increment profile view metric counter safely
// @route   POST /api/users/view/:id
// @access  Private
// @desc    Increment profile view metric counter and record visitor identity logs safely
// @route   POST /api/users/view/:id
// @access  Private
const incrementProfileView = async (req, res) => {
  try {
    const targetUserId = req.params.id;

    if (targetUserId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Self views are excluded from metrics.' });
    }

    // Update target document: Bumps the visual view tally counter AND pushes the visitor details onto the tracker array!
    const targetUser = await User.findByIdAndUpdate(
      targetUserId,
      { 
        $inc: { profileViews: 1 },
        $push: { viewersHistory: { viewerId: req.user.id } } // Logs exactly who visited their profile!
      },
      { new: true }
    );

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Target classmate profile missing.' });
    }

    res.status(200).json({
      success: true,
      views: targetUser.profileViews
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Metrics Counter Error: ' + error.message });
  }
};


// @desc    Get the roster list of accounts who viewed currently logged-in profile
// @route   GET /api/users/profile/analytics
// @access  Private
const getProfileAnalytics = async (req, res) => {
  try {
    // 1. Fetch user data, expanding the viewerId references to include names, schools, and roles
    const userProfile = await User.findById(req.user.id)
      .populate('viewersHistory.viewerId', 'name schoolName classOrBatch profilePicture role');

    if (!userProfile) {
      return res.status(404).json({ success: false, message: 'User profile missing.' });
    }

    // 2. Separate logic based on premium status:
    // If unlocked, send the real unblurred visitor history logs list array
    if (userProfile.isAnalyticsUnlocked) {
      return res.status(200).json({
        success: true,
        unlocked: true,
        viewers: userProfile.viewersHistory
      });
    }

    // 3. Teaser Mode: If locked, map through rows, obfuscating names to protect privacy while creating a teaser effect!
    const blurredViewers = userProfile.viewersHistory.map(item => {
      if (!item.viewerId) return null;
      return {
        _id: item._id,
        viewedAt: item.viewedAt,
        viewerId: {
          name: "Anonymous Classmate 🤫", // Hides the real name
          schoolName: item.viewerId.schoolName, // Reveals only their school to provoke interest!
          classOrBatch: "Hidden Tier"
        }
      };
    }).filter(Boolean);

    res.status(200).json({
      success: true,
      unlocked: false,
      viewers: blurredViewers
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Analytics Core Error: ' + error.message });
  }
};

// 💡 Update your export object mapping list at the very bottom line:
module.exports = { 
  getDirectory, 
  updateProfile, 
  incrementProfileView, 
  getProfileAnalytics // Added export hook!
};

