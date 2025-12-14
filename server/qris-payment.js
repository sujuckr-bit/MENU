/**
 * QRIS Payment Service Module
 * Handles QRIS payment verification, status tracking, and webhook processing
 * Integrates with QRIS/Midtrans API for real-time payment verification
 */

const crypto = require('crypto');

class QRISPaymentService {
  constructor(config = {}) {
    // QRIS Configuration
    this.qrisConfig = {
      merchantId: config.merchantId || process.env.QRIS_MERCHANT_ID || 'ID1025389810363',
      merchantName: config.merchantName || process.env.QRIS_MERCHANT_NAME || 'SERVIS KOMPUTER',
      merchantCity: config.merchantCity || process.env.QRIS_MERCHANT_CITY || 'Makassar',
      apiKey: config.apiKey || process.env.QRIS_API_KEY || '', // Set in .env
      serverKey: config.serverKey || process.env.QRIS_SERVER_KEY || '', // Set in .env
      webhookSecret: config.webhookSecret || process.env.QRIS_WEBHOOK_SECRET || 'your-webhook-secret',
      environment: config.environment || process.env.NODE_ENV || 'development',
      callbackUrl: config.callbackUrl || process.env.QRIS_CALLBACK_URL || 'http://localhost:3000/webhook/qris'
    };

    // Payment status constants
    this.paymentStatus = {
      PENDING: 'pending',
      VERIFYING: 'verifying',
      SUCCESS: 'success',
      FAILED: 'failed',
      EXPIRED: 'expired',
      CANCELLED: 'cancelled'
    };

    // Transaction timeout (30 minutes default)
    this.transactionTimeout = config.transactionTimeout || 30 * 60 * 1000;
  }

  /**
   * Generate QRIS static payload for a transaction
   * Returns EMVCo payload for QR code generation
   */
  generateQRISPayload(amount = null, transactionId = null) {
    try {
      // QRIS Static: No amount in QR (amount entered manually by payer)
      // Format: EMVCo QRIS 2D Code Data Object
      
      const payload = {
        // Point of Initiation (00): 12 = Dynamic, 11 = Static
        POI: '12', // Static for self-order
        merchantAccountInformation: {
          id: '00',
          value: this.qrisConfig.merchantId
        },
        merchantCategoryCode: '5411', // Groceries/Food
        merchantName: this.qrisConfig.merchantName,
        merchantCity: this.qrisConfig.merchantCity,
        transactionCurrency: '360', // IDR
        transactionAmount: amount || null,
        tip: null,
        convenienceFee: null,
        convenienceFeeFixed: null,
        convenienceFeePercentage: null,
        countryCode: 'ID',
        merchantInformationLanguagePreference: 'ID',
        transactionId: transactionId,
        uniqueNumber: this.generateUniqueNumber(),
        timestamp: new Date().toISOString()
      };

      return payload;
    } catch (error) {
      console.error('Error generating QRIS payload:', error);
      throw error;
    }
  }

