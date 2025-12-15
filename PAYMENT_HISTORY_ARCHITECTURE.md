# 📊 Payment History System - Architecture & Workflow Diagram

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      BROWSER CLIENT                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │  daftar.html     │         │payment-history   │             │
│  │  (Order List)    │         │ (Payment Report) │             │
│  └──────────────────┘         └──────────────────┘             │
│         │                             ▲                         │
│         │ Admin clicks                │ WebSocket               │
│         │ "Selesai"                   │ Listener               │
│         ▼                             │                         │
│  ┌──────────────────┐                 │                         │
│  │ script.js        │                 │                         │
│  │completeOrder()   │                 │                         │
│  └──────────────────┘                 │                         │
│         │                             │                         │
│         │ fetch()                     │                         │
│         ▼                             │                         │
│         [Session Auth]                │                         │
│         [localStorage]                │                         │
│         ↓                             │                         │
└──────────────────────────────────────────────────────────────────┘
         │                             │
         │ HTTP POST                   │
         │ /api/orders/:id/complete    │ WebSocket
         │                             │ Events
         ▼                             │
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND SERVER (Node.js)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────┐                 │
│  │  Express Server (server/index.js)        │                 │
│  │  Port: 3001                              │                 │
│  └──────────────────────────────────────────┘                 │
│         │                                                      │
│         ├─ GET /api/orders                                    │
│         │  └─ Query orders from database                      │
│         │     └─ Return all orders                            │
│         │                                                      │
│         ├─ POST /api/orders/:id/complete                      │
│         │  ├─ Find order by ID                                │
│         │  ├─ Update: completed=true                          │
│         │  ├─ Update: paymentStatus='completed'               │
│         │  ├─ Update: paidAt = now()                          │
│         │  ├─ Save to database                                │
│         │  └─ Broadcast WebSocket event                       │
│         │                                                      │
│         └─ WebSocket Broadcasting                             │
│            └─ Send to all connected clients                   │
│               ├─ Event: "order_updated"                       │
│               └─ Event: "payment_updated"                     │
│                                                                 │
│  ┌──────────────────────────────────────────┐                 │
│  │  Database (server/data/database.json)    │                 │
│  │  ├─ orders.json (all orders)             │                 │
│  │  ├─ menus.json (menu items)              │                 │
│  │  └─ auth (user credentials)              │                 │
│  └──────────────────────────────────────────┘                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         ▲
         │ WebSocket
         │ Response
         └──────────────────────────────────────────────────────→
