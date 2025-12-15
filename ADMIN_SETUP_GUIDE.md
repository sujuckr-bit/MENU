# 🔐 ADMIN ACCOUNT SETUP GUIDE

---

## 📊 STATUS SEKARANG

✅ **Admin account sudah ada di database**
- Username: `admin`
- Password: Masih perlu di-setup dengan password yang aman

---

## 🚀 LANGKAH-LANGKAH SETUP

### Step 1: Persiapkan Password Baru

Pilih password yang kuat:
- **Minimal 8 karakter**
- **Mix:** huruf besar, huruf kecil, angka, simbol
- **Contoh BAIK:** `Bazar@Secure123!`
- **Contoh BURUK:** `admin123`, `password`, `123456`

### Step 2: Jalankan Setup Script

**Option A - PowerShell (Recommended):**
```powershell
$env:TEST_ADMIN_PASSWORD = "Bazar@Secure123!"
node tools\setup_admin.js
```

**Option B - Command Prompt:**
```batch
set TEST_ADMIN_PASSWORD=Bazar@Secure123!
node tools\setup_admin.js
```

**Option C - Inline PowerShell:**
```powershell
TEST_ADMIN_PASSWORD="Bazar@Secure123!" node tools\setup_admin.js
```

### Step 3: Verifikasi Berhasil

Output yang diharapkan:
```
🔧 Setting up Admin Account...

✓ Database initialized
✓ Hashing password...
✓ Admin password updated in database

✅ SUCCESS: Admin account ready!

📋 Admin Details:
   Username: admin
   Password: ••••••••• (set via env var)
   Hash: $2a$10$nCHMpD...

🌐 Login URL: http://localhost:8000/admin-login.html
```

---

## 🧪 TEST SETELAH SETUP

### 1. Start Server
```bash
cd server
npm start
```

Tunggu sampai terlihat:
```
Server running on port 3000
WebSocket server ready
```

### 2. Start Frontend
Di terminal baru:
```bash
node serve.js
```

Tunggu sampai terlihat:
```
Server running on port 8000
```

### 3. Test Login

Buka browser: `http://localhost:8000/admin-login.html`

Masukkan:
- **Username:** `admin`
- **Password:** `Bazar@Secure123!` (atau password yang Anda set)

Klik **Login** → Seharusnya berhasil masuk

### 4. Verifikasi Admin Page

Setelah login, akan redirect ke admin page. Cek:
- ✅ Admin panel terbuka
- ✅ Bisa melihat order list
- ✅ Bisa lihat menu items
- ✅ Bisa edit/delete items

---

## 🔄 JIKA INGIN UBAH PASSWORD LAGI

Cukup jalankan setup script lagi dengan password baru:

```powershell
$env:TEST_ADMIN_PASSWORD = "NewPassword@123!"
node tools\setup_admin.js
```

---

## 💾 BACKUP CURRENT PASSWORD

**PENTING:** Simpan password di tempat yang aman!

**DO:**
- ✅ Tulis di password manager (Bitwarden, LastPass, dll)
- ✅ Simpan di `.env` file (di `.gitignore`)
- ✅ Backup ke cloud drive yang terenkripsi

**DON'T:**
- ❌ Jangan simpan di plaintext file yang di-commit ke git
- ❌ Jangan kirim via email/chat
- ❌ Jangan gunakan password yang sama di akun lain

---

## 🛠️ TROUBLESHOOTING

### Error: "TEST_ADMIN_PASSWORD or ADMIN_PASSWORD env var not set"
**Solution:** Set env var sebelum jalankan script
```powershell
$env:TEST_ADMIN_PASSWORD = "your_password"
node tools\setup_admin.js
```

### Error: "Cannot find module 'bcryptjs'"
**Solution:** Install dependencies
```bash
cd server
npm install
```

### Error: "Database not found"
**Solution:** Pastikan running dari folder MENU (where database.json exists)
```bash
cd c:\Users\DELL\Desktop\MENU
node tools\setup_admin.js
```

### Login masih gagal
**Steps:**
1. Verifikasi password yang digunakan saat setup
2. Pastikan server running (`npm start` di folder server)
3. Check server logs untuk error message
4. Setup ulang password dengan perintah di atas

---

## 📋 NEXT STEPS

Setelah admin account siap:

1. **Test tools scripts dengan env var:**
   ```powershell
   $env:TEST_ADMIN_PASSWORD = "your_password"
   node tools\login_and_complete_order.js
   ```

2. **Lanjut Phase 2:**
   - Setup SESSION_SECRET env variable
   - Restrict CORS origin ke whitelist

3. **Dokumentasi:**
   - Update setup guide dengan admin password setup
   - Create security best practices guide

---

## 🎯 CHECKLIST

- [ ] Password sudah dipilih dan aman
- [ ] `setup_admin.js` dijalankan dengan berhasil (✅ SUCCESS output)
- [ ] Server dapat start (`npm start` di server folder)
- [ ] Frontend dapat start (`node serve.js`)
- [ ] Login berhasil dengan admin account
- [ ] Admin panel terbuka setelah login
- [ ] Password disimpan di tempat aman
- [ ] ENV var TEST_ADMIN_PASSWORD di-set untuk tools scripts

---

**Created:** 15 Desember 2025  
**Status:** 🟢 Ready to Use

