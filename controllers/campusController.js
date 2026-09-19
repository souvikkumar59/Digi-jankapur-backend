const CampusData = require('../models/CampusData');

// Initial seed data if collection is empty
const defaultSeedCampusData = {
  poll: {
    question: "Friday's Quarter-Final: Who will take the victory on the school ground?",
    badge: 'Jankapur High School Football Championship',
    options: [
      { id: '10A', label: 'Class 10A (Defending Champions) 👑', votes: 94 },
      { id: '9B', label: 'Class 9B (The Rising Stars) ⚡', votes: 78 },
      { id: '10B', label: 'Class 10B (The Dark Horses) 🐎', votes: 46 },
      { id: '11Sci', label: 'Class 11 Science (High School Power) 🔬', votes: 39 },
    ],
    voters: [],
  },
  riddle: {
    question: 'A clock strikes 6 times in 5 seconds. How many seconds will it take to strike 12 times?',
    subtext: 'Madhyamik Logic Boost',
    answer:
      'It takes 11 seconds! Explanation: Between 6 strikes there are 5 intervals. 5 seconds ÷ 5 intervals = 1 second per interval. For 12 strikes, there are 11 intervals × 1 second = 11 seconds.',
  },
  spotlights: [
    {
      name: 'Rahul Mondal (Class 10A)',
      title: 'Football Star of the Week',
      description: 'Scored hat-trick in the inter-school tournament.',
      icon: '⚽',
      color: 'amber',
    },
    {
      name: 'Pooja Roy (Class 10)',
      title: 'Academic Science Topper',
      description: 'Scored 96% in the Madhyamik Mock Exam.',
      icon: '🥇',
      color: 'emerald',
    },
    {
      name: 'Souvik Baguli (Class 12)',
      title: 'Science Exhibition Winner',
      description: '1st prize in Village Science & Innovation Fair.',
      icon: '🎨',
      color: 'indigo',
    },
  ],
};

const getOrCreateCampusDoc = async () => {
  let doc = await CampusData.findOne();
  if (!doc) {
    doc = await CampusData.create(defaultSeedCampusData);
  }
  return doc;
};

// @desc    Get all dynamic campus data (Poll, Riddle, Wall of Fame)
// @route   GET /api/campus
// @access  Private
const getCampusData = async (req, res) => {
  try {
    const doc = await getOrCreateCampusDoc();
    res.status(200).json({
      success: true,
      data: doc,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Campus Data Error: ' + error.message });
  }
};

// @desc    Update match poll (Admin only)
// @route   PUT /api/campus/poll
// @access  Private (Admin only)
const updatePoll = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { question, badge, options, resetVotes } = req.body;
    const doc = await getOrCreateCampusDoc();

    if (question) doc.poll.question = question;
    if (badge) doc.poll.badge = badge;
    if (options && Array.isArray(options)) {
      doc.poll.options = options.map((opt, idx) => ({
        id: opt.id || `opt_${idx}`,
        label: opt.label,
        votes: resetVotes ? 0 : Number(opt.votes || 0),
      }));
    }
    if (resetVotes) {
      doc.poll.voters = [];
    }

    doc.updatedAt = Date.now();
    await doc.save();

    res.status(200).json({
      success: true,
      message: 'Match Poll updated successfully!',
      data: doc.poll,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Poll Update Error: ' + error.message });
  }
};

// @desc    Vote in match poll
// @route   POST /api/campus/poll/vote
// @access  Private
const votePoll = async (req, res) => {
  try {
    const { optionId } = req.body;
    const userId = req.user.id.toString();

    const doc = await getOrCreateCampusDoc();

    if (doc.poll.voters.includes(userId)) {
      return res.status(400).json({ success: false, message: 'You have already voted in this poll' });
    }

    const option = doc.poll.options.find(
      (o) => o.id === optionId || (o._id && o._id.toString() === optionId)
    );
    if (!option) {
      return res.status(404).json({ success: false, message: 'Invalid option selected' });
    }

    option.votes += 1;
    doc.poll.voters.push(userId);
    doc.updatedAt = Date.now();
    await doc.save();

    res.status(200).json({
      success: true,
      message: 'Vote recorded successfully!',
      data: doc.poll,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Voting Error: ' + error.message });
  }
};

// @desc    Update daily riddle (Admin only)
// @route   PUT /api/campus/riddle
// @access  Private (Admin only)
const updateRiddle = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { question, subtext, answer } = req.body;
    const doc = await getOrCreateCampusDoc();

    if (question) doc.riddle.question = question;
    if (subtext) doc.riddle.subtext = subtext;
    if (answer) doc.riddle.answer = answer;

    doc.updatedAt = Date.now();
    await doc.save();

    res.status(200).json({
      success: true,
      message: 'Daily Riddle updated successfully!',
      data: doc.riddle,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Riddle Update Error: ' + error.message });
  }
};

// @desc    Add a student to Wall of Fame (Admin only)
// @route   POST /api/campus/spotlight
// @access  Private (Admin only)
const createSpotlight = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { name, title, description, icon, color } = req.body;
    if (!name || !title) {
      return res.status(400).json({ success: false, message: 'Name and title are required' });
    }

    const doc = await getOrCreateCampusDoc();
    doc.spotlights.unshift({
      name,
      title,
      description: description || '',
      icon: icon || '⭐',
      color: color || 'amber',
    });

    doc.updatedAt = Date.now();
    await doc.save();

    res.status(201).json({
      success: true,
      message: 'Student added to Wall of Fame!',
      data: doc.spotlights,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Spotlight Creation Error: ' + error.message });
  }
};

// @desc    Edit a Wall of Fame student entry (Admin only)
// @route   PUT /api/campus/spotlight/:id
// @access  Private (Admin only)
const updateSpotlight = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { id } = req.params;
    const { name, title, description, icon, color } = req.body;

    const doc = await getOrCreateCampusDoc();
    const item = doc.spotlights.id(id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Spotlight entry not found' });
    }

    if (name) item.name = name;
    if (title) item.title = title;
    if (description !== undefined) item.description = description;
    if (icon) item.icon = icon;
    if (color) item.color = color;

    doc.updatedAt = Date.now();
    await doc.save();

    res.status(200).json({
      success: true,
      message: 'Spotlight entry updated successfully!',
      data: doc.spotlights,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Spotlight Update Error: ' + error.message });
  }
};

// @desc    Delete a Wall of Fame student entry (Admin only)
// @route   DELETE /api/campus/spotlight/:id
// @access  Private (Admin only)
const deleteSpotlight = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { id } = req.params;
    const doc = await getOrCreateCampusDoc();

    doc.spotlights = doc.spotlights.filter((s) => s._id.toString() !== id);
    doc.updatedAt = Date.now();
    await doc.save();

    res.status(200).json({
      success: true,
      message: 'Spotlight entry removed from Wall of Fame!',
      data: doc.spotlights,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Spotlight Deletion Error: ' + error.message });
  }
};

module.exports = {
  getCampusData,
  updatePoll,
  votePoll,
  updateRiddle,
  createSpotlight,
  updateSpotlight,
  deleteSpotlight,
};
