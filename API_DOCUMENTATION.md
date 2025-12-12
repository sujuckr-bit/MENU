# BAZAR HmI - API Documentation

## Base URL
```
http://localhost:3000
```

---

## 🔐 Authentication Endpoints

### POST /api/login
Login sebagai admin dengan password.

**Request:**
```json
{
  "password": "admin123"
}
```

**Response (Success):**
```json
{
  "ok": true
}
```
Cookies session akan disimpan otomatis.

**Response (Error):**
```json
{
  "error": "Unauthorized"
}
```
Status: 401

---

### POST /api/logout
Logout admin.

**Response:**
```json
{
  "ok": true
}
```

---

### POST /api/change-password
Ubah password admin. Memerlukan authentication.

**Request:**
```json
{
  "newPassword": "password_baru123"
}
```

**Response (Success):**
```json
{
  "ok": true
}
```

**Response (Error - not authenticated):**
```json
{
  "error": "forbidden"
}
```
Status: 403

---

## 🍽️ Menu Endpoints

### GET /api/menus
Ambil semua menu.

**Response:**
```json
{
  "Minum": [
    {
      "name": "Kopi Pandan (Hot/Ice)",
      "price": 28000
    }
  ],
  "Makan": [
    {
      "name": "Nasi Goreng Merah",
      "price": 27000
    }
  ]
}
```

---

### POST /api/menus
Update semua menu. Memerlukan authentication sebagai admin.

**Request:**
```json
{
  "Minum": [
    {
      "name": "Kopi Pandan (Hot/Ice)",
      "price": 28000
    }
  ],
  "Makan": [
    {
      "name": "Nasi Goreng Merah",
      "price": 27000
    }
  ]
}
```

**Response:**
```json
{
  "ok": true
}
```

**Response (Error):**
```json
{
  "error": "forbidden"
}
```
Status: 403

---

## 📋 Order Endpoints

### GET /api/orders
Ambil semua orders. Memerlukan authentication sebagai admin.

**Response:**
```json
[
  {
    "id": 1,
    "buyerName": "John Doe",
    "tableNumber": "5",
    "items": [
      {
        "category": "Minum",
        "itemName": "Kopi Pandan",
        "price": 28000,
        "quantity": 2,
        "subtotal": 56000
      }
    ],
    "total": 56000,
    "createdAt": 1702464000000,
    "completed": false
  }
]
```

**Response (Error - not authenticated):**
```json
{
  "error": "forbidden"
}
```
Status: 403

---

### POST /api/orders
Buat order baru. Tidak memerlukan authentication.

**Request:**
```json
{
  "buyerName": "John Doe",
  "tableNumber": "5",
  "items": [
    {
      "category": "Minum",
      "itemName": "Kopi Pandan",
      "price": 28000,
      "quantity": 2,
      "subtotal": 56000
    }
  ],
  "total": 56000
}
```

**Response:**
```json
{
  "ok": true,
  "id": 1702464000000
}
```

---

## 🧪 Testing with cURL

### Test Root
```bash
curl http://localhost:3000/
```

### Test Get Menus
```bash
curl http://localhost:3000/api/menus
```

### Test Login
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"password":"admin123"}'
```

### Test Create Order
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "buyerName": "John",
    "tableNumber": "1",
    "items": [],
    "total": 0
  }'
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request berhasil |
| 400 | Bad Request - Data tidak valid |
| 401 | Unauthorized - Password salah |
| 403 | Forbidden - Tidak memiliki akses admin |
| 404 | Not Found - Endpoint tidak ada |
| 500 | Server Error |

---

## Session Management

- Session disimpan di server memory (development)
- Untuk production, gunakan database session (Redis/MongoDB)
- Cookies dikirim otomatis dengan `credentials: include`
- Session timeout: Bergantung pada konfigurasi Express

---

## Security Notes

- ✅ Password di-hash dengan bcrypt (10 rounds)
- ✅ Session berbasis server (aman dari token manipulation)
- ✅ CORS enabled untuk localhost
- ⚠️ TODO: Rate limiting
- ⚠️ TODO: Input validation lebih ketat
- ⚠️ TODO: HTTPS untuk production

---

**Last Updated:** Dec 13, 2025
**Version:** 1.0.0
