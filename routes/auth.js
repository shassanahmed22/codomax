const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readDb, writeDb, genId } = require('../utils/db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

function publicUser(u) {
    return { id: u.id, name: u.name, email: u.email };
}

// POST /api/auth/register
router.post('/register', (req, res) => {
    const { name, email, password } = req.body || {};

    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Name is required.' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'A valid email is required.' });
    }
    if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const db = readDb();
    const exists = db.users.some((u) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
        return res.status(409).json({ error: 'An account with that email already exists.' });
    }

    const user = {
        id: genId(),
        name: name.trim(),
        email: email.trim(),
        passwordHash: bcrypt.hashSync(password, 10),
    };
    db.users.push(user);
    writeDb(db);

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: publicUser(user) });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
    const { email, password } = req.body || {};
    const db = readDb();
    const user = db.users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());

    if (!user || !bcrypt.compareSync(password || '', user.passwordHash)) {
        return res.status(401).json({ error: 'Email or password is incorrect.' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: publicUser(user) });
});

module.exports = router;