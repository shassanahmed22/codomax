const express = require('express');
const { readDb, writeDb, genId } = require('../utils/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/posts — public feed (published only)
router.get('/', (req, res) => {
    const db = readDb();
    const posts = db.posts
        .filter((p) => p.status === 'published')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ posts });
});

// GET /api/posts/mine — the signed-in user's own posts (published + draft)
router.get('/mine', requireAuth, (req, res) => {
    const db = readDb();
    const posts = db.posts
        .filter((p) => p.authorId === req.userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ posts });
});

// GET /api/posts/:id — single post (used to prefill the edit form)
router.get('/:id', (req, res) => {
    const db = readDb();
    const post = db.posts.find((p) => p.id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    res.json({ post });
});

// POST /api/posts — create a post
router.post('/', requireAuth, (req, res) => {
    const { title, body, tag, status } = req.body || {};

    if (!title || title.trim().length < 3) {
        return res.status(400).json({ error: 'Give your post a title.' });
    }
    if (!body || body.trim().length < 20) {
        return res.status(400).json({ error: 'Write at least a few sentences.' });
    }

    const db = readDb();
    const user = db.users.find((u) => u.id === req.userId);

    const post = {
        id: genId(),
        authorId: req.userId,
        authorName: user ? user.name : 'Unknown',
        title: title.trim(),
        body: body.trim(),
        tag: tag || 'general',
        status: status === 'draft' ? 'draft' : 'published',
        createdAt: new Date().toISOString(),
    };
    db.posts.push(post);
    writeDb(db);

    res.status(201).json({ post });
});

// PUT /api/posts/:id — update a post (owner only)
router.put('/:id', requireAuth, (req, res) => {
    const db = readDb();
    const post = db.posts.find((p) => p.id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    if (post.authorId !== req.userId) {
        return res.status(403).json({ error: 'You can only edit your own posts.' });
    }

    const { title, body, tag, status } = req.body || {};
    if (title && title.trim().length >= 3) post.title = title.trim();
    if (body && body.trim().length >= 20) post.body = body.trim();
    if (tag) post.tag = tag;
    if (status) post.status = status === 'draft' ? 'draft' : 'published';

    writeDb(db);
    res.json({ post });
});

// DELETE /api/posts/:id — delete a post (owner only)
router.delete('/:id', requireAuth, (req, res) => {
    const db = readDb();
    const post = db.posts.find((p) => p.id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    if (post.authorId !== req.userId) {
        return res.status(403).json({ error: 'You can only delete your own posts.' });
    }

    db.posts = db.posts.filter((p) => p.id !== req.params.id);
    writeDb(db);
    res.json({ ok: true });
});

module.exports = router;