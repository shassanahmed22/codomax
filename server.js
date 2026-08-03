require('dotenv').config();
const express = require('express');
const path = require('path');

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// REST API
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

// Serve the frontend (Module 2 pages) from the same server —
// no CORS setup needed since everything shares one origin.
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
    console.log(`Inkwell server running at http://localhost:${PORT}`);
});