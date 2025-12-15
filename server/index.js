require('dotenv').config(); // Load environment variables

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const db = require('./db');
const fileCache = require('./fileCache');

// WebSocket clients
const wss = new Set();

async function main() {
  db.init();
  // Ensure default admin exists
  const currentAdmin = db.getUser('admin');
  if (!currentAdmin) {
    const defaultHash = await bcrypt.hash('admin123', 10);
    db.setUserPassword('admin', defaultHash);
    console.log('Created default admin in database');
  }
  const app = express();
  // Configure CORS with explicit whitelist (allow frontend and localhost)
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8000';
  const allowedOrigins = [frontendUrl, 'http://127.0.0.1:8000', 'http://localhost:8000'];
  app.use(bodyParser.json());
  app.use(cors({
    origin: (origin, callback) => {
      // Allow non-browser or same-origin requests with no origin (e.g. curl, server-side)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
      return callback(new Error('CORS policy: Origin not allowed'));
    },
    credentials: true
  }));

  // Session secret must be provided via env var in production
  const sessionSecret = process.env.SESSION_SECRET || 'dev-secret-change-this-in-production';
  if (process.env.NODE_ENV === 'production' && sessionSecret === 'dev-secret-change-this-in-production') {
    console.warn('[SECURITY] Using default session secret in production. Set SESSION_SECRET env var.');
  }
  app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
  }));

  // Simple health and metrics middleware (Phase 5)
  const __metrics = {
    requests: 0,
    responses: 0,
    errors: 0,
    totalResponseTimeMs: 0,
    lastRequests: []
  };

  app.use((req, res, next) => {
    const start = Date.now();
    __metrics.requests++;
    res.on('finish', () => {
      const duration = Date.now() - start;
      __metrics.responses++;
      __metrics.totalResponseTimeMs += duration;
      if (res.statusCode >= 500) __metrics.errors++;
      __metrics.lastRequests.push({
        path: req.path,
        method: req.method,
        status: res.statusCode,
        duration,
        time: new Date().toISOString()
      });
      if (__metrics.lastRequests.length > 200) __metrics.lastRequests.shift();
    });
    next();
  });

  // Lightweight health endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() });
  });

  // Lightweight metrics endpoint (JSON) — for simple scraping/inspection
  app.get('/metrics', (req, res) => {
    const avg = __metrics.responses ? (__metrics.totalResponseTimeMs / __metrics.responses) : 0;
    res.json({
      requests: __metrics.requests,
      responses: __metrics.responses,
      errors: __metrics.errors,
      avgResponseMs: Math.round(avg),
      recent: __metrics.lastRequests.slice(-20)
    });
  });

  // Serve static files from parent directory
  // Intercept asset requests and serve from RAM cache for faster repeated access
  app.get('/assets/*', async (req, res, next) => {
    try {
      const rel = req.path.replace(/^\//, ''); // remove leading '/'
      const fsPath = path.join(__dirname, '..', rel);
      const entry = await fileCache.get(fsPath);

      // Handle conditional requests (client cache) to aggressively reduce bandwidth
      const ifNoneMatch = req.headers['if-none-match'];
      const ifModifiedSince = req.headers['if-modified-since'];
      if (ifNoneMatch && entry.etag && ifNoneMatch === entry.etag) {
        res.status(304).end();
        return;
      }
      if (ifModifiedSince) {
        const since = Date.parse(ifModifiedSince);
        if (!Number.isNaN(since) && entry.mtimeMs <= since) {
          res.status(304).end();
          return;
        }
      }

      res.setHeader('Content-Type', entry.type);
      res.setHeader('Content-Length', entry.size);
      if (entry.etag) res.setHeader('ETag', entry.etag);
      if (entry.lastModified) res.setHeader('Last-Modified', entry.lastModified);
      
      // For hashed/versioned assets (*.min.js, *.min.css, or hash-named files), use immutable
      if (fileCache._isHashedAsset(fsPath)) {
        res.setHeader('Cache-Control', 'public, immutable, max-age=31536000');
      } else {
        // For non-hashed assets, use aggressive revalidation window
        res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
      }
      return res.send(entry.buffer);
    } catch (e) {
      return next();
    }
  });

  // Fall back to express static for other files
  app.use(express.static(path.join(__dirname, '..')));

  // Root route
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
  });

  // Helper to broadcast updates to all connected WebSocket clients
  function broadcastUpdate(type, data) {
    const message = JSON.stringify({ type, data });
    wss.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Login
  app.post('/api/login', async (req, res) => {
    const { username = 'admin', password } = req.body || {};
    console.log('[LOGIN] Received request for username:', username, 'password exists:', !!password);
    if (!password) return res.status(400).json({ error: 'Missing password' });
    const u = db.getUser(username);
    console.log('[LOGIN] User found:', !!u, 'Has hash:', !!u?.passwordHash);
    if (!u || !u.passwordHash) return res.status(401).json({ error: 'Unauthorized' });
    const ok = await bcrypt.compare(password, u.passwordHash);
    console.log('[LOGIN] Password match:', ok);
    if (!ok) return res.status(401).json({ error: 'Unauthorized' });
    req.session.isAdmin = true;
    req.session.username = username;
    console.log('[LOGIN] Success! Session set.');
    res.json({ ok: true });
  });

  app.post('/api/logout', (req, res) => {
    req.session.destroy(() => res.json({ ok: true }));
  });

  // Menus
  app.get('/api/menus', async (req, res) => {
    const menus = db.getMenus();
    res.json(menus);
  });

  // Settings (readable by clients). Admins can update.
  app.get('/api/settings', async (req, res) => {
    try {
      const settings = db.getSettings();
      res.json(settings || {});
    } catch (e) {
      res.status(500).json({ error: 'failed to read settings' });
    }
  });

  app.post('/api/settings', async (req, res) => {
    if (!req.session.isAdmin) return res.status(403).json({ error: 'forbidden' });
    const updates = req.body || {};
    try {
      Object.keys(updates).forEach(k => db.setSetting(k, updates[k]));
      broadcastUpdate('settings_updated', updates);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: 'failed to update settings' });
    }
  });

  // Validate menu data structure
  function validateMenus(data) {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Menu data must be an object' };
    }
    
    // Check if it's an empty object (allowed)
    if (Object.keys(data).length === 0) {
      return { valid: true };
    }
    
    // Validate each category and its items
    for (const [category, items] of Object.entries(data)) {
      // Category name must be non-empty string
      if (typeof category !== 'string' || category.trim() === '') {
        return { valid: false, error: `Invalid category name: "${category}"` };
      }
      
      // Items must be an array
      if (!Array.isArray(items)) {
        return { valid: false, error: `Category "${category}": items must be an array, got ${typeof items}` };
      }
      
      // Validate each item
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        if (!item || typeof item !== 'object') {
          return { valid: false, error: `Category "${category}": item ${i} is not a valid object` };
        }
        
        // Required fields
        if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
          return { valid: false, error: `Category "${category}": item ${i} missing or invalid name` };
        }
        
        if (item.price === undefined || item.price === null) {
          return { valid: false, error: `Category "${category}": item "${item.name}" missing price` };
        }
        
        const price = Number(item.price);
        if (Number.isNaN(price) || price < 0) {
          return { valid: false, error: `Category "${category}": item "${item.name}" has invalid price: ${item.price}` };
        }
        
        // Optional: outOfStock should be boolean if present
        if (item.outOfStock !== undefined && typeof item.outOfStock !== 'boolean') {
          return { valid: false, error: `Category "${category}": item "${item.name}" outOfStock must be boolean` };
        }
      }
    }
    
    return { valid: true };
  }

  // Log function for audit trail
  function logMenuChange(username, action, details) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, username, action, details };
    console.log(`[MENU AUDIT] ${timestamp} | ${username} | ${action} | ${JSON.stringify(details)}`);
  }

  app.post('/api/menus', async (req, res) => {
    if (!req.session.isAdmin) {
      console.warn('[AUTH] Unauthorized menu update attempt');
      return res.status(403).json({ error: 'Unauthorized: admin session required' });
    }
    
    const data = req.body || {};
    const username = req.session.username || 'unknown';
    
    // Validate incoming data
    const validation = validateMenus(data);
    if (!validation.valid) {
      console.warn(`[VALIDATION] Menu update rejected: ${validation.error}`);
      return res.status(400).json({ 
        ok: false, 
        error: validation.error,
        details: 'Please check the menu data format and try again'
      });
    }
    
    try {
      // Get current menus to log changes
      const oldMenus = db.getMenus();
      
      // Save to database
      db.setMenus(data);
      
      // Log the change
      logMenuChange(username, 'MENUS_UPDATE', {
        categoriesCount: Object.keys(data).length,
        itemsCount: Object.values(data).reduce((sum, items) => sum + (Array.isArray(items) ? items.length : 0), 0),
        timestamp: Date.now()
      });
      
      // Broadcast to all connected clients
      broadcastUpdate('menus_updated', data);
      
      res.json({ ok: true, message: 'Menus updated successfully' });
    } catch (e) {
      console.error('[ERROR] Failed to update menus:', e.message);
      res.status(500).json({ 
        ok: false, 
        error: 'Server error while updating menus',
        details: e.message 
      });
    }
  });

  // Menu CRUD - Get menu category
  app.get('/api/menus/:category', async (req, res) => {
    const menus = db.getMenus();
    const category = req.params.category;
    if (!menus[category]) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(menus[category]);
  });

  // Menu CRUD - Add item to category
  app.post('/api/menus/:category/items', async (req, res) => {
    if (!req.session.isAdmin) return res.status(403).json({ error: 'forbidden' });
    const { category } = req.params;
    const { name, price } = req.body || {};
    if (!name || !price) {
      return res.status(400).json({ error: 'Missing name or price' });
    }
    const menus = db.getMenus();
    if (!menus[category]) menus[category] = [];
    menus[category].push({ name, price: Number(price) });
    db.setMenus(menus);
    broadcastUpdate('menus_updated', menus);
    res.json({ ok: true });
  });

  // Menu CRUD - Update item in category
  app.put('/api/menus/:category/items/:itemIndex', async (req, res) => {
    if (!req.session.isAdmin) return res.status(403).json({ error: 'forbidden' });
    const { category, itemIndex } = req.params;
    const { name, price } = req.body || {};
    if (!name || !price) {
      return res.status(400).json({ error: 'Missing name or price' });
    }
    const menus = db.getMenus();
    const idx = parseInt(itemIndex);
    if (!menus[category] || !menus[category][idx]) {
      return res.status(404).json({ error: 'Item not found' });
    }
    menus[category][idx] = { name, price: Number(price) };
    db.setMenus(menus);
    broadcastUpdate('menus_updated', menus);
    res.json({ ok: true });
  });

  // Menu CRUD - Delete item from category
  app.delete('/api/menus/:category/items/:itemIndex', async (req, res) => {
    if (!req.session.isAdmin) return res.status(403).json({ error: 'forbidden' });
    const { category, itemIndex } = req.params;
    const menus = db.getMenus();
    const idx = parseInt(itemIndex);
    if (!menus[category] || !menus[category][idx]) {
      return res.status(404).json({ error: 'Item not found' });
    }
    menus[category].splice(idx, 1);
    db.setMenus(menus);
    broadcastUpdate('menus_updated', menus);
    res.json({ ok: true });
  });

  // Orders
  app.get('/api/orders', async (req, res) => {
    if (!req.session.isAdmin) return res.status(403).json({ error: 'forbidden' });
    const orders = db.getOrders();
    res.json(orders);
  });

  app.post('/api/orders', async (req, res) => {
    const order = req.body || {};
    // Basic server-side validation
    if (typeof order.buyerName !== 'string' || !order.buyerName.trim()) return res.status(400).json({ error: 'Invalid buyerName' });
    if (!order.items || !Array.isArray(order.items) || order.items.length === 0) return res.status(400).json({ error: 'Invalid items' });
    // Validate each item
    for (const it of order.items) {
      if (typeof it.itemName !== 'string' || !it.itemName.trim()) return res.status(400).json({ error: 'Invalid itemName' });
      if (typeof it.price !== 'number' || isNaN(it.price) || it.price < 0) return res.status(400).json({ error: 'Invalid item price' });
      if (typeof it.quantity !== 'number' || isNaN(it.quantity) || it.quantity <= 0) return res.status(400).json({ error: 'Invalid item quantity' });
      if (typeof it.subtotal !== 'number' || isNaN(it.subtotal) || it.subtotal < 0) return res.status(400).json({ error: 'Invalid item subtotal' });
    }
    if (typeof order.total !== 'number' || isNaN(order.total) || order.total < 0) return res.status(400).json({ error: 'Invalid total' });
    if (order.paymentMethod && !['qris', 'tunai', 'cash'].includes(String(order.paymentMethod).toLowerCase())) return res.status(400).json({ error: 'Unsupported payment method. Use: qris or tunai' });

    order.createdAt = Date.now();
    const id = db.addOrder(order);
    broadcastUpdate('order_created', { id, ...order });
    res.json({ ok: true, id });
  });

  // Mark order complete
  app.post('/api/orders/:id/complete', async (req, res) => {
    if (!req.session.isAdmin) return res.status(403).json({ error: 'forbidden' });
    const orders = db.getOrders();
    const order = orders.find(o => o.id == req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    // Mark order completed and also record cash payment locally
    order.completed = true;
    // If payment not already recorded, mark as cash (tunai) completed
    if (!order.paymentStatus || order.paymentStatus !== 'completed') {
      order.paymentStatus = 'completed';
      order.paymentMethod = order.paymentMethod || 'tunai';
      order.paidAt = new Date().toISOString();
    }

    await db.saveOrders(orders);
    broadcastUpdate('order_updated', order);
    // Also emit a payment update event for realtime clients
    broadcastUpdate('payment_updated', {
      orderId: order.id || order._id,
      status: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      paidAt: order.paidAt
    });

    res.json({ ok: true });
  });

  // Change admin password (admin-only)
  app.post('/api/change-password', async (req, res) => {
    if (!req.session.isAdmin) return res.status(403).json({ error: 'forbidden' });
    const { username = 'admin', newPassword } = req.body || {};
    if (!newPassword) return res.status(400).json({ error: 'missing password' });
    if (typeof newPassword !== 'string' || newPassword.length < 8) return res.status(400).json({ error: 'password must be at least 8 characters' });
    const hash = await bcrypt.hash(newPassword, 10);
    db.setUserPassword(username, hash);
    res.json({ ok: true });
  });

  // Session info
  app.get('/api/me', (req, res) => {
    res.json({ isAdmin: !!req.session.isAdmin, username: req.session.username || null });
  });

  // ======== PAYMENT INTEGRATION ========
  const PaymentGateway = require('./payment-gateway');
  const InvoiceGenerator = require('./invoice-generator');

  const paymentGateway = new PaymentGateway();
  const invoiceGenerator = new InvoiceGenerator();

  // Get available payment methods
  app.get('/api/payment-methods', (req, res) => {
    const methods = paymentGateway.getPaymentMethods();
    res.json({ success: true, methods });
  });

  // Initialize payment for order
  app.post('/api/payment/initialize', async (req, res) => {
    try {
      const { orderId, amount, method, customerName, description, orderData } = req.body;

      if (!orderId || !amount || !method) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }

      let result;
      switch (method.toLowerCase()) {
        case 'qris':
          result = paymentGateway.generateQRISPayment({
            orderId,
            amount,
            customerName: customerName || 'Customer',
            description: description || `Order #${orderId}`
          });
          break;
        case 'tunai':
        case 'cash':
          result = paymentGateway.generateCashPayment({
            orderId,
            amount,
            customerName: customerName || 'Customer'
          });
          break;
        default:
          return res.status(400).json({ success: false, error: 'Unsupported payment method. Use: qris or tunai' });
      }

      res.json(result);
    } catch (error) {
      console.error('Payment initialization error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Note: webhook endpoints removed (webhook feature disabled)

  // Search payments (replacement for removed webhook-based history)
  app.post('/api/payments/search', async (req, res) => {
    try {
      const { buyerName, method, status } = req.body || {};
      if (!buyerName) return res.status(400).json({ success: false, error: 'Buyer name required' });

      const orders = db.getOrders();

      const payments = (orders || [])
        .filter(order => {
          if (!order) return false;
          if ((order.buyerName || '') !== buyerName) return false;
          if (method && order.paymentMethod !== method) return false;
          if (status) {
            const s = order.paymentStatus || (order.completed ? 'completed' : 'pending');
            if (s !== status) return false;
          }
          return true;
        })
        .map(order => ({
          orderId: order.id || order._id,
          paymentMethod: order.paymentMethod || (order.completed ? 'tunai' : null),
          amount: (order.items || []).reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0),
          status: order.paymentStatus || (order.completed ? 'completed' : 'pending'),
          transactionId: order.transactionId || null,
          createdAt: order.createdAt || new Date().toISOString(),
          paidAt: order.paidAt || null
        }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      res.json({ success: true, count: payments.length, payments });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });


  // Generate invoice
  app.post('/api/invoice/generate', async (req, res) => {
    try {
      const { orderId, paymentStatus } = req.body;

      if (!orderId) {
        return res.status(400).json({ success: false, error: 'Order ID required' });
      }

      // Get order from database
      const orders = await db.readOrders();
      const order = orders.find(o => (o.id || o._id) === orderId);

      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      // Create invoice data
      const invoiceData = invoiceGenerator.createInvoiceData(order, paymentStatus || 'pending');

      // Save invoice
      const saveResult = await invoiceGenerator.saveInvoice(invoiceData);

      if (saveResult.success) {
        res.json({ success: true, invoice: invoiceData });
      } else {
        res.status(500).json(saveResult);
      }
    } catch (error) {
      console.error('Invoice generation error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get invoice
  app.get('/api/invoice/:invoiceNumber', async (req, res) => {
    try {
      const { invoiceNumber } = req.params;
      const result = await invoiceGenerator.getInvoice(invoiceNumber);

      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get invoice as HTML
  app.get('/api/invoice/:invoiceNumber/html', async (req, res) => {
    try {
      const { invoiceNumber } = req.params;
      const result = await invoiceGenerator.getInvoice(invoiceNumber);

      if (!result.success) {
        return res.status(404).json(result);
      }

      const html = invoiceGenerator.formatInvoiceHTML(result.invoice);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  const port = process.env.PORT || 3000;
  const server = http.createServer(app);

  // Setup WebSocket server
  const wsServer = new WebSocket.Server({ server });
  wsServer.on('connection', (ws) => {
    wss.add(ws);
    ws.send(JSON.stringify({ type: 'connected', data: { message: 'Connected to real-time updates' } }));
    
    ws.on('close', () => {
      wss.delete(ws);
    });
  });

  server.listen(port, () => console.log('Server running on http://localhost:' + port));
  }

  // Graceful shutdown: flush pending DB writes
  process.on('SIGINT', async () => {
    console.log('\n[SERVER] SIGINT received, flushing DB and exiting...');
    try { await db.flush(); } catch (e) {}
    process.exit(0);
  });
  process.on('SIGTERM', async () => {
    console.log('\n[SERVER] SIGTERM received, flushing DB and exiting...');
    try { await db.flush(); } catch (e) {}
    process.exit(0);
  });

main().catch(err => { console.error(err); process.exit(1); });
