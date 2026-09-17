const Post = require('../models/Post');

// @desc    Create a new timeline notice or doubt post
// @route   POST /api/posts
// @access  Private (Logged-in users only)
const createPost = async (req, res) => {
  try {
    const { content, imageUrl } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: 'Post content cannot be empty' });
    }

    // Create the post document, linking it to the student's ID captured by the middleware
    const post = await Post.create({
      content,
      imageUrl,
      user: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Post updated to the village timeline successfully!',
      data: post
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Timeline Error: ' + error.message });
  }
};

// @desc    Get all campus timeline posts sorted by newest arrival
// @route   GET /api/posts
// @access  Private
const getAllPosts = async (req, res) => {
  try {
    // Look up posts, sorting by newest (-1) and swap user IDs for real Names and Pics
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name profilePicture schoolName classOrBatch')
      .populate('comments.user', 'name profilePicture');

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Timeline Retrieval Failure: ' + error.message });
  }
};


// @desc    Comment / Answer a specific doubt post with real-time broadcasting
// @route   POST /api/posts/:id/comment
// @access  Private
const commentOnPost = async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Doubt post not found' });
    }

    // Push the comment payload into our array sub-document
    post.comments.push({
      text,
      user: req.user.id
    });

    await post.save();

    // 💡 Fetch the fully updated post document again, expanding user profiles to names and avatars
    const updatedPost = await Post.findById(req.params.id)
      .populate('user', 'name profilePicture schoolName classOrBatch')
      .populate('comments.user', 'name profilePicture role');

    // 💡 LIVE BROADCAST: Emit the updated post to every smartphone listening in the village!
    req.io.emit('doubt_updated', updatedPost);

    res.status(200).json({ success: true, message: 'Answer compiled and broadcasted live!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Comment Engine Error: ' + error.message });
  }
};

module.exports = { createPost, getAllPosts , commentOnPost };
