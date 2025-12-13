// Client auth helper that prefers server API but falls back to legacy client-side storage if needed.
const AUTH_API_BASE = 'http://localhost:3000/api';

function initializeAdminPassword() {
    // kept for compatibility with existing code; server manages password now
}

function isAdmin() {
    return sessionStorage.getItem('isAdmin') === '1';
}

async function loginWithAPI(password) {
    try {
        const resp = await fetch(AUTH_API_BASE + '/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            credentials: 'include', body: JSON.stringify({ password })
        });
        if (!resp.ok) return false;
        // mark client session
        sessionStorage.setItem('isAdmin', '1');
        return true;
    } catch (e) {
        console.warn('API login failed, falling back to client-side', e);
        return false;
    }
}

async function logoutWithAPI() {
    try {
        await fetch(AUTH_API_BASE + '/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {}
    sessionStorage.removeItem('isAdmin');
}

async function changeAdminPasswordViaAPI(newPassword) {
    try {
        const resp = await fetch(AUTH_API_BASE + '/change-password', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            credentials: 'include', body: JSON.stringify({ newPassword })
        });
        if (!resp.ok) throw new Error('failed');
        return true;
    } catch (e) {
        throw e;
    }
}

// Public helpers used by existing pages
async function loginAdmin(password) {
    if (!password) return false;
    const ok = await loginWithAPI(password);
    if (ok) return true;
    // fallback: try legacy client-side login if present
    if (typeof window.legacyLoginAdmin === 'function') {
        return window.legacyLoginAdmin(password);
    }
    return false;
}

function setAdminPassword(newPassword) {
    // Try API first; if fails, try legacy set
    return changeAdminPasswordViaAPI(newPassword).catch(() => {
        if (typeof window.legacySetAdminPassword === 'function') return window.legacySetAdminPassword(newPassword);
        return Promise.reject(new Error('no method to set password'));
    });
}

function logoutAdmin() {
    logoutWithAPI();
}

// Helper to attach to a login form (supports async login)
function handleAdminLoginForm(formId, inputId, onSuccessUrl) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const input = document.getElementById(inputId);
        const pwd = input ? input.value : '';
        try {
            const ok = await loginAdmin(pwd);
            if (ok) {
                if (onSuccessUrl) window.location.href = onSuccessUrl;
                else alert('Login admin berhasil');
            } else {
                alert('Password salah.');
            }
        } catch (err) {
            alert('Login gagal: ' + err.message);
        }
    });
}

// Optional: check server session (returns {isAdmin, username})
async function fetchSessionInfo() {
    try {
        const r = await fetch(AUTH_API_BASE + '/me', { credentials: 'include' });
        if (!r.ok) return { isAdmin: false };
        return await r.json();
    } catch (e) { return { isAdmin: false }; }
}
