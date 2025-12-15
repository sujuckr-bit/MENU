# ENVIRONMENT VARIABLES CONFIGURATION

**Status:** Phase 1 Complete | **Priority:** Critical for Phase 2

---

## 🔐 REQUIRED ENV VARIABLES

### Immediate (Phase 1 - Testing Tools)

| Variable | Purpose | Example | Required | Phase |
|----------|---------|---------|----------|-------|
| `TEST_ADMIN_PASSWORD` | Password untuk testing tools | `SecurePass123!` | ✅ Yes | 1 |
| `ADMIN_PASSWORD` | Fallback untuk testing (if no TEST_ADMIN_PASSWORD) | `SecurePass123!` | ❌ No | 1 |

**Penggunaan di Tools:**
```javascript
const adminPassword = process.env.TEST_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
```

**Setting di Windows:**
```powershell
# PowerShell
$env:TEST_ADMIN_PASSWORD = "SecurePass123!"

# Command Prompt
set TEST_ADMIN_PASSWORD=SecurePass123!

# Run test
node tools\login_and_complete_order.js
```

---

### Upcoming (Phase 2 - Production Security)

| Variable | Purpose | Example | Required | Phase |
|----------|---------|---------|----------|-------|
| `SESSION_SECRET` | Express session secret (CRITICAL) | `random-long-string-min-32-chars` | ✅ Yes | 2 |
| `FRONTEND_URL` | Frontend domain untuk CORS whitelist | `http://localhost:8000` | ✅ Yes | 2 |
| `BACKEND_URL` | Backend domain (optional) | `http://localhost:3000` | ❌ No | 2 |
| `NODE_ENV` | Environment mode | `development` or `production` | ❌ No | 2 |

**Location di Code:**
- SESSION_SECRET: `server/index.js` line 29
- FRONTEND_URL: `server/index.js` line 27 (CORS config)

---

## 📝 HOW TO SET ENV VARIABLES

### Option 1: .env File (Development)

Buat file `server/.env`:
```
SESSION_SECRET=your-random-secret-min-32-characters-long
FRONTEND_URL=http://localhost:8000
TEST_ADMIN_PASSWORD=YourAdminPassword123!
NODE_ENV=development
```

Install dotenv:
```bash
npm install dotenv
```

Load di server/index.js:
```javascript
require('dotenv').config();
const sessionSecret = process.env.SESSION_SECRET || 'default-dev-only';
```

### Option 2: System Environment (Windows)

```powershell
# Permanent (system-wide)
[Environment]::SetEnvironmentVariable("SESSION_SECRET", "your-secret", "User")

# Temporary (current session only)
$env:SESSION_SECRET = "your-secret"
```

### Option 3: .bat Script (Windows Automation)

Buat file `start-dev.bat`:
```batch
@echo off
set SESSION_SECRET=dev-secret-change-in-production
set FRONTEND_URL=http://localhost:8000
set TEST_ADMIN_PASSWORD=AdminPass123!
set NODE_ENV=development

cd server
npm start
```

### Option 4: Docker / Production

Di `docker-compose.yml`:
```yaml
services:
  backend:
    environment:
      - SESSION_SECRET=prod-random-secret-32-chars
      - FRONTEND_URL=https://yourdomain.com
      - NODE_ENV=production
```

---

## 🔍 VERIFICATION

### Cek Env Variables Sudah Set
```powershell
# PowerShell
$env:TEST_ADMIN_PASSWORD
$env:SESSION_SECRET

# Command Prompt
echo %TEST_ADMIN_PASSWORD%
echo %SESSION_SECRET%
```

### Cek Di Node.js
```javascript
console.log('TEST_ADMIN_PASSWORD:', process.env.TEST_ADMIN_PASSWORD);
console.log('SESSION_SECRET:', process.env.SESSION_SECRET);
console.log('All env vars:', process.env);
```

---

## ⚠️ SECURITY GUIDELINES

1. **JANGAN hardcode credentials** di repository
2. **JANGAN commit `.env`** ke git (tambah ke `.gitignore`)
3. **JANGAN share passwords** di chat/email
4. **SESSION_SECRET harus:** 
   - Random string
   - Minimum 32 characters
   - Different di setiap environment (dev/staging/prod)
   - Changed regularly di production

5. **Test Password:**
   - Gunakan password yang BERBEDA dari production admin password
   - Ubah setelah setiap test cycle
   - Jangan gunakan di production

---

## 🧪 TEST SETELAH SET ENV VARIABLES

```bash
# Verifikasi tools dapat membaca env var
node tools\login_and_complete_order.js

# Expected output jika benar:
# "Attempting to login as admin..."

# Expected output jika salah:
# "ERROR: TEST_ADMIN_PASSWORD or ADMIN_PASSWORD env var not set"
```

---

## 📊 PROGRESS TRACKING

| Phase | Task | Env Vars | Status |
|-------|------|----------|--------|
| 1 | Remove fallback password | TEST_ADMIN_PASSWORD | ✅ Done |
| 1 | Update tools scripts | TEST_ADMIN_PASSWORD | ✅ Done |
| 2 | Set SESSION_SECRET | SESSION_SECRET | ⏳ Pending |
| 2 | Set FRONTEND_URL | FRONTEND_URL | ⏳ Pending |
| 3 | Input validation | - | ⏳ Pending |
| 4 | Documentation | - | ⏳ Pending |

---

**Next Step:** Approve Phase 2 untuk implementasi SESSION_SECRET env variable di server/index.js

