// Client-side admin auth menggunakan SHA-256
// Default password: "admin123" (bisa diubah dari admin panel)
// PENTING: Ini client-side saja, untuk production gunakan server-side auth!

// Toggle untuk menonaktifkan mekanisme hashing SHA-256 (development/testing)
// Jika di-set true, password disimpan dan dibandingkan secara plaintext di localStorage.
// WARNING: Menonaktifkan SHA sangat tidak aman untuk production.
const DISABLE_SHA = true;

// Initialize dengan default password jika belum ada
const DEFAULT_PASSWORD_HASH = 'f8cd43ba29c16eb96f04a8f39de49e68bf70a04ccb5b40a2d5e03a70c1a46bb0'; // SHA-256 hash dari "admin123"

function initializeAdminPassword() {
    if (DISABLE_SHA) {
        if (!localStorage.getItem('adminPasswordPlain')) {
            localStorage.setItem('adminPasswordPlain', 'admin123');
        }
    } else {
        if (!localStorage.getItem('adminPasswordHash')) {
            localStorage.setItem('adminPasswordHash', DEFAULT_PASSWORD_HASH);
        }
    }
}


function getAdminPasswordHash() {
    if (DISABLE_SHA) return localStorage.getItem('adminPasswordPlain') || 'admin123';
    return localStorage.getItem('adminPasswordHash') || DEFAULT_PASSWORD_HASH;
}

function isAdmin() {
    return sessionStorage.getItem('isAdmin') === '1';
}

async function sha256Hex(str) {
    const enc = new TextEncoder();
    const data = enc.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper to generate hash for setup (run in browser console):
// generateHash('mypassword').then(h => console.log(h))
function generateHash(password) {
    return sha256Hex(password);
}

// loginAdmin compares hash of provided password against stored password hash
async function loginAdmin(password) {
    if (!password) return false;
    initializeAdminPassword();
    if (DISABLE_SHA) {
        const stored = localStorage.getItem('adminPasswordPlain') || 'admin123';
        if (password === stored) {
            sessionStorage.setItem('isAdmin', '1');
            return true;
        }
        return false;
    }

    const storedHash = getAdminPasswordHash();
    const h = await sha256Hex(password);
    if (h === storedHash) {
        sessionStorage.setItem('isAdmin', '1');
        return true;
    }
    return false;
}

function setAdminPassword(newPassword) {
    if (DISABLE_SHA) {
        return Promise.resolve().then(() => {
            localStorage.setItem('adminPasswordPlain', newPassword);
            return newPassword;
        });
    }

    return sha256Hex(newPassword).then(hash => {
        localStorage.setItem('adminPasswordHash', hash);
        return hash;
    });
}

function logoutAdmin() {
    sessionStorage.removeItem('isAdmin');
}

// Helper to attach to a login form (supports async login)
function handleAdminLoginForm(formId, inputId, onSuccessUrl) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const input = document.getElementById(inputId);
        const pwd = input ? input.value : '';
        const ok = await loginAdmin(pwd);
        if (ok) {
            if (onSuccessUrl) window.location.href = onSuccessUrl;
            else alert('Login admin berhasil');
        } else {
            // Generic failure message (avoid exposing internal ADMIN_HASH state)
            alert('Password salah.');
        }
    });
}