```

---

## 🔄 Complete Order Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP-BY-STEP: Complete Order → View in Payment History             │
└─────────────────────────────────────────────────────────────────────┘

STEP 1: DAFTAR.HTML - Admin View Orders
        ┌─────────────────────┐
        │ Order List:         │
        │ • Amir Jaya - Rp 60K│ ◄─ Admin scrolls through orders
        │ • Budi - Rp 45K     │
        │ • Citra - Rp 80K    │
        └─────────────────────┘
        ▼

STEP 2: DAFTAR.HTML - Click "Selesai" Button
        ┌─────────────────────┐
        │ [✓ Selesai] ◄─────┐ Admin clicks
        │ [✏ Edit]          │
        │ [🗑️ Hapus]         │
        └─────────────────────┘
        ▼

STEP 3: CONFIRMATION DIALOG
        ╔═════════════════════════════╗
        ║ Tandai pesanan sebagai      ║
        ║ selesai?                    ║
        ╠═════════════════════════════╣
        ║ [✓ Ya]  [✗ Tidak]          ║
        ╚═════════════════════════════╝
        ▼ (Admin clicks "Ya")

STEP 4: SCRIPT.JS - completeOrder()
        ┌────────────────────────────────┐
        │ 1. Get orders from storage     │
        │ 2. Find order by ID            │
        │ 3. Set: completed = true       │
        │ 4. Save to localStorage        │
        │ 5. Call API /api/orders/:id/   │
        │    complete                    │
        │ 6. Save lastBuyerName          │
        │ 7. Show toast: "Selesai!"      │
        │ 8. Redirect to payment-history │
        └────────────────────────────────┘
        ▼

STEP 5: NETWORK - HTTP Request
        ┌────────────────────────────────┐
        │ POST /api/orders/123/complete  │
        │                                │
        │ Headers:                       │
        │ - Content-Type: application/   │
        │   json                         │
        │ - Credentials: include         │
        │                                │
        │ Body: {}                       │
        └────────────────────────────────┘
        ▼

STEP 6: SERVER - Update Order
        ┌────────────────────────────────┐
        │ app.post('/api/orders/:id/     │
        │ complete', async (req, res)    │
        │ {                              │
        │   • Get orders array            │
        │   • Find order: order.id ==id  │
        │   • Set completed = true        │
        │   • Set paymentStatus =        │
        │     'completed'                │
        │   • Set paidAt = now()         │
        │   • Save to database           │
        │   • broadcastUpdate()          │
        │ }                              │
        └────────────────────────────────┘
        ▼

STEP 7: DATABASE - Order Updated
        ┌────────────────────────────────┐
        │ Order:                         │
        │ {                              │
        │   id: "123",                   │
        │   buyerName: "Amir Jaya",      │
        │   completed: true ✓ UPDATED    │
        │   paymentStatus: "completed"   │
        │   paidAt: "2025-12-15T10:35Z"  │
        │ }                              │
        └────────────────────────────────┘
        ▼

STEP 8: BROADCAST - WebSocket Event
        ┌────────────────────────────────┐
        │ Send to ALL connected clients: │
        │                                │
        │ {                              │
        │   type: "order_updated",       │
        │   data: {...order}             │
        │ }                              │
        │                                │
        │ {                              │
        │   type: "payment_updated",     │
        │   data: {                      │
        │     orderId: "123",            │
        │     status: "completed",       │
        │     paidAt: "..."              │
        │   }                            │
        │ }                              │
        └────────────────────────────────┘
        ▼

STEP 9: PAYMENT-HISTORY.HTML - Listen
        ┌────────────────────────────────┐
        │ WebSocket.onmessage:           │
        │ if(msg.type ==='payment_      │
        │    updated') {                 │
        │   loadAllCompletedOrders()     │
        │ }                              │
        └────────────────────────────────┘
        ▼

STEP 10: PAYMENT-HISTORY - Reload Data
         ┌────────────────────────────────┐
         │ fetch('/api/orders')           │
         │ ├─ Get all orders              │
         │ ├─ Filter: completed == true   │
         │ ├─ Sort by paidAt (newest)     │
         │ └─ Return array                │
         └────────────────────────────────┘
         ▼

STEP 11: PAYMENT-HISTORY - Render UI
         ┌────────────────────────────────┐
         │ renderPaymentHistory():        │
         │ ├─ Loop through filtered      │
         │ ├─ Create card HTML            │
         │ ├─ Insert to DOM               │
         │ └─ Show: Amir Jaya - Rp 60K   │
         │   Meja: 5                      │
         │   Metode: Tunai                │
         │   Status: ✓ Selesai            │
         │                                │
         │ updateStats():                 │
         │ ├─ Total Transaksi: 1          │
         │ ├─ Total Bayar: Rp 60.000      │
         │ ├─ QRIS: Rp 0                  │
         │ └─ Tunai: Rp 60.000            │
         └────────────────────────────────┘
         ▼

STEP 12: PAYMENT-HISTORY - Display Result
         ╔═════════════════════════════╗
         ║ RIWAYAT PEMBAYARAN          ║
         ╠═════════════════════════════╣
         ║ Total Transaksi: 1          ║
         ║ Total Bayar: Rp 60.000      ║
         ║ ───────────────────────────  ║
         ║ Amir Jaya    │ Meja 5       ║
         ║ Rp 60.000    │ Tunai        ║
         ║ ✓ Selesai    │ 15-Des 10:35║
         ╚═════════════════════════════╝
         ▼

✅ SUCCESS: Order marked complete & shown in payment history!
```

---

## 🔌 WebSocket Communication

```
┌─────────────────────────────────────────────────────┐
│        WebSocket Real-time Connection               │
└─────────────────────────────────────────────────────┘

CLIENT SIDE (Browser):
  const ws = new WebSocket(wsUrl);
  
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    
    if(msg.type === 'order_updated') {
      console.log('Order updated!', msg.data);
      loadAllCompletedOrders();
    }
    
    if(msg.type === 'payment_updated') {
      console.log('Payment confirmed!', msg.data);
      loadAllCompletedOrders();
    }
  }

SERVER SIDE (Node.js):
  function broadcastUpdate(type, data) {
    const message = JSON.stringify({ type, data });
    wss.forEach(client => {
      if(client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

FLOW:
Admin Tab (daftar.html)        Browser Network        Payment History Tab
                                                      (payment-history.html)
                                                      
Click "Selesai" ─────────────────────────────────→
                 (WebSocket broadcast from server)
                 {type: "payment_updated", ...} ←── Receive
                                                     trigger reload
                                                     ↓
                                                   fetch /api/orders
                                                     ↓
                                                   render table
                                                     ↓
                                                   update stats
                                                     ↓
                                                   display result
```