  /**
   * Generate unique transaction ID
   */
  generateTransactionId() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN-${timestamp}-${random}`;
  }

  /**
   * Generate unique number for QRIS (random 4-12 digits)
   */
  generateUniqueNumber() {
    return Math.random().toString().substring(2, 8);
  }

  /**
   * Verify QRIS webhook signature
   * Validates webhook authenticity using HMAC-SHA256
   */
  verifyWebhookSignature(body, signature) {
    try {
      const computed = crypto
        .createHmac('sha256', this.qrisConfig.webhookSecret)
        .update(JSON.stringify(body))
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(computed),
        Buffer.from(signature)
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Process webhook notification from payment gateway
   * Updates order payment status based on webhook data
   */
  processWebhookNotification(webhookData) {
    try {
      const {
        transactionId,
        paymentStatus,
        amount,
        timestamp,
        referenceId,
        payerName,
        paymentMethod
      } = webhookData;

      // Validate webhook data
      if (!transactionId || !paymentStatus) {
        throw new Error('Invalid webhook data: missing required fields');
      }

      // Map payment status from gateway to internal status
      const statusMap = {
        'settlement': this.paymentStatus.SUCCESS,
        'pending': this.paymentStatus.PENDING,
        'expire': this.paymentStatus.EXPIRED,
        'cancel': this.paymentStatus.CANCELLED,
        'deny': this.paymentStatus.FAILED,
        'success': this.paymentStatus.SUCCESS,
        'failed': this.paymentStatus.FAILED
      };

      const internalStatus = statusMap[paymentStatus] || this.paymentStatus.PENDING;

      return {
        transactionId,
        paymentStatus: internalStatus,
        amount,
        timestamp: timestamp || new Date().toISOString(),
        referenceId,
        payerName,
        paymentMethod,
        verified: true,
        verificationTimestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error processing webhook notification:', error);
      throw error;
    }
  }

  /**
   * Simulate payment verification for development
   * In production, this would call actual payment gateway API
   */
  async verifyPaymentStatus(transactionId) {
    try {
      // In development, simulate verification
      if (this.qrisConfig.environment === 'development') {
        return {
          transactionId,
          paymentStatus: this.paymentStatus.PENDING,
          message: 'Payment verification pending. In production, this would query payment gateway API.'
        };
      }

      // In production, call actual payment gateway
      // Example: Midtrans, Xendit, GPN API
      const result = await this.queryPaymentGatewayAPI(transactionId);
      return result;
    } catch (error) {
      console.error('Error verifying payment status:', error);
      throw error;
    }
  }

  /**
   * Query payment gateway API (stub for production integration)
   * Replace with actual API call to Midtrans, Xendit, GPN, etc.
   */
  async queryPaymentGatewayAPI(transactionId) {
    // TODO: Implement actual API call based on chosen payment provider
    // Example for Midtrans:
    // GET https://api.midtrans.com/v2/{transaction_id}/status
    // Auth: Basic Base64(serverKey:)

    console.warn('queryPaymentGatewayAPI not fully implemented - set QRIS API credentials in .env');
    
    return {
      transactionId,
      paymentStatus: this.paymentStatus.PENDING,
      verified: false
    };
  }

  /**
   * Generate webhook callback URL
   */
  getWebhookCallbackUrl() {
    return this.qrisConfig.callbackUrl;
  }

  /**
   * Check if payment has expired
   */
  isPaymentExpired(createdAt) {
    const now = Date.now();
    const created = new Date(createdAt).getTime();
    return (now - created) > this.transactionTimeout;
  }

  /**
   * Generate payment tracking token
   * Used for long-polling or WebSocket to track payment status
   */
  generatePaymentTrackingToken(transactionId, orderId) {
    const data = `${transactionId}:${orderId}:${Date.now()}`;
    return crypto
      .createHash('sha256')
      .update(data + this.qrisConfig.webhookSecret)
      .digest('hex');
  }

  /**
   * Format payment response for client
   */
  formatPaymentResponse(paymentData) {
    return {
      transactionId: paymentData.transactionId,
      status: paymentData.paymentStatus,
      amount: paymentData.amount,
      timestamp: paymentData.timestamp,
      referenceId: paymentData.referenceId,
      verified: paymentData.verified || false,
      verificationTimestamp: paymentData.verificationTimestamp,
      message: this.getPaymentStatusMessage(paymentData.paymentStatus),
      expiresAt: new Date(new Date(paymentData.timestamp).getTime() + this.transactionTimeout).toISOString()
    };
  }

  /**
   * Get user-friendly payment status message
   */
  getPaymentStatusMessage(status) {
    const messages = {
      [this.paymentStatus.PENDING]: 'Menunggu pembayaran QRIS...',
      [this.paymentStatus.VERIFYING]: 'Verifikasi pembayaran sedang diproses...',
      [this.paymentStatus.SUCCESS]: 'Pembayaran berhasil! Pesanan Anda telah dikonfirmasi.',
      [this.paymentStatus.FAILED]: 'Pembayaran gagal. Silakan coba lagi.',
      [this.paymentStatus.EXPIRED]: 'QR Code telah kadaluarsa. Silakan buat pesanan baru.',
      [this.paymentStatus.CANCELLED]: 'Pembayaran dibatalkan.'
    };

    return messages[status] || 'Status pembayaran tidak diketahui.';
  }
}

module.exports = QRISPaymentService;
