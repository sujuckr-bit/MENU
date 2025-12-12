// Tampilkan link "Edit Menu" di navbar untuk admin saja
document.addEventListener('DOMContentLoaded', () => {
    const isAdmin = sessionStorage.getItem('isAdmin') === '1';

    const navList = document.querySelector('.navbar-nav');
    if (!navList) return;

    // Create a container li for Admin menu
    const adminLi = document.createElement('li');
    adminLi.className = 'nav-item';

    if (!isAdmin) {
        // Show simple Admin link to login page for non-admin visitors
        adminLi.innerHTML = `<a class="nav-link" href="admin-login.html" style="color: #495057; font-weight: 600;">Admin</a>`;
        // Insert near the end
        navList.appendChild(adminLi);
    } else {
        // Show dropdown with admin actions for logged-in admin
        adminLi.className = 'nav-item dropdown';
        adminLi.innerHTML = `
            <a class="nav-link dropdown-toggle" href="#" id="adminMenuDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false" style="color:#ff6b6b;font-weight:700;">
                Admin ⚙️
            </a>
            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="adminMenuDropdown">
                <li><a class="dropdown-item" href="daftar.html">📋 Daftar Pesanan</a></li>
                <li><a class="dropdown-item" href="admin.html">✏️ Edit Menu</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><button id="navLogoutBtn" class="dropdown-item text-danger">🚪 Logout</button></li>
            </ul>
        `;

        navList.appendChild(adminLi);

        // Attach logout handler
        setTimeout(() => {
            const logoutBtn = document.getElementById('navLogoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    sessionStorage.removeItem('isAdmin');
                    // If backend session exists, attempt fetch /api/logout (best-effort)
                    try { fetch('/api/logout', { method: 'POST', credentials: 'include' }).catch(()=>{}); } catch(e) {}
                    location.href = 'admin-login.html';
                });
            }
        }, 50);
    }
});
