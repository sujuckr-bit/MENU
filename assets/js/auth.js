// Client-side admin auth menggunakan SHA-256
// Default password: "admin123" (bisa diubah dari admin panel)
// PENTING: Ini client-side saja, untuk production gunakan server-side auth!

// Initialize dengan default password jika belum ada
const DEFAULT_PASSWORD_HASH = 'f8cd43ba29c16eb96f04a8f39de49e68bf70a04ccb5b40a2d5e03a70c1a46bb0'; // SHA-256 hash dari "admin123"

function initializeAdminPassword() {
    if (!localStorage.getItem('adminPasswordHash')) {
        localStorage.setItem('adminPasswordHash', DEFAULT_PASSWORD_HASH);
    }
}

function getAdminPasswordHash() {
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
    const storedHash = getAdminPasswordHash();
    const h = await sha256Hex(password);
    if (h === storedHash) {
        sessionStorage.setItem('isAdmin', '1');
        return true;
    }
    return false;
}

function setAdminPassword(newPassword) {
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
            alert('Password salah atau ADMIN_HASH belum di-set.');
        }
    });
}
