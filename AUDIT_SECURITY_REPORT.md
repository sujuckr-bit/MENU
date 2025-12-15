# 🔐 LAPORAN AUDIT KEAMANAN CODEBASE - BAZAR HmI

**Tanggal Audit:** 15 Desember 2025  
**Status:** ⚠️ **ISSUES DITEMUKAN - PERBAIKAN DIPERLUKAN**

---

## 📋 RINGKASAN EKSEKUTIF

Audit keamanan terhadap seluruh codebase BAZAR HmI telah menemukan **7 issue keamanan HIGH/MEDIUM** yang memerlukan perhatian segera. Sistem menggunakan autentikasi berbasis password dengan bcrypt di sisi server, namun ada beberapa kelemahan pada client-side fallback dan hardcoding kredensial.

**Prioritas Perbaikan:**
1. ⚠️ **CRITICAL** – Hapus fallback password client-side dan hardcoded credentials
2. 🔴 **HIGH** – Replace session secret literal dengan env variable
3. 🟡 **MEDIUM** – Restrict CORS origin dari `true` ke whitelist eksplisit
4. 🟡 **MEDIUM** – Sanitize innerHTML usages untuk mitigasi XSS
5. 🔵 **LOW** – Dokumentasi keamanan dan best practices

---

## 🔍 TEMUAN DETAIL

### 1. ⚠️ CRITICAL: Fallback Password Client-Side + Hardcoded Credentials

**Severity:** CRITICAL  
**Impact:** Bypass autentikasi server; kredensial exposed di kode

#### Lokasi & Bukti:

- **File:** [assets/js/auth.js](assets/js/auth.js#L68)
  ```javascript
  const FALLBACK_PASSWORD = 'admin123';  // Line 68
  if (password === FALLBACK_PASSWORD) {
      sessionStorage.setItem('isAdmin', '1');
      return true;  // Bypass server auth!
  }
  ```

- **File:** [tools/login_and_complete_order.js](tools/login_and_complete_order.js#L31)
  ```javascript
  const loginData = { username: 'admin', password: 'admin123' };
  ```

- **File:** [tools/trigger_broadcast.js](tools/trigger_broadcast.js#L12)
  ```javascript
  const login = { username: 'admin', password: 'admin123' };
  ```

- **File:** [tools/list_orders_admin.js](tools/list_orders_admin.js#L3)  
  ```javascript
  {username:'admin',password:'admin123'}
  ```

- **File:** [tools/complete_programmatic_tester.js](tools/complete_programmatic_tester.js#L13)
  ```javascript
  {username:'admin',password:'admin123'}
  ```

- **File:** [admin-login.html](admin-login.html#L56)
  ```html
  <strong>Password default:</strong> <code>admin123</code>
  ```

#### Risiko:
- Client-side fallback memungkinkan login tanpa server validation
- Hardcoded credentials di tools scripts bisa di-commit ke repo publik
- Password default `admin123` ditampilkan di dokumentasi dan halaman login

#### Rekomendasi Perbaikan:
```
1. Hapus FALLBACK_PASSWORD dari assets/js/auth.js
2. Ubah tools/* untuk membaca password dari environment variables
3. Hapus display password default dari admin-login.html
4. Update dokumentasi untuk mengarahkan setup password awal via env var
```

---

### 2. 🔴 HIGH: Session Secret Hardcoded

**Severity:** HIGH  
**Impact:** Session tokens dapat diprediksi; session hijacking

#### Lokasi & Bukti:

- **File:** [server/index.js](server/index.js#L29)
  ```javascript
  app.use(session({ 
      secret: 'change-this-secret',  // ← Hardcoded!
      resave: false, 
      saveUninitialized: false 
  }));
  ```

#### Risiko:
- Session secret di-hardcode dalam source code
- Jika repo di-leak, semua session tokens dapat dipalsukan
- Produksi tidak aman untuk digunakan tanpa perubahan manual

#### Rekomendasi Perbaikan:
```javascript
app.use(session({
    secret: process.env.SESSION_SECRET || (() => {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('SESSION_SECRET environment variable required in production');
        }
        return 'dev-secret-change-in-production';
    })(),
    resave: false,
    saveUninitialized: false
}));
```

---

### 3. 🟡 MEDIUM: CORS Configuration Permissive

**Severity:** MEDIUM  
**Impact:** Cross-Origin Resource Sharing terlalu permisif; cookie leakage risk

#### Lokasi & Bukti:

- **File:** [server/index.js](server/index.js#L27)
  ```javascript
  app.use(cors({ 
      origin: true,  // ← Accept all origins!
      credentials: true  // ← Send cookies!
  }));
  ```

#### Risiko:
- `origin: true` memungkinkan **ANY** origin mengakses API dengan session cookies
- Kombinasi dengan `credentials: true` = potential cookie leakage
- CSRF attacks possible dari malicious domains

#### Rekomendasi Perbaikan:
```javascript
const allowedOrigins = [
    'http://localhost:8000',
    'http://localhost:3000',
    process.env.FRONTEND_URL || 'http://localhost:8000'
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS not allowed'));
        }
    },
    credentials: true
}));
```

---

### 4. 🟡 MEDIUM: innerHTML Usage (XSS Risk)

**Severity:** MEDIUM  
**Impact:** Potential DOM-based XSS jika order data dari user tidak tersanitasi

#### Lokasi & Bukti:

- **File:** [script.js](script.js#L124-L130)
  ```javascript
  left.innerHTML = `<p class="mb-1"><strong>👤 Nama Pembeli:</strong> ${order.buyerName}</p>
                    <p class="mb-1"><strong>🪑 Nomor Meja:</strong> ${order.tableNumber}</p>
  ```

- Embedded template strings dengan user-controlled data (buyerName, tableNumber)
- Order data dari API tidak di-sanitasi sebelum diinject ke DOM

#### Risiko:
- Jika order.buyerName = `<img src=x onerror="alert('XSS')">`  
- XSS payload akan dijalankan di browser pengguna admin
- Attacker bisa steal session cookies atau perform unauthorized actions

#### Rekomendasi Perbaikan:
```javascript
// Option 1: Use textContent (safest)
const left = document.createElement('div');
left.className = 'col-md-6';
const p1 = document.createElement('p');
p1.textContent = `👤 Nama Pembeli: ${order.buyerName}`;
left.appendChild(p1);

// Option 2: Use DOMPurify library
left.innerHTML = DOMPurify.sanitize(`<p>Nama: ${order.buyerName}</p>`);
```

---

### 5. 🟡 MEDIUM: Default Admin Password Hash Exposed

**Severity:** MEDIUM  
**Impact:** Predictable hash; password reset mechanism missing

#### Lokasi & Bukti:

- **File:** [server/index.js](server/index.js#L22-L24)
  ```javascript
  const defaultHash = await bcrypt.hash('admin123', 10);
  // → Hash is predictable and can be precomputed
  ```

#### Risiko:
- Default hash selalu sama untuk 'admin123' dengan salt default
- Rainbow tables dapat digunakan untuk crack hash
- Tidak ada mechanism untuk first-time password setup

#### Rekomendasi Perbaikan:
```
1. Require PASSWORD env variable pada first startup
2. Atau implementasi one-time setup page untuk mengatur password awal
3. Jangan generate default password di code
```

---

### 6. 🔵 LOW: Missing Input Validation

**Severity:** LOW  
**Impact:** Invalid data dapat masuk database; error handling unclear

#### Lokasi:
- Order creation endpoints tidak validate item prices, quantities
- Admin password change tidak enforce minimum length
- Menu import tidak validate data structure

#### Rekomendasi:
```
1. Tambah schema validation (joi, zod, atau yup)
2. Validate harga, qty, dan tipe data sebelum save
3. Enforce password length minimum 8 karakter
```

---

### 7. 🔵 LOW: Credentials Included in All Fetch Calls

**Severity:** LOW (By Design)  
**Impact:** Sessions properly managed, but ensure CORS restricted (see Issue #3)

#### Lokasi:
- [assets/js/api-config.js](assets/js/api-config.js#L38) – `credentials: 'include'`
- All API calls include session cookies

#### Status:
✅ **This is CORRECT** untuk session-based auth. Namun kombinasi dengan CORS permissive (Issue #3) adalah risiko.

---

## 📊 RISK MATRIX

| Issue | Severity | Likelihood | Impact | Priority |
|-------|----------|-----------|--------|----------|
| Fallback Password Client-Side | CRITICAL | HIGH | CRITICAL | 1 |
| Session Secret Hardcoded | HIGH | HIGH | HIGH | 2 |
| CORS Permissive | MEDIUM | HIGH | MEDIUM | 3 |
| innerHTML XSS | MEDIUM | MEDIUM | MEDIUM | 4 |
| Default Password Hash | MEDIUM | LOW | MEDIUM | 5 |
| Input Validation Missing | LOW | MEDIUM | LOW | 6 |

---

## ✅ POSITIVES (Keamanan Yang Sudah Baik)

| Aspek | Status | Catatan |
|-------|--------|---------|
| Password Hashing | ✅ Baik | Menggunakan bcryptjs dengan salt |
| Session Management | ✅ Baik | express-session diimplementasikan |
| API Credentials | ✅ Baik | Cookies dikirim dengan `credentials: 'include'` |
| Admin Pages Protected | ✅ Baik | Admin pages check sessionStorage.isAdmin |
| Database Isolation | ✅ Baik | JSON DB tidak exposed directly |
| Frontend Server | ✅ Baik | Directory traversal checks di serve.js |

---

## 🛠️ RENCANA REMEDIATION (PRIORITY ORDER)

### Phase 1: CRITICAL (Lakukan Segera)
- [ ] Hapus `FALLBACK_PASSWORD` dari [assets/js/auth.js](assets/js/auth.js)
- [ ] Update [tools/*.js](tools/) untuk membaca password dari `process.env`
- [ ] Hapus display password default dari [admin-login.html](admin-login.html)

### Phase 2: HIGH (Minggu Ini)
- [ ] Implementasi `SESSION_SECRET` env variable di [server/index.js](server/index.js)
- [ ] Restrict CORS origin di [server/index.js](server/index.js)
- [ ] Test CORS restrictions dengan curl/postman

### Phase 3: MEDIUM (Sprint Berikutnya)
- [ ] Sanitize innerHTML dalam [script.js](script.js) dengan DOMPurify atau createElement
- [ ] Add schema validation untuk order creation
- [ ] Implement password setup wizard untuk first-time admin

### Phase 4: DOCUMENTATION
- [ ] Update [SETUP_GUIDE.md](SETUP_GUIDE.md) dengan env var requirements
- [ ] Create [SECURITY.md](SECURITY.md) dengan best practices
- [ ] Document password reset procedure

---

## 📝 NEXT STEPS

**1. Immediate Action (Today):**
```bash
# Review and approve patches for Phase 1 issues
# Test fallback password removal
```

**2. Implementation (This Week):**
```bash
# Apply patches for Phase 1 & 2
# Run integration tests
# Deploy to staging
```

**3. Production Deployment:**
```bash
# Set required env variables:
SESSION_SECRET=<random-32-char-string>
FRONTEND_URL=<production-domain>

# Test all authentication flows
# Monitor for session errors
```

---

## 📞 KESIMPULAN

Codebase secara keseluruhan **cukup aman** untuk development, namun **TIDAK RECOMMENDED untuk production** tanpa menerapkan remediasi Phase 1 & 2.

Sebagian besar issue dapat diperbaiki dalam **2-3 jam kerja** dengan patches yang telah diidentifikasi di atas.

---

**Report Generated:** 15 Desember 2025 | **Auditor:** AI Security Review  
**Status:** 🔴 Action Required | **Next Review:** After Phase 1 & 2 Implementation

