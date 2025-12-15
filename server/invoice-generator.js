/**
 * Invoice Generator Module
 * Generates digital invoices and receipts in JSON/PDF format
 */

const fs = require('fs').promises;
const path = require('path');

class InvoiceGenerator {
    constructor() {
        this.invoiceDir = path.join(__dirname, '../data/invoices');
        this.ensureInvoiceDir();
    }

    /**
     * Ensure invoice directory exists
     */
    async ensureInvoiceDir() {
        try {
            await fs.mkdir(this.invoiceDir, { recursive: true });
        } catch (error) {
            console.error('Error creating invoice directory:', error);
        }
    }

    /**
     * Generate Unique Invoice Number
     */
    generateInvoiceNumber(orderId) {
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
        const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `INV-${dateStr}-${orderId}-${randomNum}`;
    }

    /**
     * Create Invoice Data
     */
    createInvoiceData(order, paymentStatus = 'pending') {
        const invoiceNumber = this.generateInvoiceNumber(order.id || order._id);
        const now = new Date();
        const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

        const items = order.items || [];
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.1; // 10% tax (adjust as needed)
        const total = subtotal + tax;

        return {
            invoiceNumber,
            orderId: order.id || order._id,
            status: paymentStatus,
            
            // Dates
            issuedAt: now.toISOString(),
            dueDate: dueDate.toISOString(),
            
            // Customer Info
            customer: {
                name: order.buyerName || 'Customer',
                email: order.email || '',
                phone: order.phone || '',
                tableNumber: order.tableNumber || null
            },
            
            // Business Info
            merchant: {
                name: 'Himpunan Mahasiswa Islam',
                address: 'Makassar',
                phone: process.env.MERCHANT_PHONE || '0812-XXXX-XXXX',
                email: process.env.MERCHANT_EMAIL || 'info@himpunan.id',
                taxId: process.env.MERCHANT_TAX_ID || '00.000.000.0-000.000'
            },
            
            // Items
            items: items.map((item, idx) => ({
                no: idx + 1,
                name: item.itemName || item.name,
                category: item.category || 'General',
                quantity: item.quantity,
                price: item.price,
                subtotal: item.price * item.quantity,
                notes: item.notes || ''
            })),
            
            // Totals
            totals: {
                subtotal,
                tax,
                discount: order.discount || 0,
                total: total - (order.discount || 0)
            },
            
            // Payment Info
            payment: {
                method: order.paymentMethod || 'cash',
                status: paymentStatus,
                transactionId: order.transactionId || null,
                paidAt: order.paidAt || null
            },
            
            // Notes
            notes: order.notes || 'Terima kasih telah berbelanja!',
            
            // Metadata
            metadata: {
                generatedAt: now.toISOString(),
                version: '1.0',
                reference: order.reference || null
            }
        };
    }

