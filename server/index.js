const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const db = require('./db');

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
  app.use(cors({ origin: true, credentials: true }));
  app.use(bodyParser.json());
  app.use(session({ secret: 'change-this-secret', resave: false, saveUninitialized: false }));

  // Serve static files from parent directory
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
    if (!password) return res.status(400).json({ error: 'Missing password' });
    const u = db.getUser(username);
    if (!u || !u.passwordHash) return res.status(401).json({ error: 'Unauthorized' });
    const ok = await bcrypt.compare(password, u.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Unauthorized' });
    req.session.isAdmin = true;
    req.session.username = username;
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

  app.post('/api/menus', async (req, res) => {
    if (!req.session.isAdmin) return res.status(403).json({ error: 'forbidden' });
    const data = req.body || {};
    db.setMenus(data);
    broadcastUpdate('menus_updated', data);
    res.json({ ok: true });
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
    order.completed = true;
    db.saveOrders(orders);
    broadcastUpdate('order_updated', order);
    res.json({ ok: true });
  });

  // Change admin password (admin-only)
  app.post('/api/change-password', async (req, res) => {
    if (!req.session.isAdmin) return res.status(403).json({ error: 'forbidden' });
    const { username = 'admin', newPassword } = req.body || {};
    if (!newPassword) return res.status(400).json({ error: 'missing password' });
    const hash = await bcrypt.hash(newPassword, 10);
    db.setUserPassword(username, hash);
    res.json({ ok: true });
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

main().catch(err => { console.error(err); process.exit(1); });
