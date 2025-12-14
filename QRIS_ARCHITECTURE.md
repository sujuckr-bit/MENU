# QRIS Feature - Code Architecture Overview

## File Structure

```
MENU/
├── script.js                          ⭐ MAIN IMPLEMENTATION
│   ├── generateReceiptNumber()        🧾 Creates unique receipt #
│   ├── generateReceiptHTML()          🧾 Receipt HTML template
│   ├── showReceiptModal()             🎯 Modal display & QR
│   ├── buildEMVQRPayload()           📱 QRIS payload builder
│   ├── crc16ccitt()                  🔢 Checksum calculation
│   └── Order event handlers          👂 Receipt/QR button clicks
│
├── assets/js/
│   └── api-config.js                  ⭐ API HELPER (HARDENED)
│       └── apiCall()                  🔗 Robust API calls
│
├── daftar.html                        ⭐ ADMIN PANEL
│   └── QRIS Settings Form             ⚙️  Merchant config
│
├── pesan.html                         ✅ ORDER PAGE
│   └── Payment method selector        💳 QRIS/Cash choice
│
├── pesanan-saya.html                  ✅ MY ORDERS PAGE
│   └── Receipt/QR buttons             🧾 View struk & QR
│
├── server/
│   ├── index.js                       ✅ API ENDPOINTS
│   │   ├── GET /api/settings         📥 Get QRIS settings
│   │   ├── POST /api/settings        📤 Save QRIS settings
│   │   └── ... (other routes)
│   │
│   ├── db.js                          ✅ DATABASE HELPERS
│   │   ├── getSettings()             🔍 Read settings
│   │   ├── setSetting()              💾 Save settings
│   │   └── ... (other helpers)
│   │
│   └── data/
│       └── database.json              💾 PERSISTENT STORAGE
│           ├── settings              ⚙️  QRIS merchant info
│           ├── orders                📦 Order data
│           └── menus                 🍽️  Menu items
```

---

## Data Flow Diagram

### Creating Order with QRIS

```
Customer (pesan.html)
    ↓ [Order Form]
    ↓ Select "QRIS" payment method
    ↓ Submit order
    ↓
Server (POST /api/orders)
    ↓ Save order to database.json
    ↓ { id, items, total, paymentMethod: "qris", ... }
    ↓
Database (orders.json)
    ↓ Store permanently
```

### Viewing Receipt & QR

```
Customer (pesanan-saya.html)
    ↓ [Click "🧾 Lihat Struk"]
    ↓
script.js (showReceiptModal)
    ↓ Load settings from window.serverSettings
    ↓
   ├─ generateReceiptHTML() → Receipt template
   │
   ├─ buildEMVQRPayload() → QRIS payload (TLV)
   │   ├─ Merchant NMID from settings
   │   ├─ Merchant Name from settings
   │   ├─ Transaction Amount from order
   │   └─ CRC16-CCITT checksum
   │
   └─ Generate QR URL (qrserver.com)
       ↓
    Modal Display
       ├─ Receipt HTML (items, total)
       ├─ QR Image (if QRIS)
       ├─ "🖨️ Cetak" button (print)
       └─ "Tutup" button (close)
       ↓
   Customer scans QR to pay
```

### Admin Configures QRIS

```
Admin (daftar.html)
    ↓ [Edit QRIS Settings Form]
    ├─ QRIS_MERCHANT_NMID input
    ├─ MERCHANT_NAME input
    ├─ MERCHANT_CITY input
    ↓ [Click "Simpan Pengaturan"]
    ↓
script.js (apiCall POST)
    ↓
Server (POST /api/settings)
    ↓
Database (settings in database.json)
    ↓ Persistent storage
    ↓
All new QR codes use updated settings
```

---

## Function Call Chain

### Receipt Modal Trigger
```javascript
// User clicks receipt button
receiptBtn.addEventListener('click', () => {
    showReceiptModal(order)  ← Main function
})

// Inside showReceiptModal(order):
const receiptNumber = generateReceiptNumber()     ← Get/create receipt #
const receiptHTML = generateReceiptHTML(...)       ← Create HTML
const payload = buildEMVQRPayload(...)             ← Build QRIS payload
const qrUrl = getQRImageURL(payload)               ← QR image URL
const crc = crc16ccitt(crcPayload)                 ← Checksum validation
```

---

## QRIS Payload Structure (EMVCo TLV)

```
Input Order:
  {
    id: "1704067800000",
    buyerName: "Budi",
    items: [{ name: "Kopi", qty: 2, subtotal: 50000 }],
    total: 50000,
    paymentMethod: "qris"
  }

buildEMVQRPayload() processes:
  ├─ Merchant Classification Code (29): "5411"
  ├─ Terminal ID (28): from QRIS_MERCHANT_NMID
  ├─ Amount (54): from order.total (50000)
  ├─ Currency (53): "360" (IDR)
  ├─ Country (58): "ID"
  ├─ Transaction Reference: receipt number
  └─ CRC (63): crc16ccitt(payload)

Output Payload:
  "00020126360014a000000677010112260008MERCHANTS002011500320085401540510305406500007070703A0EC58400114RCP-2024010162090111708..."
  ↓
  Encoded as QR Code
  ↓
  https://api.qrserver.com/v1/create-qr-code/?...data=<PAYLOAD>
  ↓
  QR Image for scanning
```