---

## 🎯 Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    DATA TRANSFORMATION                        │
└──────────────────────────────────────────────────────────────┘

1. RAW DATA (from /api/orders)
   [
     {id: "1", buyerName: "Amir", total: 60000, completed: true},
     {id: "2", buyerName: "Budi", total: 45000, completed: false},
     {id: "3", buyerName: "Amir", total: 80000, completed: true}
   ]
   
   ▼ Filter: completed === true
   
2. FILTERED DATA
   [
     {id: "1", buyerName: "Amir", total: 60000, completed: true},
     {id: "3", buyerName: "Amir", total: 80000, completed: true}
   ]
   
   ▼ Apply Search: buyerName contains "Amir"
   
3. SEARCH RESULT
   [
     {id: "1", buyerName: "Amir", total: 60000, completed: true},
     {id: "3", buyerName: "Amir", total: 80000, completed: true}
   ]
   
   ▼ Calculate Stats
   
4. STATISTICS
   {
     totalTransactions: 2,
     totalAmount: 140000,
     qrisAmount: 0,
     tunaiAmount: 140000
   }
   
   ▼ Render HTML
   
5. UI DISPLAY
   ┌──────────────────────────┐
   │ Total: 2 | Bayar: 140K   │
   ├──────────────────────────┤
   │ Amir - Rp 60K            │
   │ Amir - Rp 80K            │
   └──────────────────────────┘
   
   ▼ Export to Excel
   
6. EXCEL FILE
   ┌──────────────────────────┐
   │ No | Nama | Total | ...  │
   ├──────────────────────────┤
   │ 1  │ Amir │ 60000 │      │
   │ 2  │ Amir │ 80000 │      │
   │ 3  │ TOTAL│140000│      │
   └──────────────────────────┘
```

---

## 🔐 Authentication Flow

```
┌─────────────────────────────────────────────────┐
│  LOGIN & SESSION CHECK                          │
└─────────────────────────────────────────────────┘

STEP 1: Admin navigates to payment-history.html
        ▼
STEP 2: JavaScript checks admin status
        fetch('/api/me', { credentials: 'include' })
        ▼
STEP 3: Server checks session cookie
        GET /api/me
        ├─ If session.isAdmin = true
        │  └─ Return: { isAdmin: true, username: 'admin' }
        │
        └─ If session.isAdmin = false/null
           └─ Return: { isAdmin: false, username: null }
        ▼
STEP 4: Frontend checks response
        if(!me.isAdmin) {
          redirect('daftar.html')
        }
        ▼
STEP 5: If admin, load data with credentials
        fetch('/api/orders', { 
          credentials: 'include'  ← Include session cookie
        })
        ▼
STEP 6: Server verifies session again
        if(!req.session.isAdmin) {
          return 403 Forbidden
        }
        ▼
STEP 7: Return data if authorized
        response.json(orders)
```

---

## 📱 Responsive Breakpoints

```
┌─────────────────────────────────────────────┐
│ DESKTOP (≥1200px)                           │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ SIDEBAR   │ MAIN CONTENT                │ │
│ │ ─────────────────────────────────────── │ │
│ │ • Edit    │ Stats: [1] [2] [3] [4] [5] │ │
│ │ • Daftar  │ Filter: [Name] [Method]    │ │
│ │ • History │ Table: [Transaction...]    │ │
│ │ • Logout  │                             │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ TABLET (768px - 1199px)                     │
├─────────────────────────────────────────────┤
│ [☰ Menu]  MAIN CONTENT                      │
│ ────────────────────────────────────────    │
│ Stats: [1][2] │ [3][4]                     │
│ Filter:                                     │
│ [Name____]  [Method: _]                    │
│ Table: [Transaction] [Transaction]         │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ MOBILE (<768px)                             │
├─────────────────────────────────────────────┤
│ [☰]  Riwayat Pembayaran              [👤]  │
│ ────────────────────────────────────────    │
│ Stats:                                      │
│ [Total: 1]                                 │
│ [Bayar: 60K]                               │
│ [QRIS: 0]                                  │
│ [Tunai: 60K]                               │
│                                             │
│ Filter:                                     │
│ [Nama_____]                                │
│ [Metode: __]                               │
│ [Filter] [Reset] [Export]                  │
│                                             │
│ Transactions:                               │
│ ┌─────────────────────────────────────┐   │
│ │ Amir Jaya                           │   │
│ │ Rp 60.000 | ✓ Selesai               │   │
│ │ Tunai | Meja 5                      │   │
│ └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## ⚡ Performance Timeline

