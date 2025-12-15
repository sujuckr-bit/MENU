const http = require('http');

function req(options, data) {
  return new Promise((resolve, reject) => {
    const r = http.request(options, (res) => {
      let s = '';
      res.on('data', c => s += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: s }));
    });
    r.on('error', reject);
    if (data) r.write(JSON.stringify(data));
    r.end();
  });
}

(async () => {
  try {
    // 1) create order (no auth required)
    const order = { buyerName: 'Programmatic Tester', tableNumber: '77', items: [{ name: 'Auto Item', category: 'Test', qty: 1, price: 5000, subtotal: 5000 }], subtotal:5000, tax:500, total:5500, paymentMethod: 'tunai' };
    const createOpts = { hostname: 'localhost', port: 3000, path: '/api/orders', method: 'POST', headers: { 'Content-Type': 'application/json' } };
    const createResp = await req(createOpts, order);
    console.log('CREATE_RESP', createResp.status, createResp.body);
    const createJson = JSON.parse(createResp.body || '{}');
    const id = createJson.id || createJson.orderId || createJson._id;
    if (!id) {
      console.error('Failed to create order, response:', createResp.body);
      process.exit(1);
    }

    // 2) login as admin
    const adminPassword = process.env.TEST_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      console.error('ERROR: TEST_ADMIN_PASSWORD or ADMIN_PASSWORD environment variable not set');
      console.error('Usage: TEST_ADMIN_PASSWORD=your_password node login_and_complete_order.js');
      process.exit(1);
    }
    const loginData = { username: 'admin', password: adminPassword };
    const loginOpts = { hostname: 'localhost', port: 3000, path: '/api/login', method: 'POST', headers: { 'Content-Type': 'application/json' } };
    const loginResp = await req(loginOpts, loginData);
    console.log('LOGIN_RESP', loginResp.status, loginResp.body);
    const setCookie = loginResp.headers['set-cookie'];
    if (!setCookie || setCookie.length === 0) {
      console.error('No set-cookie received; login likely failed');
      process.exit(1);
    }
    const cookieHeader = setCookie.map(c => c.split(';')[0]).join('; ');
    console.log('COOKIE', cookieHeader);

    // 3) mark order complete with admin cookie
    const compOpts = { hostname: 'localhost', port: 3000, path: `/api/orders/${id}/complete`, method: 'POST', headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader } };
    const compResp = await req(compOpts, {});
    console.log('COMPLETE_RESP', compResp.status, compResp.body);

    // 4) fetch orders as admin
    const listOpts = { hostname: 'localhost', port: 3000, path: '/api/orders', method: 'GET', headers: { 'Cookie': cookieHeader } };
    const listResp = await req(listOpts);
    console.log('LIST_STATUS', listResp.status);
    if (listResp.status === 403) {
      console.error('Admin access forbidden when fetching orders.');
      process.exit(1);
    }
    const orders = JSON.parse(listResp.body || '[]');
    const completed = (orders || []).filter(o => o && o.completed);
    console.log('COMPLETED_COUNT', completed.length);
    console.log(JSON.stringify(completed.slice(-5), null, 2));

    process.exit(0);
  } catch (e) {
    console.error('ERR', e && e.message || e);
    process.exit(1);
  }
})();
