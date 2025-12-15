# 🎉 Database Integration Complete!

## Ringkasan Perubahan

Aplikasi BAZAR HmI sekarang menggunakan **API server berbasis Node.js/Express** dengan **JSON database** yang terintegrasi penuh dengan frontend.

### ✅ Fitur Baru:

1. **Server-side Authentication** - Password admin dikelola di server (lebih aman)
2. **Persistent Database** - Orders dan menus tersimpan di `server/data/database.json`
3. **API-driven Frontend** - Semua operasi (login, menus, orders) via API

---

## 🚀 Cara Jalankan

### 1. **Jalankan Server**

```bash
cd server
npm install
npm run migrate  # (opsional, jika ada data lama)
npm start
```

Server akan run di `http://localhost:3000`

### 2. **Buka Frontend**

Buka browser ke folder root (misal: `http://localhost:8000` atau langsung buka `index.html`)

---

## 📁 File-File Baru/Updated

### Baru:
- **`server/db.js`** - Database abstraction (JSON-backed, no native builds)
- **`server/migrate.js`** - Script untuk import data dari JSON lama
- **`assets/js/api-config.js`** - API configuration & helper functions

### Updated:
- **`server/index.js`** - Server endpoints
- **`server/package.json`** - Dependencies (removed better-sqlite3)
- **`assets/js/auth.js`** - Now uses server API instead of localStorage
- **`pesan.html`** - Load api-config.js script
- **`daftar.html`** - Load api-config.js script
- **`pesanan-masuk.html`** - Load api-config.js script
- **`admin-login.html`** - Load api-config.js script
- **`script.js`** - Fetch menus from API, save orders to API

---

## 🔐 Admin Login

**Default password:** `admin123`

Ubah di admin panel setelah login.

---

## 📊 Database File

**Location:** `server/data/database.json`

**Struktur:**
```json
{
  "users": {
    "admin": { "passwordHash": "..." }
  },
  "menus": {
    "Minum": [...],
    "Makan": [...]
  },
  "orders": [
    { "id": 1, "buyerName": "...", "tableNumber": "...", "items": [...], "total": 0, "completed": false }
  ]
}
```

---

## 🛠️ API Endpoints

Semua endpoints memerlukan header `Content-Type: application/json` dan kirim body sebagai JSON.

### Public Endpoints:
- **`POST /api/login`** - Login admin
  ```json
  { "password": "admin123" }
  ```
- **`GET /api/menus`** - Ambil semua menus
- **`POST /api/orders`** - Buat order baru
  ```json
  { "buyerName": "...", "tableNumber": "...", "items": [...], "total": 0 }
  ```

### Admin Only (requires session):
- **`POST /api/logout`** - Logout
- **`POST /api/menus`** - Update menus
  ```json
  { "Minum": [...], "Makan": [...] }
  ```
- **`GET /api/orders`** - Lihat semua orders
- **`POST /api/change-password`** - Ubah password admin
  ```json
  { "newPassword": "newpass123" }
  ```

---

## ✨ Testing

Buka `test-api.html` di browser untuk test semua endpoints dengan UI visual.

---

## 🎯 Next Steps (Optional)

1. **Deploy ke server produksi** (Heroku, VPS, dll)
2. **Setup CORS lebih ketat** untuk production
3. **Add database backup** (cron job, cloud storage)
4. **Implement order history per customer**
5. **Add real-time updates** (WebSocket/polling)

---

**Happy coding! 🎊**