```
┌─────────────────────────────────────────────────┐
│          Page Load Performance                  │
└─────────────────────────────────────────────────┘

T=0ms      ✓ HTML parsed
T=100ms    ✓ CSS loaded
T=200ms    ✓ Bootstrap CSS ready
T=300ms    ✓ JavaScript loaded
T=400ms    ✓ DOM content loaded
T=500ms    ✓ DOMContentLoaded fired
T=550ms    ✓ checkAdminStatus() called
T=650ms    ✓ API /api/me responded
T=700ms    ✓ Admin verified
T=750ms    ✓ loadAllCompletedOrders() started
T=850ms    ✓ fetch('/api/orders') completed
T=950ms    ✓ Data filtered
T=1000ms   ✓ renderPaymentHistory() completed
T=1050ms   ✓ updateStats() completed
T=1100ms   ✓ WebSocket connected
T=1150ms   ✓ Page fully ready

Total Load Time: ~1.15 seconds

With 100 orders:
- Fetch: 150-300ms
- Filter: 50-100ms
- Render: 100-200ms
- Total: ~800-1000ms
```

---

## 🔄 Filter Logic Flowchart

```
┌──────────────────────────────────┐
│   applyFilters()                 │
└──────────────────────────────────┘
           ▼
Get filter values:
  nameFilter = "Amir"
  methodFilter = "tunai"
  statusFilter = ""
           ▼
Loop through allOrders:
  ┌─────────────────────────────────┐
  │ For each order:                 │
  ├─────────────────────────────────┤
  │ IF nameFilter exists:           │
  │   If order.buyerName does NOT   │
  │   contain nameFilter:           │
  │   → Skip (return false)         │
  │                                 │
  │ IF methodFilter exists:         │
  │   If order.paymentMethod        │
  │   !== methodFilter:             │
  │   → Skip (return false)         │
  │                                 │
  │ IF statusFilter exists          │
  │ & !== 'completed':              │
  │   If order.paymentStatus        │
  │   !== statusFilter:             │
  │   → Skip (return false)         │
  │                                 │
  │ All checks passed:              │
  │ → Include in results (true)     │
  └─────────────────────────────────┘
           ▼
Set filteredOrders = results
           ▼
renderPaymentHistory(filteredOrders)
           ▼
updateStats(filteredOrders)
           ▼
Display filtered results
```

---

## 📊 Statistics Calculation

```
┌──────────────────────────────────┐
│   updateStats(orders)            │
└──────────────────────────────────┘
           ▼

totalTransactions = orders.length
Example: 3 orders → totalTransactions = 3

           ▼

totalAmount = orders.reduce(
  (sum, o) => sum + (o.total || 0), 0
)
Example: 60K + 45K + 80K = 185K

           ▼

qrisTransactions = orders.filter(
  o => o.paymentMethod === 'qris'
).length
Example: 2 QRIS → count = 2

           ▼

tunaiTransactions = orders.filter(
  o => o.paymentMethod !== 'qris'
).length
Example: 1 Tunai → count = 1

           ▼

qrisAmount = orders
  .filter(o => o.paymentMethod === 'qris')
  .reduce((sum, o) => sum + (o.total || 0), 0)
Example: 60K + 80K = 140K

           ▼

tunaiAmount = orders
  .filter(o => o.paymentMethod !== 'qris')
  .reduce((sum, o) => sum + (o.total || 0), 0)
Example: 45K

           ▼

Display:
  Total Transaksi: 3
  Total Bayar: Rp 185.000
  QRIS: Rp 140.000 (2 transaksi)
  Tunai: Rp 45.000 (1 transaksi)
```

---

## 🎯 State Management

```
┌────────────────────────────────────────┐
│  Global State Variables                │
└────────────────────────────────────────┘

allOrders = []
├─ Filled by: loadAllCompletedOrders()
├─ Filter: completed === true
├─ Sort: by paidAt (newest first)
└─ Used by: applyFilters()

filteredOrders = []
├─ Filled by: applyFilters()
├─ Filter: based on user input
└─ Used by: renderPaymentHistory()

API_URL = 'http://localhost:3001'
├─ Source: API_BASE_URL or detect
└─ Used by: all fetch() calls

Listeners:
├─ filterBtn → applyFilters()
├─ resetBtn → reset & load all
├─ exportBtn → exportToExcel()
├─ WebSocket → loadAllCompletedOrders()
└─ Input fields → debounce applyFilters()
```

---

**Diagram Version:** 1.0  
**Last Updated:** 15 Desember 2025  
**For:** Payment History Feature Documentation
