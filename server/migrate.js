const fs = require('fs-extra');
const path = require('path');
const db = require('./db');

async function migrate() {
  db.init();

  const dataDir = path.join(__dirname, 'data');
  const usersFile = path.join(dataDir, 'users.json');
  const menusFile = path.join(dataDir, 'menus.json');
  const ordersFile = path.join(dataDir, 'orders.json');

  if (await fs.pathExists(usersFile)) {
    const users = await fs.readJson(usersFile);
    for (const [username, obj] of Object.entries(users)) {
      if (obj && obj.passwordHash) db.setUserPassword(username, obj.passwordHash);
    }
    console.log('Imported users');
  } else {
    console.log('No users.json found');
  }

  if (await fs.pathExists(menusFile)) {
    const menus = await fs.readJson(menusFile);
    db.setMenus(menus);
    console.log('Imported menus');
  } else {
    console.log('No menus.json found');
  }

  if (await fs.pathExists(ordersFile)) {
    const orders = await fs.readJson(ordersFile);
    for (const o of orders) {
      db.addOrder(o);
    }
    console.log('Imported orders');
  } else {
    console.log('No orders.json found');
  }

  console.log('Migration complete (to JSON DB)');
}

migrate().catch(err => { console.error(err); process.exit(1); });