---

## API Communication

### Settings Endpoint

```javascript
// GET /api/settings
Response:
{
  "QRIS_MERCHANT_NMID": "00000000000000000000",
  "MERCHANT_NAME": "BAZAR HmI",
  "MERCHANT_CITY": "Surabaya",
  ...other settings...
}

// POST /api/settings
Request Body:
{
  "QRIS_MERCHANT_NMID": "12345678901234567890",
  "MERCHANT_NAME": "New Name",
  "MERCHANT_CITY": "Jakarta"
}

Response:
{
  "ok": true,
  "settings": { ...updated... }
}
```

### Order Endpoint

```javascript
// POST /api/orders (creating order)
Request Body:
{
  "buyerName": "Budi",
  "tableNumber": "5",
  "items": [
    { name: "Kopi Pandan", category: "Minum", qty: 2, price: 28000, subtotal: 56000 }
  ],
  "subtotal": 56000,
  "tax": 5600,
  "total": 61600,
  "paymentMethod": "qris"  ← IMPORTANT for QRIS flow
}

Response:
{
  "ok": true,
  "orderId": "1704067800000"
}
```

---

## Client-Side Variables

```javascript
// Global namespace
window.serverSettings = {
  QRIS_MERCHANT_NMID: "00000000000000000000",
  MERCHANT_NAME: "BAZAR HmI",
  MERCHANT_CITY: "Surabaya"
}

window.showReceiptModal = function(order) { ... }

// Session/Local storage
localStorage.getItem('lastReceipt')     // cached receipt data
localStorage.getItem('userPreferences') // user settings

// Page-specific
order = {
  id: "...",
  buyerName: "...",
  tableNumber: "...",
  items: [...],
  total: 50000,
  paymentMethod: "qris",
  receiptNumber: "RCP-20240101-001"
}
```

---

## Error Handling Flow

```javascript
try {
  // Build QRIS payload
  const payload = buildEMVQRPayload(order, receiptNumber)
  
  // Generate QR URL
  const qrUrl = getQRImageURL(payload)
  
  // Create modal
  modal.innerHTML = `...receipt HTML...QR image...`
  
} catch (error) {
  // Log error
  console.error('Error showing receipt:', error)
  
  // Show user-friendly message
  showToast('❌ Gagal menampilkan struk', 'error')
  
  // Still show receipt without QR if QRIS fails
  showReceiptWithoutQR(order)
}
```

---

## Session Flow for Admin Settings

```
1. Admin Login
   ↓ Session established
   ↓
2. Admin navigates to daftar.html
   ↓ Page loads
   ↓
3. JavaScript loads: GET /api/settings
   ↓ Response: { QRIS_MERCHANT_NMID, MERCHANT_NAME, ... }
   ↓
4. Form populated with current values
   ↓ Admin can see/edit settings
   ↓
5. Admin clicks "Simpan Pengaturan QRIS"
   ↓ POST /api/settings with new values
   ↓
6. Server validates & saves to database.json
   ↓ Response: { ok: true, settings: { ... } }
   ↓
7. Client shows toast: "✅ Pengaturan QRIS berhasil disimpan"
   ↓ Updates window.serverSettings
   ↓
8. All future QR codes use new settings
```

---

## Browser Console Output (Expected)

```javascript
// On page load:
[SCRIPT] Script.js loaded - Page detection: { ... }

// When viewing receipt with QRIS:
[QRIS] Payload: "00020126360014a000000677..."
[QRIS] QR Image URL: "https://api.qrserver.com/v1/create-qr-code/?..."

// On admin settings save:
[QRIS Settings] Request sent: {...}
✅ Pengaturan QRIS berhasil disimpan

// On errors:
❌ Error showing receipt: [error details]
```

---

## Print Output Example

```
┌────────────────────────────────┐
│      BAZAR HmI                │
│  Restoran Terpercaya         │
├────────────────────────────────┤
│ Struk #: RCP-20240101-001     │
│ Tanggal: 01/01/2024 15:30    │
│ Meja: 5                        │
├────────────────────────────────┤
│ DETAIL PESANAN:               │
│─────────────────────────────────│
│ Kopi Pandan (2) x 28.000  56.000│
│                           ......│
│                                │
│ SUBTOTAL           56.000      │
│ PPN (10%)           5.600      │
│ TOTAL              61.600      │
├────────────────────────────────┤
│ Pembayaran: QRIS (📱)         │
│                                │
│  [QR CODE IMAGE]              │
│  Scan untuk pembayaran QRIS    │
├────────────────────────────────┤
│ Terima kasih telah berbelanja  │
│ Please come again!             │
└────────────────────────────────┘
```

---

## Summary

✅ **Receipt Generation**: Dynamic HTML template
✅ **QRIS Payload**: EMVCo TLV format with CRC16
✅ **QR Code**: Generated from payload via qrserver.com
✅ **Modal Display**: Interactive modal with print support
✅ **Admin Settings**: QRIS merchant configuration
✅ **API Communication**: Secure settings storage
✅ **Error Handling**: Try-catch blocks throughout
✅ **Client Hardening**: Safe JSON parsing, DOM construction
✅ **Syntax**: Clean, validated code

**All components working together seamlessly!**
