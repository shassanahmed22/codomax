const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

function genId() {
    return Math.random().toString(36).slice(2, 10);
}

function seedData() {
    const seedUserId = 'seed-1';
    const daysAgo = (n) => new Date(Date.now() - 86400000 * n).toISOString();
    return {
        users: [
            {
                id: seedUserId,
                name: 'Amara Reyes',
                email: 'amara@example.com',
                passwordHash: bcrypt.hashSync('password123', 10),
            },
        ],
        posts: [
            {
                id: genId(),
                authorId: seedUserId,
                authorName: 'Amara Reyes',
                title: 'Why I keep a paper notebook next to my laptop',
                tag: 'process',
                body: 'Screens are for editing. Paper is for thinking. I write every first draft by hand because the friction slows me down just enough to notice what I actually mean before I commit it to a file.',
                status: 'published',
                createdAt: daysAgo(4),
            },
            {
                id: genId(),
                authorId: seedUserId,
                authorName: 'Amara Reyes',
                title: 'A four-day plan for shipping your first real UI',
                tag: 'learning',
                body: 'Most tutorials teach syntax. Almost none teach sequencing, what to build first so day two does not undo day one. Here is the order that has worked for every beginner I have mentored.',
                status: 'published',
                createdAt: daysAgo(1),
            },
            {
                id: genId(),
                authorId: seedUserId,
                authorName: 'Amara Reyes',
                title: 'Drafted: thoughts on responsive type scales',
                tag: 'draft',
                body: 'Still figuring out the right clamp() values for this one, notes so far below.',
                status: 'draft',
                createdAt: daysAgo(0.2),
            },
        ],
    };
}

function ensureDb() {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify(seedData(), null, 2));
    }
}

function readDb() {
    ensureDb();
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    try {
        if (!raw.trim()) throw new Error('empty file');
        return JSON.parse(raw);
    } catch (err) {
        // db.json exists but is empty or corrupted (e.g. a previous write got
        // interrupted). Recover instead of crashing every request.
        const fresh = seedData();
        writeDb(fresh);
        return fresh;
    }
}

function writeDb(db) {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

module.exports = { readDb, writeDb, genId };