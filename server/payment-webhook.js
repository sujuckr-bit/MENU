/**
 * Payment Webhook Handler - QRIS Only
 * Processes real-time payment status updates from QRIS
 */

const crypto = require('crypto');

class PaymentWebhookHandler {
    constructor(db) {
        this.db = db;
        this.webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || 'your-secret-key-change-this';
    }

    /**
     * Verify webhook signature
     */
    verifySignature(payload, signature, secret = this.webhookSecret) {
        const hash = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(payload))
            .digest('hex');

        try {
            return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
        } catch (e) {
            return false;
        }
    }

    /**
     * Handle QRIS Payment Webhook
     */
    async handleQRISWebhook(payload) {
        try {
            const { orderId, status, transactionId } = payload;

            // Validate payload
            if (!orderId || !status) {
                return { success: false, error: 'Invalid payload' };
            }

            // Get order from database
            const orders = this.db.getOrders();
            const order = orders.find(o => (o.id || o._id) === orderId);

            if (!order) {
                return { success: false, error: 'Order not found' };
            }

            // Update order payment status
            order.paymentStatus = status;
            order.paymentMethod = 'qris';
            order.transactionId = transactionId || order.transactionId || null;
            order.paidAt = new Date().toISOString();

            // Save updated order
            this.db.saveOrders(orders);

            return {
                success: true,
                orderId,
                status,
                message: 'QRIS payment status updated'
            };
        } catch (error) {
            console.error('QRIS Webhook Error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get Payment History for Customer
     */
    async getPaymentHistory(buyerName) {
        try {
            const orders = this.db.getOrders();

            const payments = orders
                .filter(order => {
                    if (!order) return false;
                    if ((order.buyerName || '') !== buyerName) return false;
                    if (order.paymentMethod) return true;
                    if (order.paymentStatus === 'completed') return true;
                    if (order.completed) return true;
                    return false;
                })
                .map(order => ({
                    orderId: order.id || order._id,
                    paymentMethod: order.paymentMethod || 'tunai',
                    amount: order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0,
                    status: order.paymentStatus || (order.completed ? 'completed' : 'pending'),
                    transactionId: order.transactionId || null,
                    createdAt: order.createdAt || new Date().toISOString(),
                    paidAt: order.paidAt || null
                }))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            return {
                success: true,
                count: payments.length,
                payments
            };
        } catch (error) {
            console.error('Get Payment History Error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get Payment Status by Order ID
     */
    async getPaymentStatus(orderId) {
        try {
            const orders = this.db.getOrders();
            const order = orders.find(o => (o.id || o._id) === orderId);

            if (!order) {
                return { success: false, error: 'Order not found' };
            }

            return {
                success: true,
                orderId,
                paymentMethod: order.paymentMethod,
                paymentStatus: order.paymentStatus || 'pending',
                transactionId: order.transactionId || null,
                amount: order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0,
                paidAt: order.paidAt || null
            };
        } catch (error) {
            console.error('Get Payment Status Error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Confirm Cash Payment (Tunai)
     */
    async confirmCashPayment(orderId) {
        try {
            const orders = this.db.getOrders();
            const order = orders.find(o => (o.id || o._id) === orderId);

            if (!order) {
                return { success: false, error: 'Order not found' };
            }

            // Update order payment status
            order.paymentStatus = 'completed';
            order.paymentMethod = 'tunai';
            order.paidAt = new Date().toISOString();

            // Save updated order
            this.db.saveOrders(orders);

            return {
                success: true,
                orderId,
                status: 'completed',
                message: 'Cash payment confirmed'
            };
        } catch (error) {
            console.error('Cash Payment Confirmation Error:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = PaymentWebhookHandler;
