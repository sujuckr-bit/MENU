# 🔍 Debug Guide - Menu & Table Number Issues

## Gejala Masalah
- Daftar menu (kategori Minum/Makan) tidak ditampilkan
- Nomor meja tidak ditampilkan
- Form pemesanan mungkin kosong

## Debugging Steps

### 1. Buka Browser Console
- Tekan `F12` atau `Ctrl+Shift+I` untuk buka DevTools
- Cek bagian "Console"

### 2. Periksa Log Messages
Anda akan melihat messages seperti:
```
📋 Script.js loaded - Page detection: { isOrderPage: true, isListPage: false, isMyOrdersPage: false }
✅ Initializing Order Page...
🔍 DOM Elements: { categorySelect: true, itemSelect: true, tableSelect: true, orderForm: true }
📍 Populating table numbers...
✅ Table numbers populated successfully!
```

### 3. Kemungkinan Masalah & Solusi

#### Problem A: `isOrderPage` adalah `false`
**Penyebab:** Element dengan `id="orderForm"` tidak ditemukan
**Solusi:** Pastikan file [pesan.html](pesan.html) memiliki `<form id="orderForm">` di dalam body

#### Problem B: Script.js tidak ter-load
**Penyebab:** File script.js tidak ter-import dengan benar
**Solusi:** Periksa di bawah `</footer>` di [pesan.html](pesan.html), pastikan ada:
```html
<script src="script.js"></script>
```

#### Problem C: DOMContentLoaded belum trigger
**Penyebab:** DOM belum siap saat script berjalan
**Solusi:** Refresh halaman dengan `Ctrl+F5` (clear cache)

#### Problem D: localStorage/menus kosong
**Penyebab:** Data menu tidak ter-load dari localStorage atau API
**Solusi:** Check Console untuk message tentang menus loading

### 4. Manual Test di Console

Jika halaman sudah dimuat, ketik di console:
```javascript
// Cek apakah menus sudah ter-load
console.log(window.menus);

// Cek apakah tableSelect element ada
console.log(document.getElementById('tableNumber'));

// Cek berapa opsi yang ada di table select
console.log(document.getElementById('tableNumber').options.length);

// Cek localStorage menus
console.log(JSON.parse(localStorage.getItem('siteMenus') || '{}'));
```

### 5. Clear Cache & Reload
- Tekan `Ctrl+Shift+Delete` untuk buka Clear Browsing Data
- Pilih "All time" dan centang "Cached images and files"
- Klik "Clear data"
- Refresh halaman dengan `Ctrl+F5`

## Jika Masih Tidak Berhasil

1. **Backup file penting**
2. **Buka file script.js & pesan.html**
3. **Pastikan tidak ada syntax error** (cek Console)
4. **Cek apakah ada JavaScript yang ter-stop**

## Testing Checklist

- [ ] Buka pesan.html di browser
- [ ] F12 → Console tab
- [ ] Lihat apakah ada error messages
- [ ] Lihat apakah "✅ Table numbers populated successfully!" muncul
- [ ] Pilih kategori "Minum" atau "Makan"
- [ ] Periksa apakah menu items muncul
- [ ] Cek apakah dropdown "Nomor Meja" memiliki opsi

---
**Last Updated:** 13 Dec 2024
