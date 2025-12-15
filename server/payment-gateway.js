class PaymentGateway {
  getPaymentMethods() {
    return ['qris', 'tunai'];
  }

  generateQRISPayment({ orderId, amount, customerName, description } = {}) {
    // Return a lightweight stub response suitable for local testing
    return {
      success: true,
      method: 'qris',
      orderId,
      amount,
      qrUrl: `https://api.qrserver.com/v1/create-qr-code/?data=QR:${orderId}:IDR${amount}`,
      paymentId: `QR-${orderId}`
    };
  }

  generateCashPayment({ orderId, amount, customerName } = {}) {
    return {
      success: true,
      method: 'tunai',
      orderId,
      amount,
      paymentId: `CASH-${orderId}`
    };
  }
}

module.exports = PaymentGateway;
