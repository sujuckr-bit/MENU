/**
 * Payment Gateway - QRIS Only
 * Simple QRIS payment integration for HMI order system
 */

const crypto = require('crypto');

class PaymentGateway {
    constructor() {
        // QRIS Configuration
        this.qrisConfig = {
            merchantId: process.env.QRIS_MERCHANT_ID || 'ID1025389810363',
            merchantName: process.env.QRIS_MERCHANT_NAME || 'Himpunan Mahasiswa Islam',
            city: process.env.QRIS_CITY || 'Makassar'
        };

        // Webhook Secret for payment verification
        this.webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || 'your-secret-key-change-this';
    }

    /**
     * Generate QRIS Payment Request
     * @param {Object} paymentData - Payment information
     * @returns {Object} Payment response with QRIS code
     */
    generateQRISPayment(paymentData) {
        const {
            orderId,
            amount,
            customerName,
            description
        } = paymentData;

        // Generate unique reference ID
        const referenceId = `QRIS-${orderId}-${Date.now()}`;

        // QRIS Payload
        const qrisPayload = {
            id: referenceId,
            merchantId: this.qrisConfig.merchantId,
            merchantName: this.qrisConfig.merchantName,
            merchantCity: this.qrisConfig.city,
            amount: parseFloat(amount),
            currency: 'IDR',
            orderId: orderId,
            customerName: customerName,
            description: description,
            timestamp: new Date().toISOString(),
            expiryTime: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
        };

        // Generate QRIS code string
        const qrisCode = this._generateQRISCode(qrisPayload);

        return {
            success: true,
            paymentMethod: 'QRIS',
            referenceId: referenceId,
            orderId: orderId,
            amount: parseFloat(amount),
            currency: 'IDR',
            qrisCode: qrisCode,
            expiryTime: qrisPayload.expiryTime,
            customerName: customerName,
            description: description,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
    }

    /**
     * Generate QRIS Code (EMV Format)
     * @private
     */
    _generateQRISCode(payload) {
        // Simplified QRIS code generation
        // In production, use proper QRIS EMV library like 'qris' npm package
        const qrisString = [
            '00020126',                                    // ID Pola Transaksi
            '360016COM.VERIFONE',                         // Akuisitor ID
            this.qrisConfig.merchantId,                  // Merchant ID
            String(Math.round(payload.amount)).padStart(13, '0'), // Nominal Transaksi
            '5802ID',                                     // Kode Negara
            '5303360',                                    // Kode Mata Uang
            payload.orderId,                             // Invoice Number
            '62070703A' + payload.orderId,               // Optional Data
            '6304'                                        // CRC Checksum
        ].join('');
        
        return qrisString;
    }

    /**
     * Handle Cash Payment (Tunai)
     * @param {Object} paymentData - Payment information
     * @returns {Object} Cash payment response
     */
    generateCashPayment(paymentData) {
        const { orderId, amount, customerName } = paymentData;

        return {
            success: true,
            paymentMethod: 'Tunai',
            orderId: orderId,
            amount: parseFloat(amount),
            currency: 'IDR',
            customerName: customerName,
            status: 'pending',
            requiresConfirmation: true,
            createdAt: new Date().toISOString()
        };
    }

    /**
     * Verify Webhook Signature
     * Ensures payment webhook is authentic
     */
    verifyWebhookSignature(payload, signature) {
        if (!signature) {
            return false;
        }

        // Calculate HMAC SHA256
        const calculatedSignature = crypto
            .createHmac('sha256', this.webhookSecret)
            .update(JSON.stringify(payload))
            .digest('hex');

        // Constant-time comparison to prevent timing attacks
        return crypto.timingSafeEqual(
            Buffer.from(calculatedSignature),
            Buffer.from(signature)
        );
    }

    /**
     * Update Payment Status
     * Called when webhook is received from payment provider
     */
    updatePaymentStatus(paymentData) {
        const { orderId, referenceId, status, transactionId, transactionTime } = paymentData;

        return {
            orderId: orderId,
            referenceId: referenceId,
            transactionId: transactionId,
            status: status, // 'pending', 'success', 'failed', 'cancelled'
            transactionTime: transactionTime || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    /**
     * Get Available Payment Methods
     * Returns only QRIS and Cash payment options
     */
    getPaymentMethods() {
        return [
            {
                id: 'qris',
                name: 'QRIS',
                displayName: 'QRIS (Scan QR Code)',
                description: 'Scan QR code dengan aplikasi e-wallet pilihan Anda',
                icon: 'bi bi-qr-code',
                fee: 0,
                isActive: true,
                paymentType: 'digital'
            },
            {
                id: 'tunai',
                name: 'Tunai',
                displayName: 'Bayar Kemudian (Tunai)',
                description: 'Bayar langsung dengan uang tunai saat pesanan selesai',
                icon: 'bi bi-cash-coin',
                fee: 0,
                isActive: true,
                paymentType: 'cash'
            }
        ];
    }

    /**
     * Get Payment Method Info
     */
    getPaymentMethodInfo(methodId) {
        const methods = this.getPaymentMethods();
        return methods.find(m => m.id === methodId) || null;
    }

    /**
     * Validate Payment Data
     */
    validatePaymentData(paymentData) {
        const errors = [];

        if (!paymentData.orderId) {
            errors.push('Order ID is required');
        }

        if (!paymentData.amount || paymentData.amount <= 0) {
            errors.push('Valid amount is required');
        }

        if (!paymentData.paymentMethod) {
            errors.push('Payment method is required');
        }

        const validMethods = ['qris', 'tunai'];
        if (!validMethods.includes(paymentData.paymentMethod)) {
            errors.push(`Invalid payment method. Must be one of: ${validMethods.join(', ')}`);
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

module.exports = PaymentGateway;
