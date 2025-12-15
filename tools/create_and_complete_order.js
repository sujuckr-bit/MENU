const http = require('http');
function req(path, method, data){
  return new Promise((res, rej) => {
    const opts = { hostname: 'localhost', port: 3000, path, method, headers: { 'Content-Type': 'application/json' } };
    const r = http.request(opts, resp => {
      let s = '';
      resp.on('data', c => s += c);
      resp.on('end', () => res({ status: resp.statusCode, body: s }));
    });
    r.on('error', e => rej(e));
    if (data) r.write(JSON.stringify(data));
    r.end();
  });
}

(async () => {
  try {
    const order = {
      buyerName: 'Test User',
      tableNumber: '99',
      items: [ { name: 'Test Item', category: 'Test', qty: 1, price: 10000, subtotal: 10000 } ],
      subtotal: 10000,
      tax: 1000,
      total: 11000,
      paymentMethod: 'tunai'
    };

    const createResp = await req('/api/orders', 'POST', order);
    console.log('CREATE_RESP', createResp.body);
    const j = JSON.parse(createResp.body || '{}');
    const id = j.orderId || j.id || j.orderId || j.order_id;
    if (!id) {
      console.error('NO_ID_IN_RESPONSE');
      process.exit(1);
    }

    const compResp = await req('/api/orders/' + id + '/complete', 'POST', {});
    console.log('COMPLETE_RESP', compResp.body);

    const listResp = await req('/api/orders', 'GET');
    const orders = JSON.parse(listResp.body || '[]');
    const completed = orders.filter(o => o && o.completed);
    console.log('COMPLETED_COUNT', completed.length);
    console.log(JSON.stringify(completed, null, 2));

    process.exit(0);
  } catch (e) {
    console.error('ERR', e && e.message || e);
    process.exit(1);
  }
})();
