const Post = require('../models/Post');

// @desc    Create a new timeline notice or doubt post
// @route   POST /api/posts
// @access  Private (Logged-in users only)
const createPost = async (req, res) => {
  try {
    const { content, imageUrl, topic } = req.body;

    if (!content && !imageUrl) {
      return res.status(400).json({ success: false, message: 'Post content or image is required' });
    }

    // Create the post document, linking it to the student's ID captured by the middleware
    const post = await Post.create({
      content: content || '',
      imageUrl: imageUrl || '',
      topic: topic || 'General Notice',
      user: req.user.id
    });

    const populatedPost = await Post.findById(post._id)
      .populate('user', 'name profilePicture schoolName classOrBatch');

    // 💡 LIVE BROADCAST: Emit new post immediately so it appears on all connected peer screens
    if (req.io) {
      req.io.emit('new_post', populatedPost);
    }

    res.status(201).json({
      success: true,
      message: 'Post updated to the village timeline successfully!',
      data: populatedPost
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
    const { topic } = req.query;
    let query = {};

    if (topic && topic !== 'All') {
      query.topic = topic;
    }

    // Look up posts, sorting by newest (-1) and swap user IDs for real Names and Pics
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'name profilePicture schoolName classOrBatch')
      .populate('comments.user', 'name profilePicture role');

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Timeline Retrieval Failure: ' + error.message });
  }
};

// @desc    Toggle Like / Upvote on a doubt post
// @route   POST /api/posts/:id/like
// @access  Private
const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Doubt post not found' });
    }

    const userIdStr = req.user.id.toString();
    const existingIndex = post.likes.findIndex((id) => id.toString() === userIdStr);

    let isLiked = false;
    if (existingIndex > -1) {
      post.likes.splice(existingIndex, 1);
      isLiked = false;
    } else {
      post.likes.push(req.user.id);
      isLiked = true;
    }

    await post.save();

    const updatedPost = await Post.findById(req.params.id)
      .populate('user', 'name profilePicture schoolName classOrBatch')
      .populate('comments.user', 'name profilePicture role');

    // 💡 LIVE BROADCAST: Notify all peers with updated like counter
    if (req.io) {
      req.io.emit('doubt_updated', updatedPost);
    }

    res.status(200).json({
      success: true,
      message: isLiked ? 'Upvote registered! ❤️' : 'Upvote removed',
      isLiked,
      likesCount: updatedPost.likes.length,
      data: updatedPost
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Like Engine Error: ' + error.message });
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
    if (req.io) {
      req.io.emit('doubt_updated', updatedPost);
    }

    res.status(200).json({ success: true, message: 'Answer compiled and broadcasted live!', data: updatedPost });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Comment Engine Error: ' + error.message });
  }
};

module.exports = { createPost, getAllPosts, likePost, commentOnPost };
