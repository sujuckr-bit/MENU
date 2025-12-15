# 🛒 BAZAR HmI - Complete Setup Guide

## ✅ Sistem Operasional

**Status:**
- ✅ Database JSON-backed (persistent)
- ✅ API Server (Node.js + Express)
- ✅ Frontend Server (HTTP)
- ✅ Authentication (server-side)
- ✅ Order Management
- ✅ Menu Management

---

## 🚀 Quick Start (3 langkah)

### 1️⃣ **Start API Server** (Terminal 1)
```bash
cd server
npm start
```
✓ Server akan running di `http://localhost:3000`

### 2️⃣ **Start Frontend Server** (Terminal 2)
```bash
node serve.js
```
✓ Frontend akan serve di `http://localhost:8000`

### 3️⃣ **Akses Aplikasi** (Browser)
- 🥤 **Pesan Makanan/Minuman** → http://localhost:8000/pesan.html
- 📋 **Daftar Pesanan (Admin)** → http://localhost:8000/daftar.html
- 👤 **Pesanan Masuk** → http://localhost:8000/pesanan-masuk.html
- 🔐 **Admin Login** → http://localhost:8000/admin-login.html

---

## 🔐 Admin Login

**Default Password:** `admin123`

**Ubah password:**
1. Login di admin panel
2. Klik "Ubah Password"
3. Masukkan password baru

Password di-hash dengan bcrypt dan tersimpan di database server (aman).

---

## 📊 Database

**Lokasi:** `server/data/database.json`

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
    {
      "id": 1,
      "buyerName": "John",
      "tableNumber": "1",
      "items": [...],
      "total": 50000,
      "createdAt": 1702464000000,
      "completed": false
    }
  ]
}
```

---

## 🔌 API Endpoints

**Base URL:** `http://localhost:3000`

### Authentication
- `POST /api/login` → Login admin
  ```json
  { "password": "admin123" }
  ```
- `POST /api/logout` → Logout

### Menus
- `GET /api/menus` → Ambil semua menu
- `POST /api/menus` → Update menu (admin only)

### Orders
- `GET /api/orders` → Ambil semua orders (admin only)
- `POST /api/orders` → Buat order baru

### Admin
- `POST /api/change-password` → Ubah password admin

---

## 📁 Struktur Project

```
MENU/
├── server/
│   ├── index.js              # API Server (Express)
│   ├── db.js                 # Database layer
│   ├── migrate.js            # Data migration
│   ├── package.json
│   ├── data/
│   │   ├── database.json     # Database (persistent)
│   │   ├── users.json        # Legacy (dimigrasi)
│   │   ├── menus.json        # Legacy
│   │   └── orders.json       # Legacy
│   └── README.md
├── assets/
│   ├── js/
│   │   ├── api-config.js     # API helper functions
│   │   ├── auth.js           # Authentication (server-side)
│   │   └── main.js
│   ├── css/
│   ├── img/
│   └── vendor/
├── pesan.html                # Order page
├── daftar.html               # Order list (admin)
├── pesanan-masuk.html         # My orders
├── admin-login.html          # Admin login
├── index.html                # Home
├── script.js                 # Main app logic
├── styles.css
├── serve.js                  # Frontend HTTP server
├── test-api.html             # API test page
└── README.md                 # (This file)
```

---

## 🔧 Development & Customization

### Menambah Menu Item
1. Edit `server/data/menus.json` atau via `/api/menus`
2. Frontend akan auto-load dari API

### Mengubah Port
**API (server):** Edit `server/index.js` line terakhir
```javascript
const port = process.env.PORT || 3000; // Change 3000
```

**Frontend:** Edit `serve.js` line pertama
```javascript
const PORT = 8000; // Change 8000
```

### Environment Variables
Buat `.env` di folder `server`:
```
PORT=3000
ADMIN_PASSWORD=your-new-password
```

---

## 🐛 Troubleshooting

### "Port sudah dipakai"
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>
```

### "Cannot find module"
```bash
cd server
npm install
```

### "Database kosong"
```bash
# Re-migrate dari JSON files lama
cd server
npm run migrate
```

---

## 📱 Deployment

### Production Checklist
- [ ] Change default admin password
- [ ] Setup reverse proxy (Nginx/Apache)
- [ ] Enable HTTPS/SSL
- [ ] Setup database backup
- [ ] Monitor server logs
- [ ] Setup CORS properly

### Deploy ke Hosting
1. Copy `server/` folder
2. Copy `assets/`, `*.html` ke server
3. Run `npm install && npm start`
4. Setup reverse proxy ke port 3000

---

## 📞 Support

Untuk customization atau debug lebih lanjut, hubungi developer. ✨

---

**Last Updated:** Dec 13, 2025
**Status:** Production Ready ✅
