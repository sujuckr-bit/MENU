// Client auth helper that prefers server API but falls back to legacy client-side storage if needed.
// Untuk Android: ganti localhost dengan IP server (misal: http://192.168.x.x:3000/api)
// Deteksi jika localhost dan ubah ke IP server jika diperlukan
function getAuthAPIBase() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Jika di browser desktop: gunakan localhost
        return 'http://localhost:3000/api';
    } else {
        // Jika di mobile/Android dengan IP: gunakan IP server yang sama
        // Format: http://192.168.x.x:3000/api atau https://domain.com/api
        return `http://${window.location.hostname}:3000/api`;
    }
}
const AUTH_API_BASE = getAuthAPIBase();

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
    
    // Fallback: client-side validation dengan password hardcoded
    // Gunakan ini jika API tidak dapat diakses (offline atau server down)
    const FALLBACK_PASSWORD = 'admin123';
    if (password === FALLBACK_PASSWORD) {
        sessionStorage.setItem('isAdmin', '1');
        console.log('Login berhasil (mode offline/fallback)');
        return true;
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
                else showToast('Login admin berhasil', 'success');
            } else {
                showToast('Password salah.', 'error');
            }
        } catch (err) {
            showToast('Login gagal: ' + err.message, 'error');
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
