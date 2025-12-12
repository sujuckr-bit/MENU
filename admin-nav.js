// Tampilkan link "Edit Menu" di navbar untuk admin saja
document.addEventListener('DOMContentLoaded', () => {
    const isAdmin = sessionStorage.getItem('isAdmin') === '1';
    if (!isAdmin) return;

    // Cari navbar dan tambahkan link Edit Menu
    const navList = document.querySelector('.navbar-nav');
    if (!navList) return;

    // Buat item nav baru untuk Edit Menu
    const editMenuItem = document.createElement('li');
    editMenuItem.className = 'nav-item';
    editMenuItem.innerHTML = `<a class="nav-link" href="admin.html" style="color: #ff6b6b; font-weight: 700;">⚙️ Edit Menu</a>`;
    
    // Tambahkan sebelum tombol "Pesan Sekarang" atau di akhir
    const peranButtons = navList.querySelector('.btn-primary');
    if (peranButtons) {
        navList.insertBefore(editMenuItem, peranButtons.parentElement);
    } else {
        navList.appendChild(editMenuItem);
    }
});
