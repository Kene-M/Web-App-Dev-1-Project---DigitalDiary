// routes/replyRoutes.js
const express = require('express');
const Reply = require('../models/Reply');
const Post = require('../models/Post');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router({ mergeParams: true });
// mergeParams lets us access :postId from parent route

// GET /api/posts/:postId/replies (public)
router.get('/', async (req, res) => {
  try {
    const { postId } = req.params;
    const replies = await Reply.find({ postId })
  .sort({ createdAt: 1 })
  .populate('author', 'username');
    res.json(replies);
  } catch (err) {
    console.error('Error fetching replies:', err);
    res.status(500).json({ message: 'Error fetching replies' });
  }
});

// POST /api/posts/:postId/replies (protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const postExists = await Post.findById(postId);
    if (!postExists) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const reply = new Reply({
      postId,
      content,
      author: req.user.userId,
    });

    const saved = await reply.save();
    const populated = await saved.populate('author', 'username');
    res.status(201).json(populated);
  } catch (err) {
    console.error('Error saving reply:', err);
    res.status(500).json({ message: 'Error saving reply' });
  }
});

// PUT /api/posts/:postId/replies/:replyId (protected)
router.put('/:replyId', authMiddleware, async (req, res) => {
  try {
    const { replyId } = req.params;
    const { content } = req.body;

    const updated = await Reply.findByIdAndUpdate(
      replyId,
      { content },
      { new: true }
    ).populate('author', 'username');

    if (!updated) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    res.json(updated);
  } catch (err) {
    console.error('Error updating reply:', err);
    res.status(500).json({ message: 'Error updating reply' });
  }
});

// DELETE /api/posts/:postId/replies/:replyId (protected)
router.delete('/:replyId', authMiddleware, async (req, res) => {
  try {
    const { replyId } = req.params;

    const deleted = await Reply.findByIdAndDelete(replyId);
    if (!deleted) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    res.json({ message: 'Reply deleted' });
  } catch (err) {
    console.error('Error deleting reply:', err);
    res.status(500).json({ message: 'Error deleting reply' });
  }
});

module.exports = router;
