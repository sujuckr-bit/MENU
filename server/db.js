const path = require('path');
const fs = require('fs-extra');

const DB_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'database.json');

let state = { users: {}, menus: {}, orders: [] };

function load() {
  fs.ensureDirSync(DB_DIR);
  if (fs.existsSync(DB_PATH)) {
    try {
      state = fs.readJsonSync(DB_PATH);
    } catch (e) {
      state = { users: {}, menus: {}, orders: [] };
    }
  } else {
    fs.writeJsonSync(DB_PATH, state, { spaces: 2 });
  }
}

function save() {
  fs.writeJsonSync(DB_PATH, state, { spaces: 2 });
}

function init() {
  load();
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

module.exports = {
  init,
  getUser,
  setUserPassword,
  getMenus,
  setMenus,
  getOrders,
  saveOrders,
  addOrder,
};
