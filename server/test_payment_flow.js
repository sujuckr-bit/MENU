(async () => {
  const base = 'http://localhost:3000';
  try {
    // Create order
    const orderResp = await fetch(`${base}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buyerName: 'AutoTester', items: [{ name: 'TestItem', price: 15000, quantity: 2 }] })
    });
    const orderData = await orderResp.json();
    console.log('create order response:', orderData);
    const id = orderData.id;
    if (!id) return console.error('No order id returned');

    // Confirm cash payment via webhook endpoint
    const webhookResp = await fetch(`${base}/api/payment-webhook/tunai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: id })
    });
    const webhookData = await webhookResp.json();
    console.log('webhook response:', webhookData);

    // Fetch payment history
    const histResp = await fetch(`${base}/api/payment-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buyerName: 'AutoTester' })
    });
    const histData = await histResp.json();
    console.log('payment-history response:', JSON.stringify(histData, null, 2));
  } catch (e) {
    console.error('Error running test:', e);
  }
})();
