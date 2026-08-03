/* =========================================================
   Inkwell — shared frontend logic (Module 3)
   Talks to the Express/Node REST API under /api instead of
   reading/writing localStorage directly. The JWT token and a
   cached copy of the signed-in user are kept in localStorage
   just so the nav can render instantly without a round trip.
   ========================================================= */

const API_BASE = '/api';
const TOKEN_KEY = 'inkwell_token';
const USER_KEY = 'inkwell_user';

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

/* ---------- low-level API call helper ---------- */
async function apiFetch(path, options = {}) {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    if (token) headers['Authorization'] = 'Bearer ' + token;

    let res;
    try {
        res = await fetch(API_BASE + path, { ...options, headers });
    } catch (networkErr) {
        return { ok: false, error: 'Could not reach the server. Is it running?' };
    }

    let data = null;
    try { data = await res.json(); } catch (e) { /* empty body is fine */ }

    if (!res.ok) {
        return { ok: false, status: res.status, error: (data && data.error) || 'Something went wrong.' };
    }
    return { ok: true, ...data };
}

/* ---------- auth ---------- */
const Auth = {
    // synchronous — reads the cached copy so nav rendering doesn't need a round trip
    currentUser() {
        return readJSON(USER_KEY, null);
    },
    async register({ name, email, password }) {
        const r = await apiFetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password }),
        });
        if (r.ok) {
            localStorage.setItem(TOKEN_KEY, r.token);
            writeJSON(USER_KEY, r.user);
        }
        return r;
    },
    async login({ email, password }) {
        const r = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        if (r.ok) {
            localStorage.setItem(TOKEN_KEY, r.token);
            writeJSON(USER_KEY, r.user);
        }
        return r;
    },
    logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },
};

/* ---------- posts ---------- */
const Posts = {
    async published() {
        const r = await apiFetch('/posts');
        return r.ok ? r.posts : [];
    },
    async mine() {
        const r = await apiFetch('/posts/mine');
        return r.ok ? r.posts : [];
    },
    async find(id) {
        const r = await apiFetch('/posts/' + id);
        return r.ok ? r.post : null;
    },
    async create(post) {
        return apiFetch('/posts', { method: 'POST', body: JSON.stringify(post) });
    },
    async update(id, patch) {
        return apiFetch('/posts/' + id, { method: 'PUT', body: JSON.stringify(patch) });
    },
    async remove(id) {
        return apiFetch('/posts/' + id, { method: 'DELETE' });
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

/* Redirect guard for pages that require a session.
   This only checks that a token exists locally, for UX — the
   API itself still enforces auth on every protected request. */
function requireAuth() {
    if (!localStorage.getItem(TOKEN_KEY)) {
        window.location.href = 'login.html?next=' + encodeURIComponent(window.location.pathname.split('/').pop());
    }
}

document.addEventListener('DOMContentLoaded', renderNav);