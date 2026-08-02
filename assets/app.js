/* =========================================================
   Inkwell — shared app logic
   Everything is stored client-side in localStorage. This is a
   Module 2 (frontend-only) build: no server, no real security —
   it exists so the UI has real data to work with.
   ========================================================= */

const DB = {
    USERS: 'inkwell_users',
    SESSION: 'inkwell_session',
    POSTS: 'inkwell_posts',
};

/* ---------- tiny helpers ---------- */
function readJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
        return fallback;
    }
}
function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}
function uid() {
    return Math.random().toString(36).slice(2, 10);
}
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function initials(name) {
    return (name || '?').trim().slice(0, 1).toUpperCase();
}

/* ---------- seed data (first run only) ---------- */
function seedIfEmpty() {
    const users = readJSON(DB.USERS, null);
    if (!users) {
        writeJSON(DB.USERS, [
            { id: 'seed-1', name: 'Amara Reyes', email: 'amara@example.com', password: 'password123' },
        ]);
    }
    const posts = readJSON(DB.POSTS, null);
    if (!posts) {
        writeJSON(DB.POSTS, [
            {
                id: uid(),
                authorId: 'seed-1',
                authorName: 'Amara Reyes',
                title: 'Why I keep a paper notebook next to my laptop',
                tag: 'process',
                body: 'Screens are for editing. Paper is for thinking. I write every first draft by hand because the friction slows me down just enough to notice what I actually mean before I commit it to a file...',
                createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
                status: 'published',
            },
            {
                id: uid(),
                authorId: 'seed-1',
                authorName: 'Amara Reyes',
                title: 'A four-day plan for shipping your first real UI',
                tag: 'learning',
                body: 'Most tutorials teach syntax. Almost none teach sequencing — what to build first so day two does not undo day one. Here is the order that has worked for every beginner I have mentored...',
                createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
                status: 'published',
            },
            {
                id: uid(),
                authorId: 'seed-1',
                authorName: 'Amara Reyes',
                title: 'Drafted: thoughts on responsive type scales',
                tag: 'draft',
                body: 'Still figuring out the right clamp() values for this one — notes so far below.',
                createdAt: new Date(Date.now() - 86400000 * 0.2).toISOString(),
                status: 'draft',
            },
        ]);
    }
}
seedIfEmpty();

/* ---------- auth ---------- */
const Auth = {
    currentUser() {
        const session = readJSON(DB.SESSION, null);
        if (!session) return null;
        const users = readJSON(DB.USERS, []);
        return users.find(u => u.id === session.userId) || null;
    },
    register({ name, email, password }) {
        const users = readJSON(DB.USERS, []);
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            return { ok: false, error: 'An account with that email already exists.' };
        }
        const user = { id: uid(), name, email, password };
        users.push(user);
        writeJSON(DB.USERS, users);
        writeJSON(DB.SESSION, { userId: user.id });
        return { ok: true, user };
    },
    login({ email, password }) {
        const users = readJSON(DB.USERS, []);
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user || user.password !== password) {
            return { ok: false, error: 'Email or password is incorrect.' };
        }
        writeJSON(DB.SESSION, { userId: user.id });
        return { ok: true, user };
    },
    logout() {
        localStorage.removeItem(DB.SESSION);
    },
};

/* ---------- posts ---------- */
const Posts = {
    all() {
        return readJSON(DB.POSTS, []);
    },
    published() {
        return this.all()
            .filter(p => p.status === 'published')
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    byAuthor(authorId) {
        return this.all()
            .filter(p => p.authorId === authorId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    find(id) {
        return this.all().find(p => p.id === id) || null;
    },
    create(post) {
        const posts = this.all();
        posts.push(post);
        writeJSON(DB.POSTS, posts);
    },
    update(id, patch) {
        const posts = this.all();
        const idx = posts.findIndex(p => p.id === id);
        if (idx === -1) return;
        posts[idx] = { ...posts[idx], ...patch };
        writeJSON(DB.POSTS, posts);
    },
    remove(id) {
        const posts = this.all().filter(p => p.id !== id);
        writeJSON(DB.POSTS, posts);
    },
};

/* ---------- nav rendering (runs on every page) ---------- */
function renderNav() {
    const slot = document.getElementById('nav-auth-slot');
    if (!slot) return;
    const user = Auth.currentUser();

    if (user) {
        slot.innerHTML = `
      <div class="nav-user">
        <span class="avatar">${escapeHTML(initials(user.name))}</span>
        <span class="hide-mobile">${escapeHTML(user.name.split(' ')[0])}</span>
        <button class="link-btn" id="logout-btn" type="button">Sign out</button>
      </div>
    `;
        document.getElementById('logout-btn').addEventListener('click', () => {
            Auth.logout();
            window.location.href = 'index.html';
        });
    } else {
        slot.innerHTML = `<a class="nav-cta" href="login.html">Sign in</a>`;
    }
}

/* Redirect guard for pages that require a session */
function requireAuth() {
    if (!Auth.currentUser()) {
        window.location.href = 'login.html?next=' + encodeURIComponent(window.location.pathname.split('/').pop());
    }
}

document.addEventListener('DOMContentLoaded', renderNav);