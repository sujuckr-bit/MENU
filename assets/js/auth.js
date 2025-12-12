// Server-side admin auth via API
// Password is validated by the server at http://localhost:3000/api/login
// This is much more secure than client-side auth

function initializeAdminPassword() {
    // No longer needed - password is managed server-side
    // This function is kept for backward compatibility
}

function getAdminPasswordHash() {
    // Deprecated - not used anymore
    return null;
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

// Login via API
async function loginAdmin(password) {
    if (!password) return false;
    return await loginWithAPI(password);
}

function setAdminPassword(newPassword) {
    // Use API to change password
    return changeAdminPasswordViaAPI(newPassword);
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
