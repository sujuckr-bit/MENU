const path = require('path');
const fs = require('fs-extra');

const DB_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'database.json');

let state = { users: {}, menus: {}, orders: [], settings: {} };

// If RAM_ONLY is set to '1' or 'true', the server will keep data only in memory
// and will NOT read/write the disk. Useful for lightweight/ephemeral runs.
const RAM_ONLY = process.env.RAM_ONLY === '1' || process.env.RAM_ONLY === 'true';

// Debounced async save to avoid blocking and excessive disk writes
let saveTimeout = null;
const SAVE_DEBOUNCE_MS = 500;

function load() {
  if (RAM_ONLY) {
    state = { users: {}, menus: {}, orders: [], settings: {} };
    return;
  }

  fs.ensureDirSync(DB_DIR);
  if (fs.existsSync(DB_PATH)) {
    try {
      state = fs.readJsonSync(DB_PATH);
    } catch (e) {
      state = { users: {}, menus: {}, orders: [], settings: {} };
    }
  } else {
    try {
      fs.writeJsonSync(DB_PATH, state, { spaces: 2 });
    } catch (e) {
      // ignore write errors at init
    }
  }
}

function _writeToDiskNow() {
  if (RAM_ONLY) return Promise.resolve();
  return fs.ensureDir(DB_DIR).then(() => fs.writeJson(DB_PATH, state, { spaces: 2 })).catch(err => {
    console.error('[DB] Failed to write database file:', err && err.message);
  });
}

function save() {
  if (RAM_ONLY) return;
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveTimeout = null;
    _writeToDiskNow();
  }, SAVE_DEBOUNCE_MS);
}

function flush() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  return _writeToDiskNow();
}

function init() {
  load();
  if (RAM_ONLY) console.log('[DB] Running in RAM_ONLY mode; data will not persist to disk');
}

function getUser(username) {
  return state.users[username] || null;
}

function setUserPassword(username, hash) {
  state.users[username] = state.users[username] || {};
  state.users[username].passwordHash = hash;
  save();
}

function getMenus() {
  return state.menus || {};
}

function setMenus(obj) {
  state.menus = obj || {};
  save();
}

function getOrders() {
  return (state.orders || []).map((o, idx) => ({ ...o, id: o.id || idx + 1 }));
}

function saveOrders(orders) {
  state.orders = orders || [];
  save();
}

function addOrder(order) {
  const o = Object.assign({}, order);
  // assign incremental id
  const nextId = state.orders.length ? (state.orders[state.orders.length - 1].id || state.orders.length) + 1 : 1;
  o.id = nextId;
  state.orders.push(o);
  save();
  return o.id;
}

function getSettings() {
  return state.settings || {};
}

function getSetting(key, defaultValue) {
  const s = state.settings || {};
  return typeof s[key] !== 'undefined' ? s[key] : defaultValue;
}

function setSetting(key, value) {
  state.settings = state.settings || {};
  state.settings[key] = value;
  save();
}

module.exports = {
  init,
  getUser,
  setUserPassword,
  getMenus,
  setMenus,
  getOrders,
  saveOrders,
  addOrder,
  getSettings,
  getSetting,
  setSetting,
  flush,
};
