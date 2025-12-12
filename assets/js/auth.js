// Client-side admin auth using SHA-256 (NOT secure for production)
// To avoid storing a plaintext password here, set `ADMIN_HASH` to the SHA-256
// hex of your chosen password. Use `generateHash('yourPassword')` in the
// browser console to produce the hash and paste it below.
const ADMIN_HASH = '';

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

// loginAdmin compares hash of provided password against ADMIN_HASH
async function loginAdmin(password) {
    if (!password) return false;
    if (ADMIN_HASH && ADMIN_HASH.length === 64) {
        const h = await sha256Hex(password);
        if (h === ADMIN_HASH) {
            sessionStorage.setItem('isAdmin', '1');
            return true;
        }
        return false;
    }
    // Fallback: if ADMIN_HASH not set, deny login (safer than storing plaintext)
    return false;
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
