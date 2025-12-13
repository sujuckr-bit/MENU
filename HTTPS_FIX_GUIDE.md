# HTTPS/Mixed Content - Configuration Guide

## 🔴 Problem
Mixed Content error ketika frontend HTTPS mencoba akses backend HTTP:
```
Failed to fetch 'http://www.menuhmi.online:3000/api/menus'
The page was loaded over HTTPS, but requested insecure resource
```

## ✅ Solution

### Untuk Development (Localhost)
Backend otomatis akan ke `http://localhost:3000` - tidak ada masalah.

### Untuk Production (HTTPS Domain)
Ada 2 opsi:

#### **Option 1: Gunakan Reverse Proxy (RECOMMENDED)**
Setup Nginx atau Apache untuk proxy HTTPS → backend HTTP internal.

**Nginx Config:**
```nginx
location /api/ {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

Hasilnya:
- Request: `https://www.menuhmi.online/api/menus`
- Proxy ke: `http://localhost:3000/api/menus`
- ✅ HTTPS → HTTPS (tidak ada mixed content)

#### **Option 2: Add SSL Certificate ke Backend Port 3000**
Jika tidak bisa pakai reverse proxy, tambah SSL langsung ke port 3000.

Lihat [server/README.md](server/README.md) untuk setup.

---

## 🔧 Code Configuration

### api-config.js & auth.js
Sudah auto-detect protokol:
```javascript
// Jika akses via HTTPS → gunakan HTTPS:3000
// Jika akses via HTTP → gunakan HTTP:3000
// Jika localhost → gunakan localhost:3000
```

### Tidak perlu perubahan - sudah support semua case! ✅

---

## 📋 Testing

**Desktop (Localhost):**
```
https://localhost:8080 → http://localhost:3000 ✅
```

**Mobile (IP):**
```
http://192.168.x.x:8080 → http://192.168.x.x:3000 ✅
```

**Production (Domain):**
```
https://www.menuhmi.online → https://www.menuhmi.online:3000 ✅
(atau via reverse proxy: https://www.menuhmi.online/api)
```

