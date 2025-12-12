const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const fs = require('fs-extra');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const MENUS_FILE = path.join(DATA_DIR, 'menus.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

async function ensureDataFiles() {
  await fs.ensureDir(DATA_DIR);
  if (!(await fs.pathExists(USERS_FILE))) {
    const defaultHash = await bcrypt.hash('admin123', 10);
    await fs.writeJson(USERS_FILE, { admin: { passwordHash: defaultHash } }, { spaces: 2 });
    console.log('Created', USERS_FILE);
  }
  if (!(await fs.pathExists(MENUS_FILE))) {
    await fs.writeJson(MENUS_FILE, {}, { spaces: 2 });
    console.log('Created', MENUS_FILE);
  }
  if (!(await fs.pathExists(ORDERS_FILE))) {
    await fs.writeJson(ORDERS_FILE, [], { spaces: 2 });
    console.log('Created', ORDERS_FILE);
  }
}

async function readJsonSafe(file, fallback) {
  try { return await fs.readJson(file); } catch (e) { return fallback; }
}

async function writeJsonSafe(file, data) {
  await fs.writeJson(file, data, { spaces: 2 });
}

async function main() {
  await ensureDataFiles();

  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(bodyParser.json());
  app.use(session({ secret: 'change-this-secret', resave: false, saveUninitialized: false }));

  // Login
  app.post('/api/login', async (req, res) => {
    const { username = 'admin', password } = req.body || {};
    if (!password) return res.status(400).json({ error: 'Missing password' });
    const users = await readJsonSafe(USERS_FILE, {});
    const u = users[username];
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
    const menus = await readJsonSafe(MENUS_FILE, {});
    res.json(menus);
  });

  app.post('/api/menus', async (req, res) => {
    if (!req.session.isAdmin) return res.status(403).json({ error: 'forbidden' });
    const data = req.body || {};
    await writeJsonSafe(MENUS_FILE, data);
    res.json({ ok: true });
  });

  // Orders
  app.get('/api/orders', async (req, res) => {
    if (!req.session.isAdmin) return res.status(403).json({ error: 'forbidden' });
    const orders = await readJsonSafe(ORDERS_FILE, []);
    res.json(orders);
  });

  app.post('/api/orders', async (req, res) => {
    const orders = await readJsonSafe(ORDERS_FILE, []);
    const order = req.body;
    order.id = Date.now();
    orders.push(order);
    await writeJsonSafe(ORDERS_FILE, orders);
    res.json({ ok: true, id: order.id });
  });

  // Change admin password (admin-only)
  app.post('/api/change-password', async (req, res) => {
    if (!req.session.isAdmin) return res.status(403).json({ error: 'forbidden' });
    const { username = 'admin', newPassword } = req.body || {};
    if (!newPassword) return res.status(400).json({ error: 'missing password' });
    const users = await readJsonSafe(USERS_FILE, {});
    users[username] = users[username] || {};
    users[username].passwordHash = await bcrypt.hash(newPassword, 10);
    await writeJsonSafe(USERS_FILE, users);
    res.json({ ok: true });
  });

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log('Server running on http://localhost:' + port));
}

main().catch(err => { console.error(err); process.exit(1); });
