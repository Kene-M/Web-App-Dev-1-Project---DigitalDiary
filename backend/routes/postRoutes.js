// routes/postRoutes.js
const express = require('express');
const Post = require('../models/Post');
const Reply = require('../models/Reply');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/posts (public)
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
    .sort({ createdAt: -1 })
    .populate('author', 'username');

    res.json(posts);
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ message: 'Error fetching posts' });
  }
});

// GET /api/posts/:id (public)
router.get('/:id', async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId)
    .populate('author', 'username');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
  } catch (err) {
    console.error('Error fetching post:', err);
    res.status(500).json({ message: 'Error fetching post' });
  }
});

// POST /api/posts (protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res
      .status(400)
      .json({ message: 'Title and content are required' });
    }

    const post = new Post({
      title,
      content,
      author: req.user.userId,
    });

    const saved = await post.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('Error saving post:', err);
    res.status(500).json({ message: 'Error saving post' });
  }
});

// PUT /api/posts/:id (protected)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;
    const { title, content } = req.body;

    const updated = await Post.findByIdAndUpdate(
      postId,
      { title, content },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(updated);
  } catch (err) {
    console.error('Error updating post:', err);
    res.status(500).json({ message: 'Error updating post' });
  }
});

// DELETE /api/posts/:id (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;

    const deleted = await Post.findByIdAndDelete(postId);
    if (!deleted) {
      return res.status(404).json({ message: 'Post not found' });
    }

    await Reply.deleteMany({ postId });

    res.json({ message: 'Post and its replies deleted' });
  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).json({ message: 'Error deleting post' });
  }
});

module.exports = router;