    /**
     * Save Invoice to File
     */
    async saveInvoice(invoiceData) {
        try {
            const filePath = path.join(this.invoiceDir, `${invoiceData.invoiceNumber}.json`);
            await fs.writeFile(filePath, JSON.stringify(invoiceData, null, 2));
            return {
                success: true,
                invoiceNumber: invoiceData.invoiceNumber,
                path: filePath
            };
        } catch (error) {
            console.error('Error saving invoice:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get Invoice by Number
     */
    async getInvoice(invoiceNumber) {
        try {
            const filePath = path.join(this.invoiceDir, `${invoiceNumber}.json`);
            const data = await fs.readFile(filePath, 'utf-8');
            return {
                success: true,
                invoice: JSON.parse(data)
            };
        } catch (error) {
            return {
                success: false,
                error: 'Invoice not found'
            };
        }
    }

    /**
     * Format Invoice for HTML Display
     */
    formatInvoiceHTML(invoiceData) {
        const dateFormatter = (dateStr) => {
            return new Date(dateStr).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        const currencyFormatter = (amount) => {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(amount);
        };

        const itemsHTML = invoiceData.items.map(item => `
            <tr>
                <td>${item.no}</td>
                <td>${item.name}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">${currencyFormatter(item.price)}</td>
                <td style="text-align: right;">${currencyFormatter(item.subtotal)}</td>
            </tr>
        `).join('');

        const statusColor = {
            'pending': '#ffc107',
            'completed': '#28a745',
            'failed': '#dc3545',
            'refunded': '#6c757d'
        }[invoiceData.status] || '#000';

        return `
            <!DOCTYPE html>
            <html lang="id">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Invoice ${invoiceData.invoiceNumber}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background: #f5f5f5;
                        padding: 20px;
                    }
                    .container {
                        max-width: 800px;
                        margin: 0 auto;
                        background: white;
                        padding: 40px;
                        border-radius: 8px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: start;
                        margin-bottom: 40px;
                        border-bottom: 3px solid #00a856;
                        padding-bottom: 20px;
                    }
                    .merchant-info h1 {
                        color: #00a856;
                        font-size: 24px;
                        margin-bottom: 10px;
                    }
                    .invoice-info {
                        text-align: right;
                    }
                    .invoice-info h2 {
                        color: #1a3a52;
                        font-size: 18px;
                        margin-bottom: 5px;
                    }
                    .status-badge {
                        display: inline-block;
                        background: ${statusColor};
                        color: white;
                        padding: 6px 12px;
                        border-radius: 4px;
                        font-size: 12px;
                        font-weight: 600;
                        margin-top: 5px;
                        text-transform: uppercase;
                    }
                    .section {
                        margin-bottom: 30px;
                    }
                    .section-title {
                        color: #1a3a52;
                        font-size: 14px;
                        font-weight: 700;
                        text-transform: uppercase;
                        margin-bottom: 10px;
                        border-bottom: 2px solid #00a856;
                        padding-bottom: 8px;
                    }
                    .info-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                        margin-bottom: 20px;
                    }
                    .info-item {
                        font-size: 13px;
                    }
                    .info-item strong {
                        color: #1a3a52;
                        display: block;
                        margin-bottom: 3px;
                    }
                    .info-item span {
                        color: #666;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    th {
                        background: #f0f7f4;
                        color: #1a3a52;
                        padding: 12px;
                        text-align: left;
                        font-weight: 600;
                        font-size: 12px;
                        border-bottom: 2px solid #00a856;
                    }
                    td {
                        padding: 12px;
                        border-bottom: 1px solid #f0f0f0;
                        font-size: 13px;
                    }
                    tr:last-child td {
                        border-bottom: none;
                    }
                    .totals-section {
                        text-align: right;
                        margin-top: 20px;
                        padding-top: 20px;
                        border-top: 2px solid #f0f0f0;
                    }
                    .total-row {
                        display: flex;
                        justify-content: flex-end;
                        margin-bottom: 8px;
                        font-size: 13px;
                    }
                    .total-row strong {
                        min-width: 150px;
                        text-align: left;
                    }
                    .total-row.grand-total {
                        font-size: 18px;
                        font-weight: 700;
                        color: #00a856;
                        border-top: 2px solid #00a856;
                        padding-top: 12px;
                        margin-top: 12px;
                    }
                    .notes {
                        background: #f0f7f4;
                        padding: 15px;
                        border-radius: 4px;
                        color: #1a3a52;
                        font-size: 12px;
                        margin-bottom: 20px;
                    }
                    .footer {
                        text-align: center;
                        color: #999;
                        font-size: 11px;
                        border-top: 1px solid #f0f0f0;
                        padding-top: 20px;
                        margin-top: 20px;
                    }
                    @media print {
                        body { background: white; padding: 0; }
                        .container { box-shadow: none; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <!-- Header -->
                    <div class="header">
                        <div class="merchant-info">
                            <h1>${invoiceData.merchant.name}</h1>
                            <p style="color: #666; font-size: 12px;">
                                ${invoiceData.merchant.address}<br>
                                ${invoiceData.merchant.phone} | ${invoiceData.merchant.email}
                            </p>
                        </div>
                        <div class="invoice-info">
                            <h2>INVOICE</h2>
                            <p style="color: #666; font-size: 12px;">${invoiceData.invoiceNumber}</p>
                            <p style="color: #666; font-size: 12px;">Tanggal: ${dateFormatter(invoiceData.issuedAt)}</p>
                            <div class="status-badge">${invoiceData.status}</div>
                        </div>
                    </div>

                    <!-- Customer Info -->
                    <div class="section">
                        <div class="section-title">Informasi Pelanggan</div>
                        <div class="info-grid">
                            <div class="info-item">
                                <strong>Nama:</strong>
                                <span>${invoiceData.customer.name}</span>
                            </div>
                            <div class="info-item">
                                <strong>Email:</strong>
                                <span>${invoiceData.customer.email || '-'}</span>
                            </div>
                            <div class="info-item">
                                <strong>Telepon:</strong>
                                <span>${invoiceData.customer.phone || '-'}</span>
                            </div>
                            <div class="info-item">
                                <strong>Nomor Meja:</strong>
                                <span>${invoiceData.customer.tableNumber ? `Meja ${invoiceData.customer.tableNumber}` : '-'}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Items -->
                    <div class="section">
                        <div class="section-title">Detail Pesanan</div>
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 5%;">No</th>
                                    <th style="width: 45%;">Item</th>
                                    <th style="width: 15%; text-align: center;">Qty</th>
                                    <th style="width: 18%; text-align: right;">Harga</th>
                                    <th style="width: 17%; text-align: right;">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHTML}
                            </tbody>
                        </table>
                    </div>

                    <!-- Totals -->
                    <div class="totals-section">
                        <div class="total-row">
                            <strong>Subtotal:</strong>
                            <span>${currencyFormatter(invoiceData.totals.subtotal)}</span>
                        </div>
                        <div class="total-row">
                            <strong>Pajak (10%):</strong>
                            <span>${currencyFormatter(invoiceData.totals.tax)}</span>
                        </div>
                        ${invoiceData.totals.discount > 0 ? `
                        <div class="total-row">
                            <strong>Diskon:</strong>
                            <span>-${currencyFormatter(invoiceData.totals.discount)}</span>
                        </div>
                        ` : ''}
                        <div class="total-row grand-total">
                            <strong>Total:</strong>
                            <span>${currencyFormatter(invoiceData.totals.total)}</span>
                        </div>
                    </div>

                    <!-- Payment Info -->
                    <div class="section">
                        <div class="section-title">Informasi Pembayaran</div>
                        <div class="info-grid">
                            <div class="info-item">
                                <strong>Metode:</strong>
                                <span>${invoiceData.payment.method.toUpperCase()}</span>
                            </div>
                            <div class="info-item">
                                <strong>Status:</strong>
                                <span>${invoiceData.payment.status}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Notes -->
                    ${invoiceData.notes ? `
                    <div class="notes">
                        <strong>Catatan:</strong><br>
                        ${invoiceData.notes}
                    </div>
                    ` : ''}

                    <!-- Footer -->
                    <div class="footer">
                        <p>Invoice ini dibuat secara otomatis. Harap simpan untuk keperluan Anda.</p>
                        <p>Terima kasih telah berbisnis dengan kami!</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Format Invoice for Email
     */
    formatInvoiceEmail(invoiceData) {
        const dateFormatter = (dateStr) => {
            return new Date(dateStr).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        const currencyFormatter = (amount) => {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
            }).format(amount);
        };

        const itemsText = invoiceData.items
            .map(item => `${item.name} x${item.quantity} = ${currencyFormatter(item.subtotal)}`)
            .join('\n');

        return {
            subject: `Invoice ${invoiceData.invoiceNumber} - ${invoiceData.merchant.name}`,
            text: `
Halo ${invoiceData.customer.name},

Terima kasih atas pesanan Anda! Berikut adalah detail invoice:

INVOICE DETAILS
===============
Nomor Invoice: ${invoiceData.invoiceNumber}
Tanggal: ${dateFormatter(invoiceData.issuedAt)}
Status: ${invoiceData.payment.status}

CUSTOMER INFO
=============
Nama: ${invoiceData.customer.name}
Email: ${invoiceData.customer.email || '-'}
Telepon: ${invoiceData.customer.phone || '-'}

ITEMS ORDERED
=============
${itemsText}

SUMMARY
=======
Subtotal: ${currencyFormatter(invoiceData.totals.subtotal)}
Pajak: ${currencyFormatter(invoiceData.totals.tax)}
${invoiceData.totals.discount > 0 ? `Diskon: -${currencyFormatter(invoiceData.totals.discount)}\n` : ''}
Total: ${currencyFormatter(invoiceData.totals.total)}

PAYMENT METHOD
==============
${invoiceData.payment.method.toUpperCase()}

Terima kasih telah berbelanja!

${invoiceData.merchant.name}
${invoiceData.merchant.phone} | ${invoiceData.merchant.email}
            `,
            html: this.formatInvoiceHTML(invoiceData)
        };
    }
}

module.exports = InvoiceGenerator;
