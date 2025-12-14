document.addEventListener('DOMContentLoaded', function() {
    // showToast is provided by assets/js/toast.js
    
    // Helper: Show confirmation with Undo toast (replaces confirm dialogs)
    let pendingConfirmBar = null;
    function showConfirmUndo(message, onConfirm, onCancel = null) {
        // remove existing bar
        if (pendingConfirmBar) { pendingConfirmBar.remove(); pendingConfirmBar = null; }
        
        const bar = document.createElement('div');
        bar.style.position = 'fixed';
        bar.style.left = '20px';
        bar.style.right = '20px';
        bar.style.bottom = '20px';
        bar.style.zIndex = '9999';
        bar.style.display = 'flex';
        bar.style.justifyContent = 'space-between';
        bar.style.alignItems = 'center';
        bar.style.background = 'rgba(33,37,41,0.95)';
        bar.style.color = 'white';
        bar.style.padding = '12px 16px';
        bar.style.borderRadius = '8px';
        bar.style.boxShadow = '0 6px 18px rgba(0,0,0,0.2)';
        
        const txt = document.createElement('div');
        txt.textContent = message;
        txt.style.flex = '1';
        
        const btns = document.createElement('div');
        btns.style.display = 'flex';
        btns.style.gap = '8px';
        
        const yesBtn = document.createElement('button');
        yesBtn.textContent = 'Ya';
        yesBtn.style.background = '#dc3545';
        yesBtn.style.color = 'white';
        yesBtn.style.border = 'none';
        yesBtn.style.padding = '6px 12px';
        yesBtn.style.borderRadius = '4px';
        yesBtn.style.cursor = 'pointer';
        yesBtn.style.fontWeight = '600';
        
        const noBtn = document.createElement('button');
        noBtn.textContent = 'Batal';
        noBtn.style.background = '#6c757d';
        noBtn.style.color = 'white';
        noBtn.style.border = 'none';
        noBtn.style.padding = '6px 12px';
        noBtn.style.borderRadius = '4px';
        noBtn.style.cursor = 'pointer';
        noBtn.style.fontWeight = '600';
        
        btns.appendChild(yesBtn);
        btns.appendChild(noBtn);
        bar.appendChild(txt);
        bar.appendChild(btns);
        document.body.appendChild(bar);
        pendingConfirmBar = bar;
        
        let done = false;
        const timer = setTimeout(() => {
            if (!done) { done = true; if (pendingConfirmBar) { pendingConfirmBar.remove(); pendingConfirmBar = null; } if (onCancel) onCancel(); }
        }, 7000);
        
        yesBtn.addEventListener('click', () => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            if (pendingConfirmBar) { pendingConfirmBar.remove(); pendingConfirmBar = null; }
            try { onConfirm(); } catch (e) { console.error('Confirm action failed', e); }
        });
        
        noBtn.addEventListener('click', () => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            if (pendingConfirmBar) { pendingConfirmBar.remove(); pendingConfirmBar = null; }
            if (onCancel) try { onCancel(); } catch (e) { console.error('Cancel action failed', e); }
        });
    }
    
    // Tunggu XLSX library ter-load
    function waitForXLSX(callback, attempt = 0) {
        if (typeof XLSX !== 'undefined') {
            callback();
        } else if (attempt < 50) {
            setTimeout(() => waitForXLSX(callback, attempt + 1), 100);
        } else {
            console.error('XLSX library gagal ter-load');
            showToast('<i class="bi bi-exclamation-circle-fill me-2" style="color: #dc3545;"></i>Library Excel gagal ter-load. Refresh halaman.', 'error');
        }

        // Realtime handlers (if realtime client loaded)
        if (typeof realtime !== 'undefined' && realtime) {
            realtime.on('connected', () => console.log('Realtime connected'));

            realtime.on('menus_updated', (menusData) => {
                try {
                    if (menusData && typeof menusData === 'object') {
                        Object.keys(menusData).forEach(k => { menus[k] = menusData[k]; });
                        saveMenusToStorage();
                    }
                    console.log('Menus updated via realtime');
                } catch (e) { console.error('Realtime menus_updated handler error', e); }
            });

            realtime.on('order_created', (data) => {
                try {
                    const order = data || {};
                    if (!order.id) order.id = Date.now().toString();
                    // Build card DOM safely (avoid embedding raw JSON into HTML attributes)
                    const card = document.createElement('div');
                    card.className = 'card mb-4';
                    card.style.cssText = 'border-left: 5px solid #17a2b8; border-radius: 8px;';

                    const cardBody = document.createElement('div');
                    cardBody.className = 'card-body';

                    const row = document.createElement('div');
                    row.className = 'row mb-3';

                    const left = document.createElement('div');
                    left.className = 'col-md-6';
                    left.innerHTML = `<p class="mb-1"><strong>👤 Nama Pembeli:</strong> ${order.buyerName}</p>
                                      <p class="mb-1"><strong>🪑 Nomor Meja:</strong> ${order.tableNumber}</p>
                                      <p class="mb-0"><strong>📅 ID Pesanan:</strong> <code>${order.id}</code></p>`;

                    const right = document.createElement('div');
                    right.className = 'col-md-6 text-md-end';
                    right.innerHTML = `<p class="mb-3">${statusBadge}</p>
                                       <p><strong>💰 Total:</strong> <span style="color: #17a2b8; font-size: 1.3rem; font-weight: bold;">${formatCurrency(order.total)}</span></p>`;

                    row.appendChild(left);
                    row.appendChild(right);
                    cardBody.appendChild(row);

                    const hr = document.createElement('hr');
                    cardBody.appendChild(hr);

                    const h6 = document.createElement('h6');
                    h6.className = 'fw-bold mb-3';
                    h6.innerHTML = '<i class="bi bi-list-check" style="color: #00a856; margin-right: 6px;"></i>Detail Item:';
                    cardBody.appendChild(h6);

                    const tableWrap = document.createElement('div');
                    tableWrap.className = 'table-responsive';
                    const table = document.createElement('table');
                    table.className = 'table table-sm mb-0';
                    table.innerHTML = `<thead style="background-color: #f8f9fb;"><tr>
                                                <th style="color: #1a3a52; font-weight: 600;">Nama Item</th>
                                                <th style="color: #1a3a52; font-weight: 600;">Kategori</th>
                                                <th style="color: #1a3a52; font-weight: 600;">Jumlah</th>
                                                <th class="text-end" style="color: #1a3a52; font-weight: 600;">Subtotal</th>
                                            </tr></thead><tbody>${itemsList}</tbody>`;
                    tableWrap.appendChild(table);
                    cardBody.appendChild(tableWrap);

                    const actionRow = document.createElement('div');
                    actionRow.className = 'mt-3 d-flex justify-content-between align-items-center';

                    const leftBadge = document.createElement('div');
                    leftBadge.innerHTML = qrisBadge;
                    actionRow.appendChild(leftBadge);

                    const actions = document.createElement('div');

                    const receiptBtn = document.createElement('button');
                    receiptBtn.type = 'button';
                    receiptBtn.className = 'btn btn-sm btn-outline-primary me-2';
                    receiptBtn.innerHTML = '<i class="bi bi-receipt me-1"></i>Lihat Struk';
                    receiptBtn.addEventListener('click', () => {
                        try { showReceiptModal(order); } catch (e) { console.error(e); }
                    });
                    actions.appendChild(receiptBtn);

                    if (order.paymentMethod === 'qris') {
                        const qrBtn = document.createElement('button');
                        qrBtn.type = 'button';
                        qrBtn.className = 'btn btn-sm btn-primary';
                        qrBtn.textContent = '🔍 Lihat QR';
                        qrBtn.addEventListener('click', () => {
                            try { showReceiptModal(order); } catch (e) { console.error(e); }
                        });
                        actions.appendChild(qrBtn);
                    }

                    actionRow.appendChild(actions);
                    cardBody.appendChild(actionRow);

                    card.appendChild(cardBody);
                    myOrdersContainer.appendChild(card);
                } catch (e) { console.error('Error creating order card:', e); }
            });
        }
    }

    // Safely reference submit button if present on the page
    const submitBtn = document.getElementById('submitBtn');
    const initialSubmitText = submitBtn ? submitBtn.textContent : 'Simpan Pesanan';
    let editingId = null;
    let cart = [];

    // Page detection flags (safe defaults) — avoids ReferenceError when elements missing
    const isOrderPage = !!document.getElementById('orderForm');
    const isListPage = !!document.getElementById('orderList') || !!document.getElementById('orderTable');
    const isMyOrdersPage = !!document.getElementById('myOrdersContainer') || !!document.getElementById('myOrders');

    // Debug info
    console.log('[SCRIPT] Script.js loaded - Page detection:', { isOrderPage, isListPage, isMyOrdersPage });

    // Menu data (diperbarui dari menu-bazar.txt)
    const menus = {
        Minum: [
            { name: "Kopi Pandan (Hot/Ice)", price: 28000 },
            { name: "Kopi Gula Aren (Hot/Ice)", price: 28000 },
            { name: "Cappuccino (Hot/Ice)", price: 25000 },
            { name: "Coffee Latte (Hot/Ice)", price: 25000 },
            { name: "Kopi Susu (Hot/Ice)", price: 25000 },
            { name: "Spanish Latte (Hot/Ice)", price: 25000 },
            { name: "Teh Tarik (Hot/Ice)", price: 25000 },
            { name: "Lemon Tea (Hot/Ice)", price: 25000 },
            { name: "Green Tea (Hot/Ice)", price: 25000 },
            { name: "Lychee Tea", price: 25000 },
            { name: "Es Teh Tawar", price: 18000 },
            { name: "Es Teh Manis", price: 20000 },
            { name: "Coklat (Hot/Ice)", price: 25000 },
            { name: "Milo (Hot/Ice)", price: 27000 },
            { name: "Soda Gembira", price: 27000 },
            { name: "Mango Soda", price: 28000 },
            { name: "Mango Yakult", price: 28000 },
            { name: "Lychee Yakult", price: 28000 },
            { name: "Strawberry Yakult", price: 28000 },
            { name: "Oreo Frappe Blend", price: 28000 },
            { name: "Pink Lava", price: 28000 },
            { name: "Juice Markisa", price: 28000 },
            { name: "Juice Jeruk", price: 28000 },
            { name: "Juice Mangga", price: 28000 },
            { name: "Juice Alpukat", price: 28000 },
            { name: "Juice Sirsak", price: 25000 },
            { name: "Kuku Bima Susu", price: 25000 },
            { name: "Extra Joss Susu", price: 10000 },
            { name: "Air Mineral", price: 18000 },
            { name: "Fanta", price: 16000 }
        ],
        Makan: [
            { name: "Nasi Goreng Merah", price: 27000 },
            { name: "Nasi Goreng Jakarta", price: 28000 },
            { name: "Nasi Goreng Special", price: 30000 },
            { name: "Nasi Ayam Lalapan", price: 35000 },
            { name: "Chicken Teriyaki", price: 35000 },
            { name: "Nasi Putih", price: 15000 },
            { name: "Mie Bakso", price: 28000 },
            { name: "Bakso", price: 28000 },
            { name: "Mie Goreng Jawa", price: 27000 },
            { name: "Spaghetti Sausage", price: 30000 },
            { name: "Kwetiau Goreng", price: 28000 },
            { name: "Kwetiau Kuah", price: 28000 },
            { name: "Bakso Goreng", price: 25000 },
            { name: "Donat Kentang Mix Rasa", price: 25000 },
            { name: "Ubi Goreng", price: 25000 },
            { name: "Lumpia Goreng", price: 25000 },
            { name: "Pisang Goreng Ori", price: 25000 },
            { name: "Pisgor Coklat + Keju", price: 28000 },
            { name: "Pisgor Strawberry + Keju", price: 28000 },
            { name: "Pisgor Greentea + Keju", price: 28000 },
            { name: "Chicken Wings", price: 30000 },
            { name: "Snack Platter", price: 28000 },
            { name: "Kentang Goreng", price: 25000 },
            { name: "Burger Sapi", price: 30000 },
            { name: "Indomie + Bakso", price: 23000 },
            { name: "Indomie + Sosis", price: 23000 },
            { name: "Indomie + Nugget", price: 23000 },
            { name: "Indomie + Telur", price: 23000 }
        ]
    };

    // Load saved menus from localStorage if present; otherwise persist defaults
    try {
        const saved = localStorage.getItem('siteMenus');
        if (saved) {
            const parsed = JSON.parse(saved);
            for (const k in parsed) {
                menus[k] = parsed[k];
            }
            console.log('[MENUS] Loaded from localStorage:', Object.keys(menus).map(k => k + '(' + menus[k].length + ')').join(', '));
        } else {
            localStorage.setItem('siteMenus', JSON.stringify(menus));
            console.log('[MENUS] Saved defaults to localStorage:', Object.keys(menus).map(k => k + '(' + menus[k].length + ')').join(', '));
        }
    } catch (e) {
        console.error('Gagal memuat atau menyimpan siteMenus:', e);
    }

    // Expose helper to save menus from other pages (admin)
    function saveMenusToStorage() {
        try {
            localStorage.setItem('siteMenus', JSON.stringify(menus));
            // touch timestamp to trigger storage event in some browsers
            localStorage.setItem('siteMenusUpdatedAt', String(Date.now()));
        } catch (e) {
            console.error('Gagal menyimpan siteMenus:', e);
        }
    }
    window.saveMenusToStorage = saveMenusToStorage;
    window.menus = menus; // expose for debugging/admin pages

    // Safe helper to fetch menus from API if available
    async function fetchMenusFromAPI() {
        // Prefer existing apiCall helper if present
        if (typeof apiCall === 'function') {
            try {
                const res = await apiCall('menus');
                if (res && res.ok) return res.data || null;
                return null;
            } catch (e) {
                throw e;
            }
        }

        // Fallback to direct fetch if available
        try {
            // Prefer getApiUrl() if available, otherwise use API_CONFIG.baseUrl when present
            // Fallback to localhost:3000 if no API helper is available (frontend server runs on :8000)
            let url = null;
            if (typeof getApiUrl === 'function') {
                url = getApiUrl('menus');
            } else if (window.API_CONFIG && API_CONFIG.baseUrl) {
                url = API_CONFIG.baseUrl + (API_CONFIG.endpoints && API_CONFIG.endpoints.menus ? API_CONFIG.endpoints.menus : '/api/menus');
            } else {
                // Construct fallback base URL
                let base = 'http://localhost:3000';
                try {
                    const host = window.location.hostname;
                    if (host && host !== 'localhost' && host !== '127.0.0.1') {
                        base = window.location.protocol + '//' + host + ':3000';
                    }
                } catch (e) {
                    // ignore and use default
                }
                url = base + '/api/menus';
            }
            const r = await fetch(url, { credentials: 'include' });
            const ct = (r.headers.get && r.headers.get('content-type') || '').toLowerCase();
            if (r.ok && ct.includes('application/json')) {
                return await r.json();
            }
            return null;
        } catch (e) {
            throw e;
        }
    }

    // Try to load menus from API on startup
    (async function loadMenusFromAPI() {
        try {
            const apiMenus = await fetchMenusFromAPI();
            if (apiMenus && Object.keys(apiMenus).length > 0) {
                // Merge API menus with defaults (API takes priority)
                Object.assign(menus, apiMenus);
                saveMenusToStorage();
                console.log('Menus loaded from API');
            }
        } catch (e) {
            console.log('Failed to fetch menus from API (this is ok, will use defaults):', e.message);
        }
    })();

    // Helper functions
    function formatCurrency(n) {
        return n.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });
    }

    function clientIsAdmin() {
        return sessionStorage.getItem('isAdmin') === '1';
    }

    // Hide "Daftar Pesanan" nav links for non-admin users
    (function hideDaftarLinksIfNotAdmin() {
        try {
            const isAdmin = clientIsAdmin();
            const selector = 'a[href="daftar.html"], a[href="./daftar.html"], a[href="/daftar.html"]';
            document.querySelectorAll(selector).forEach(a => {
                if (!isAdmin) a.style.display = 'none';
            });
        } catch (e) {
            console.error('Error hiding daftar links:', e);
        }
    })();

    function getOrders() {
        // Orders should come from API if available, fallback to localStorage
        try {
            const orders = JSON.parse(localStorage.getItem('orders')) || [];
            return orders.filter(o => o && o.items && Array.isArray(o.items));
        } catch (e) {
            console.error('Gagal parse orders:', e);
            return [];
        }
    }

    function saveOrders(orders) {
        try {
            localStorage.setItem('orders', JSON.stringify(orders));
        } catch (e) {
            console.error('Gagal simpan orders:', e);
        }
    }

    // Save order to API as well
    async function saveOrderViaAPI(orderData) {
        try {
            const id = await createOrderViaAPI(orderData);
            if (id) {
                console.log('Order saved to API with ID:', id);
                return id;
            }
        } catch (e) {
            console.error('Failed to save order to API:', e);
        }
        return null;
    }

    // Generate unique receipt number
    function generateReceiptNumber() {
        const date = new Date();
        const dateStr = date.getFullYear().toString().slice(-2) + 
                       String(date.getMonth() + 1).padStart(2, '0') + 
                       String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `RCP-${dateStr}-${random}`;
    }

    // Generate receipt HTML
    function generateReceiptHTML(order, receiptNumber) {
        const date = new Date(order.createdAt || Date.now());
        const dateStr = date.toLocaleDateString('id-ID', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        let itemsHTML = '';
        const items = order.items || [];
        items.forEach(item => {
            const subtotal = (item.price * item.quantity);
            itemsHTML += `
                <tr style="border-bottom: 1px solid #f0f0f0;">
                    <td style="padding: 6px 0; text-align: left; font-size: 11px;">${item.itemName || item.name}</td>
                    <td style="padding: 6px 0; text-align: center; font-size: 11px;">${item.quantity}x</td>
                    <td style="padding: 6px 0; text-align: right; font-size: 11px;">Rp${(item.price || 0).toLocaleString('id-ID')}</td>
                    <td style="padding: 6px 0; text-align: right; font-size: 11px;">Rp${subtotal.toLocaleString('id-ID')}</td>
                </tr>
            `;
        });

        const paymentMethod = order.paymentMethod === 'qris' ? '<i class="bi bi-qr-code me-1"></i> QRIS' : '<i class="bi bi-cash-coin me-1"></i> Tunai';
        
        return `
            <div class="receipt-content" style="max-width: 400px; width: 100%; margin: 0 auto; font-family: 'Courier New', monospace; background: white; padding: 0;">
                
                <!-- HEADER -->
                <div style="text-align: center; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 2px solid #333;">
                    <h3 style="margin: 0 0 4px 0; color: #1a3a52; font-size: 14px; font-weight: 700;">STRUK PEMESANAN</h3>
                    <p style="margin: 0; color: #666; font-size: 11px;">Himpunan Mahasiswa Islam</p>
                </div>
                
                <!-- INFO STRUK -->
                <div style="margin-bottom: 12px; font-size: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>No. Struk</span>
                        <span style="font-weight: 600;">${receiptNumber}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>Tanggal</span>
                        <span>${dateStr}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>Pembeli</span>
                        <span>${order.buyerName || '-'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Meja</span>
                        <span>${order.tableNumber || '-'}</span>
                    </div>
                </div>
                
                <div style="border-top: 1px dashed #999; border-bottom: 1px dashed #999; padding: 10px 0; margin: 10px 0;">
                
                    <!-- ITEMS TABLE -->
                    <table style="width: 100%; font-size: 10px; margin: 0; padding: 0; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 1px solid #333;">
                                <th style="text-align: left; padding: 4px 0; font-weight: 700; font-size: 11px;">Item</th>
                                <th style="text-align: center; padding: 4px 0; font-weight: 700; font-size: 11px; width: 20px;">Qty</th>
                                <th style="text-align: right; padding: 4px 0; font-weight: 700; font-size: 11px; width: 60px;">Harga</th>
                                <th style="text-align: right; padding: 4px 0; font-weight: 700; font-size: 11px; width: 70px;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHTML}
                        </tbody>
                    </table>
                </div>
                
                <!-- TOTAL & PEMBAYARAN -->
                <div style="margin: 12px 0; font-size: 11px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px dashed #999;">
                        <span style="font-weight: 700;">TOTAL PESANAN</span>
                        <span style="font-weight: 700; color: #1a3a52; font-size: 13px;">Rp${(order.total || 0).toLocaleString('id-ID')}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Pembayaran</span>
                        <span style="font-weight: 600;">${paymentMethod}</span>
                    </div>
                </div>
                
                <!-- FOOTER -->
                <div style="text-align: center; font-size: 10px; color: #666; margin-top: 12px; padding-top: 10px; border-top: 2px solid #333;">
                    <p style="margin: 0 0 3px 0;">Terimakasih telah berbelanja</p>
                    <p style="margin: 0;">Himpunan Mahasiswa Islam 2024</p>
                </div>
            </div>
        `;
    }

    // Show receipt modal
    function showReceiptModal(order) {
        const receiptNumber = order.receiptNumber || generateReceiptNumber();
        const receiptHTML = generateReceiptHTML(order, receiptNumber);
        
        // Create modal if not exists
        let modal = document.getElementById('receiptModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'receiptModal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            `;
            document.body.appendChild(modal);
        }
        
        // Build EMVCo-style QRIS payload and image URL
        function tlv(id, value) {
            const len = String(value.length).padStart(2, '0');
            return id + len + value;
        }

        function crc16ccitt(str) {
            let crc = 0xFFFF;
            for (let i = 0; i < str.length; i++) {
                crc ^= str.charCodeAt(i) << 8;
                for (let j = 0; j < 8; j++) {
                    if ((crc & 0x8000) !== 0) crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
                    else crc = (crc << 1) & 0xFFFF;
                }
            }
            return crc.toString(16).toUpperCase().padStart(4, '0');
        }

        function formatAmount(n) {
            if (!n && n !== 0) return '';
            return Number(n).toFixed(2);
        }

        function buildEMVQRPayload(o, receipt) {
                // Default NMID; prefer server-provided setting if available
                const nm = (o.nmid || (window.serverSettings && window.serverSettings.QRIS_MERCHANT_NMID) || 'ID1025389810363').toString();
                const merchantName = (window.serverSettings && window.serverSettings.MERCHANT_NAME) || 'Himpunan Mahasiswa Islam';
                const merchantCity = (window.serverSettings && window.serverSettings.MERCHANT_CITY) || 'MAKASSAR';

            // For static QRIS we set Point of Initiation = '11' and omit amount
            // so the generated QR is a static merchant QR that can be scanned
            // without pre-filled amount (payer can enter amount in their app).
            // Merchant Account Information (tag 29) — using sub tags: 00=GUI, 01=NMID
            const mai = tlv('00', 'ID.CO.QRIS') + tlv('01', nm);

            let payload = '';
            payload += tlv('00', '01'); // Payload Format Indicator
            payload += tlv('01', '11'); // Point of Initiation Method (11 = static)
            payload += tlv('29', mai);
            payload += tlv('52', '0000'); // Merchant Category Code (0000 placeholder)
            payload += tlv('53', '360'); // Currency: IDR = 360
            // For static QR we intentionally do NOT include tag 54 (amount)
            payload += tlv('58', 'ID');
            payload += tlv('59', merchantName);
            payload += tlv('60', merchantCity);
            // Additional data field template (62) with receipt/reference in sub tag 01
            const addData = tlv('01', receipt);
            payload += tlv('62', addData);

            // Append CRC placeholder and calculate CRC16-CCITT
            const crcPayload = payload + '6304';
            const crc = crc16ccitt(crcPayload);
            payload += tlv('63', crc);
            return payload;
        }

        function getQRImageURL(payload) {
            return 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(payload);
        }

        let extraQRSection = '';
        try {
            if (order.paymentMethod === 'qris') {
                // Use static QRIS image for all orders
                const staticQrisPath = 'assets/img/qris-static.png';
                const merchantName = (window.serverSettings && window.serverSettings.MERCHANT_NAME) || 'Himpunan Mahasiswa Islam';
                const merchantCity = (window.serverSettings && window.serverSettings.MERCHANT_CITY) || 'Makassar';
                const nmid = (window.serverSettings && window.serverSettings.QRIS_MERCHANT_NMID) || 'ID1025389810363';
                
                // Create image with error fallback to styled merchant info
                extraQRSection = `
                    <div style="margin: 15px 0; padding: 12px 0; border-top: 1px dashed #999;">
                        <p style="text-align: center; margin: 0 0 8px 0; font-weight: 600; font-size: 11px; color: #1a3a52;"><i class="bi bi-qr-code me-1"></i> SCAN QRIS</p>
                        <p style="text-align: center; margin: 0 0 10px 0; font-size: 9px; color: #666;">Gunakan GoPay, OVO, Dana</p>
                        
                        <div style="position: relative; display: flex; justify-content: center; width: 100%;">
                            <img id="qrisImageReceipt" src="${staticQrisPath}" alt="QRIS Code" style="max-width: 180px; display: block; border-radius: 6px; border: 1px solid #ddd;" onerror="this.style.display='none'; document.getElementById('qrisPlaceholder_${receiptNumber}').style.display='block';"/>
                            <div id="qrisPlaceholder_${receiptNumber}" style="max-width: 180px; padding: 12px; background: linear-gradient(135deg, #1a3a52 0%, #2d5a7b 100%); border-radius: 6px; border: 1px solid #00a856; display: none; font-size: 10px; color: white; text-align: center;">
                                <p style="margin: 4px 0; font-weight: 700; font-size: 11px;"><i class="bi bi-qr-code me-1" style="color: #00a856;"></i> QRIS</p>
                                <div style="background: white; padding: 6px; border-radius: 4px; margin: 6px 0; font-size: 9px;">
                                    <p style="margin: 2px 0; color: #1a3a52; font-weight: 600;">${merchantName}</p>
                                    <p style="margin: 2px 0; color: #1a3a52;">NMID: ${nmid}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div style="text-align: center; font-size: 9px; color: #666; margin-top: 8px;">
                            <p style="margin: 2px 0;"><strong>Merchant:</strong> ${merchantName}</p>
                            <p style="margin: 2px 0;"><strong>NMID:</strong> ${nmid}</p>
                        </div>
                    </div>
                `;
            }
        } catch (e) {
            console.error('Gagal tampilkan QRIS:', e);
        }

        modal.innerHTML = `
            <div style="background: white; border-radius: 8px; max-width: 500px; width: 95%; max-height: 90vh; overflow-y: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 2px solid #f0f0f0;">
                    <h5 style="margin: 0; font-size: 14px; font-weight: 700; color: #1a3a52;"><i class="bi bi-receipt me-2" style="color: #00a856;"></i>Struk Pesanan</h5>
                    <button type="button" onclick="document.getElementById('receiptModal').style.display='none'" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #999; transition: color 0.2s;"><i class="bi bi-x-lg"></i></button>
                </div>
                <div style="padding: 16px;">
                    ${receiptHTML}
                    ${extraQRSection}
                </div>
                <div style="display: flex; gap: 10px; padding: 12px 16px; border-top: 1px solid #f0f0f0; background: #f9f9f9;">
                    <button onclick="window.print()" style="flex: 1; background: linear-gradient(135deg, #00a856 0%, #007a42 100%); color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 11px; transition: background 0.2s;"><i class="bi bi-printer me-1"></i>Cetak</button>
                    <button onclick="document.getElementById('receiptModal').style.display='none'" style="flex: 1; background: #6c757d; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 11px; transition: background 0.2s;">Tutup</button>
                </div>
                <style>
                    @page { size: 80mm auto; margin: 3mm; }
                    @media print {
                        body * { visibility: hidden !important; }
                        #receiptModal, #receiptModal * { visibility: visible !important; }
                        #receiptModal { position: fixed !important; left: 0 !important; top: 0 !important; width: 100% !important; height: 100% !important; display: block !important; background: white !important; z-index: 10000 !important; }
                        #receiptModal > div { margin: 0 auto !important; box-shadow: none !important; width: 80mm !important; max-width: 100% !important; border-radius: 0 !important; max-height: 100% !important; }
                        #receiptModal > div > div:first-child { display: none !important; }
                        #receiptModal > div > div:last-child { display: none !important; }
                        .receipt-content { width: 100% !important; padding: 6mm !important; background: transparent !important; border: none !important; }
                        img { max-width: 100% !important; height: auto !important; }
                        button { display: none !important; }
                    }
                </style>
            </div>
        `;
        modal.style.display = 'flex';

        // Wire up copy button (if present)
        const copyBtn = document.getElementById('copyQrisPayloadBtn');
        const payloadArea = document.getElementById('qrisPayloadArea');
        if (copyBtn && payloadArea) {
            copyBtn.addEventListener('click', () => {
                try {
                    payloadArea.style.display = 'block';
                    payloadArea.select();
                    document.execCommand('copy');
                    payloadArea.style.display = 'none';
                    showToast('<i class="bi bi-check-circle-fill" style="color: #28a745; margin-right: 6px;"></i>Payload QRIS disalin ke clipboard', 'success');
                } catch (e) {
                    console.error('Copy payload failed', e);
                    showToast('<i class="bi bi-exclamation-circle-fill" style="color: #dc3545; margin-right: 6px;"></i>Gagal menyalin payload', 'error');
                }
            });
        }
    }

    // Expose to global scope so inline `onclick` handlers can call it
    window.showReceiptModal = showReceiptModal;

    // Halaman Pesan (pesan.html)
    if (isOrderPage) {
        console.log('[OK] Initializing Order Page...');
        const categorySelect = document.getElementById('category');
        const itemSelect = document.getElementById('itemSelect');
        const priceDisplay = document.getElementById('priceDisplay');
        const totalDisplay = document.getElementById('totalDisplay');
        const qtyInput = document.getElementById('quantity');
        const addToCartBtn = document.getElementById('addToCartBtn');
        const cartList = document.getElementById('cartList');
        const cartTotalEl = document.getElementById('cartTotal');
        const tableSelect = document.getElementById('tableNumber');
        const orderForm = document.getElementById('orderForm');
        const buyerInput = document.getElementById('buyerName');
        
        console.log('[DOM] Elements:', { 
            categorySelect: !!categorySelect, 
            itemSelect: !!itemSelect, 
            tableSelect: !!tableSelect,
            orderForm: !!orderForm
        });

        // If someone requested to edit an existing order, only allow it for admin
        const editingJson = localStorage.getItem('editingOrder');
        if (editingJson) {
            try {
                const editingOrder = JSON.parse(editingJson);
                if (!clientIsAdmin()) {
                    showToast('Hanya admin yang dapat mengedit pesanan. Silakan login sebagai admin.', 'error');
                    localStorage.removeItem('editingOrder');
                } else {
                    editingId = editingOrder.id || null;
                    cart = (editingOrder.items || []).map(it => ({ category: it.category, itemName: it.itemName, price: it.price, quantity: it.quantity, subtotal: it.subtotal }));
                    if (buyerInput) buyerInput.value = editingOrder.buyerName || '';
                    if (tableSelect) tableSelect.value = editingOrder.tableNumber || '';
                    updateCartDisplay();
                    if (submitBtn) submitBtn.textContent = 'Simpan Perubahan';
                    localStorage.removeItem('editingOrder');
                }
            } catch (err) {
                console.error('Invalid editingOrder data', err);
                localStorage.removeItem('editingOrder');
            }
        }

        function populateItemsForCategory(cat, filter = '') {
            if (!itemSelect) return;
            // Tetap populate select untuk backup, tapi hidden dari UI
            itemSelect.innerHTML = '<option value="">Pilih item</option>';
            if (priceDisplay) priceDisplay.textContent = '-';
            if (totalDisplay) totalDisplay.textContent = '-';
            if (!cat || !menus[cat]) {
                console.warn('[POPULATE] Category not found or empty:', cat, 'Available:', Object.keys(menus));
                return;
            }
            console.log('[POPULATE] Populating items for category:', cat, 'Count:', menus[cat].length);
            const q = String(filter || '').toLowerCase();
            let added = 0;
            menus[cat].forEach((it, idx) => {
                const status = it.outOfStock ? ' (Habis)' : '';
                const label = `${it.name}${status} — ${formatCurrency(it.price)}`;
                const match = !q || it.name.toLowerCase().includes(q) || String(it.price).includes(q) || label.toLowerCase().includes(q);
                if (!match) return;
                const opt = document.createElement('option');
                opt.value = String(idx);
                opt.textContent = label;
                if (it.outOfStock) opt.disabled = true;
                itemSelect.appendChild(opt);
                added++;
            });
            console.log('[POPULATE] Items added to dropdown:', added);
            if (added === 0) {
                const none = document.createElement('option');
                none.value = '';
                none.textContent = 'Tidak ada item yang cocok';
                none.disabled = true;
                itemSelect.appendChild(none);
            }
            itemSelect.selectedIndex = 0;
        }

        function renderSearchResults(cat, filter = '') {
            const searchResults = document.getElementById('searchResults');
            if (!searchResults) return;
            searchResults.innerHTML = '';
            const q = String(filter || '').toLowerCase();

            if (!q || !cat || !menus[cat]) {
                searchResults.style.display = 'none';
                return;
            }

            const results = [];
            menus[cat].forEach((it, idx) => {
                const status = it.outOfStock ? ' (Habis)' : '';
                const label = `${it.name}${status} — ${formatCurrency(it.price)}`;
                const match = it.name.toLowerCase().includes(q) || String(it.price).includes(q) || label.toLowerCase().includes(q);
                if (match) results.push({ idx, name: it.name, price: it.price, label, outOfStock: !!it.outOfStock });
            });

            if (results.length === 0) {
                const none = document.createElement('div');
                none.className = 'list-group-item text-muted text-center';
                none.textContent = 'Tidak ada hasil';
                searchResults.appendChild(none);
                searchResults.style.display = 'block';
                return;
            }

            results.forEach((res, i) => {
                const item = document.createElement('button');
                item.type = 'button';
                item.className = 'list-group-item list-group-item-action';
                item.dataset.index = String(i);
                item.dataset.menuIndex = String(res.idx);
                
                // Highlight matching text
                const text = res.label;
                const highlighted = text.replace(
                    new RegExp(`(${q})`, 'gi'),
                    '<mark style="background-color:#ffeb3b; font-weight:bold;">$1</mark>'
                );
                
                item.innerHTML = highlighted;
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (res.outOfStock) {
                        showToast('Item ini sedang habis/tidak tersedia.', 'error');
                        return;
                    }
                    selectSearchResult(res.idx);
                });
                searchResults.appendChild(item);
            });
            searchResults.style.display = 'block';
            searchResults.dataset.selectedIndex = '-1'; // Track selected index
        }

        function selectSearchResult(menuIdx) {
            const cat = categorySelect ? categorySelect.value : '';
            if (!cat || !menus[cat] || !menus[cat][menuIdx]) {
                showToast('Item tidak valid atau kategori belum dipilih.', 'error');
                return;
            }
            
            // Set nilai di itemSelect (untuk menampilkan di dropdown)
            if (itemSelect) {
                itemSelect.value = String(menuIdx);
                itemSelect.dispatchEvent(new Event('change'));
            }
            
            // Clear search dan tutup dropdown
            if (itemSearch) itemSearch.value = '';
            if (searchResults) searchResults.style.display = 'none';
            
            // Update harga dan total berdasarkan item yang dipilih
            updatePriceAndTotal();
            
            // Fokus ke input jumlah agar user bisa langsung atur jumlah
            if (qtyInput) qtyInput.focus();
        }

        function updatePriceAndTotal() {
            if (!categorySelect || !itemSelect || !qtyInput) return;
            const cat = categorySelect.value;
            const idx = itemSelect.value;
            const qty = parseInt(qtyInput.value, 10) || 0;
            if (!cat || idx === "" || !menus[cat] || !menus[cat][idx]) {
                if (priceDisplay) priceDisplay.textContent = '-';
                if (totalDisplay) totalDisplay.textContent = '-';
                return;
            }
            const price = menus[cat][idx].price;
            if (priceDisplay) priceDisplay.textContent = formatCurrency(price);
            if (totalDisplay) totalDisplay.textContent = qty > 0 ? formatCurrency(price * qty) : '-';
        }

        function addToCart() {
            if (!categorySelect || !itemSelect || !qtyInput) return;
            const cat = categorySelect.value;
            const idx = itemSelect.value;
            const qty = parseInt(qtyInput.value, 10);

            if (!cat || idx === "" || !Number.isInteger(qty) || qty <= 0) {
                showToast('Pilih kategori, item dan masukkan jumlah valid (>0).', 'error');
                return;
            }

            const itemObj = menus[cat][idx];
            if (itemObj.outOfStock) {
                showToast('Item ini sedang habis/tidak dapat dipesan.', 'error');
                return;
            }
            const itemName = itemObj.name;
            const price = itemObj.price;
            const subtotal = price * qty;

            const existing = cart.find(ci => ci.category === cat && ci.itemName === itemName);
            if (existing) {
                existing.quantity += qty;
                existing.subtotal = existing.price * existing.quantity;
            } else {
                cart.push({ category: cat, itemName, price, quantity: qty, subtotal });
            }
            updateCartDisplay();
            itemSelect.selectedIndex = 0;
            qtyInput.value = '1';
            updatePriceAndTotal();
        }

        function updateCartDisplay() {
            if (!cartList || !cartTotalEl) return;
            cartList.innerHTML = '';
            let total = 0;
            cart.forEach((ci, index) => {
                total += ci.subtotal;
                const tr = document.createElement('tr');

                const tdItem = document.createElement('td');
                tdItem.textContent = `${ci.itemName} (${ci.category})`;
                tr.appendChild(tdItem);

                const tdPrice = document.createElement('td');
                tdPrice.textContent = formatCurrency(ci.price);
                tr.appendChild(tdPrice);

                const tdQty = document.createElement('td');
                tdQty.textContent = ci.quantity;
                tr.appendChild(tdQty);

                const tdSubtotal = document.createElement('td');
                tdSubtotal.textContent = formatCurrency(ci.subtotal);
                tr.appendChild(tdSubtotal);

                const tdActions = document.createElement('td');
                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'delete-btn';
                removeBtn.textContent = 'Hapus';
                removeBtn.addEventListener('click', () => {
                    cart.splice(index, 1);
                    updateCartDisplay();
                });
                tdActions.appendChild(removeBtn);
                tr.appendChild(tdActions);

                cartList.appendChild(tr);
            });
            cartTotalEl.textContent = total > 0 ? formatCurrency(total) : '-';
        }

        const itemSearch = document.getElementById('itemSearch');
        const clearSearch = document.getElementById('clearSearch');
        const searchResults = document.getElementById('searchResults');

        if (categorySelect) {
            categorySelect.addEventListener('change', () => {
                const q = itemSearch ? itemSearch.value.trim() : '';
                populateItemsForCategory(categorySelect.value, q);
                renderSearchResults(categorySelect.value, q);
            });
        }
        if (itemSearch) {
            itemSearch.addEventListener('input', () => {
                const q = itemSearch.value.trim();
                populateItemsForCategory(categorySelect.value, q);
                renderSearchResults(categorySelect.value, q);
            });

            itemSearch.addEventListener('keydown', (e) => {
                if (!searchResults || searchResults.style.display === 'none') return;
                const items = searchResults.querySelectorAll('button.list-group-item');
                let selected = parseInt(searchResults.dataset.selectedIndex || '-1');

                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    selected = Math.min(selected + 1, items.length - 1);
                    updateSearchResultHighlight(items, selected);
                    searchResults.dataset.selectedIndex = String(selected);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    selected = Math.max(selected - 1, 0);
                    updateSearchResultHighlight(items, selected);
                    searchResults.dataset.selectedIndex = String(selected);
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (selected >= 0 && items[selected]) {
                        const menuIdx = parseInt(items[selected].dataset.menuIndex);
                        selectSearchResult(menuIdx);
                    }
                }
            });

            // Listen for menu updates from admin page (storage events)
            window.addEventListener('storage', (ev) => {
                if (ev.key === 'siteMenus' || ev.key === 'siteMenusUpdatedAt') {
                    try {
                        const parsed = JSON.parse(localStorage.getItem('siteMenus') || '{}');
                        for (const k in parsed) menus[k] = parsed[k];
                    } catch (e) { console.error('Failed reload menus from storage', e); }
                    // refresh current UI
                    const q = itemSearch ? itemSearch.value.trim() : '';
                    if (categorySelect) populateItemsForCategory(categorySelect.value, q);
                    if (searchResults) renderSearchResults(categorySelect.value, q);
                    updateCartDisplay();
                }
            });

            // Keyboard shortcut: press '/' to focus the search box (unless typing in an input)
            document.addEventListener('keydown', (e) => {
                if (e.key === '/') {
                    const active = document.activeElement;
                    const tag = active && active.tagName ? active.tagName.toLowerCase() : '';
                    if (tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
                        e.preventDefault();
                        itemSearch.focus();
                        if (itemSearch.select) itemSearch.select();
                    }
                }
            });
        }
        if (clearSearch) {
            clearSearch.addEventListener('click', () => {
                if (itemSearch) itemSearch.value = '';
                populateItemsForCategory(categorySelect.value, '');
                renderSearchResults(categorySelect.value, '');
                if (itemSearch) itemSearch.focus();
            });
        }
        if (itemSelect) {
            itemSelect.addEventListener('change', updatePriceAndTotal);
        }
        // Close search results when clicking outside
        if (searchResults) {
            document.addEventListener('click', (e) => {
                if (!itemSearch.contains(e.target) && !searchResults.contains(e.target)) {
                    searchResults.style.display = 'none';
                }
            });
        }

        function updateSearchResultHighlight(items, selectedIndex) {
            items.forEach((item, idx) => {
                if (idx === selectedIndex) {
                    item.classList.add('active');
                    item.scrollIntoView({ block: 'nearest' });
                } else {
                    item.classList.remove('active');
                }
            });
        }
        if (qtyInput) {
            qtyInput.addEventListener('input', updatePriceAndTotal);
        }
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', addToCart);
        }

        // Populate table numbers
        if (tableSelect) {
            console.log('[TABLE] Populating table numbers...');
            tableSelect.innerHTML = '<option value="">Pilih nomor meja</option>';
            for (let i = 1; i <= 20; i++) {
                const opt = document.createElement('option');
                opt.value = String(i);
                opt.textContent = 'Meja ' + i;
                tableSelect.appendChild(opt);
            }
            const optTake = document.createElement('option');
            optTake.value = 'Takeaway';
            optTake.textContent = 'Takeaway';
            tableSelect.appendChild(optTake);
            console.log('[OK] Table numbers populated successfully! Total options:', tableSelect.options.length);
        } else {
            console.error('[ERROR] Table select element not found!');
        }
        
        // Initialize category select with default value
        if (categorySelect && categorySelect.value === '') {
            categorySelect.value = 'Minum';
            console.log('[INIT] Default category set to: Minum');
        }
        
        // Display menus available
        console.log('=== Available menus:', Object.keys(menus).map(k => k + ' (' + menus[k].length + ' items)').join(', '));

        // Form submission
        const paymentMethodSelect = document.getElementById('paymentMethod');
        if (orderForm) {
            orderForm.addEventListener('submit', async function(e) {
                e.preventDefault();
            const buyerName = buyerInput ? buyerInput.value.trim() : '';
                const tableNumber = tableSelect ? (tableSelect.value || '') : '';
                const paymentMethod = paymentMethodSelect ? (paymentMethodSelect.value || '') : '';

                if (!buyerName) {
                    showToast('<i class="bi bi-exclamation-circle-fill me-2" style="color: #dc3545;"></i>Masukkan nama pembeli.', 'error');
                    if (buyerInput) buyerInput.focus();
                    return;
                }
                if (!tableNumber) {
                    showToast('<i class="bi bi-exclamation-circle-fill me-2" style="color: #dc3545;"></i>Pilih nomor meja atau Takeaway.', 'error');
                    if (tableSelect) tableSelect.focus();
                    return;
                }
                if (!paymentMethod) {
                    showToast('<i class="bi bi-exclamation-circle-fill me-2" style="color: #dc3545;"></i>Pilih metode pembayaran.', 'error');
                    if (paymentMethodSelect) paymentMethodSelect.focus();
                    return;
                }
                if (!cart.length) {
                    showToast('<i class="bi bi-exclamation-circle-fill me-2" style="color: #dc3545;"></i>Keranjang kosong. Tambahkan item ke keranjang.', 'error');
                    return;
                }

                try {
                    const orders = getOrders();
                    const clonedItems = cart.map(it => ({ category: it.category, itemName: it.itemName, price: it.price, quantity: it.quantity, subtotal: it.subtotal }));
                    const total = clonedItems.reduce((s, it) => s + it.subtotal, 0);
                    const receiptNumber = generateReceiptNumber();

                    if (editingId) {
                        // Update existing order (admin only - also validated earlier)
                        const idx = orders.findIndex(o => o.id === editingId);
                        if (idx !== -1) {
                            const prevCompleted = orders[idx].completed || false;
                            orders[idx] = { id: editingId, buyerName, tableNumber, items: clonedItems, total, paymentMethod, receiptNumber, completed: prevCompleted };
                            saveOrders(orders);
                            showToast('<i class="bi bi-check-circle-fill me-2" style="color: #28a745;"></i>Perubahan pesanan berhasil disimpan!', 'success');
                        } else {
                            showToast('<i class="bi bi-exclamation-circle-fill me-2" style="color: #dc3545;"></i>Pesanan yang diedit tidak ditemukan.', 'error');
                        }
                        editingId = null;
                        if (submitBtn) submitBtn.textContent = initialSubmitText;
                    } else {
                        const id = Date.now().toString();
                        const orderData = { buyerName, tableNumber, items: clonedItems, total, paymentMethod, receiptNumber, completed: false };
                        const newOrder = { id, ...orderData };
                        orders.push(newOrder);
                        saveOrders(orders);
                        
                        // Also save to API
                        await saveOrderViaAPI(orderData);
                        
                        showToast('<i class="bi bi-check-circle-fill me-2" style="color: #28a745;"></i>Pesanan berhasil disimpan!', 'success');
                        
                        // Show receipt after saving
                        setTimeout(() => {
                            showReceiptModal(newOrder);
                        }, 500);
                    }

                    orderForm.reset();
                    cart = [];
                    updateCartDisplay();
                    if (categorySelect) {
                        categorySelect.value = 'Minum';
                        populateItemsForCategory('Minum');
                    }
                    if (tableSelect) tableSelect.value = '';
                    if (paymentMethodSelect) paymentMethodSelect.value = '';
                } catch (err) {
                    console.error('Error:', err);
                    showToast('<i class="bi bi-exclamation-circle-fill me-2" style="color: #dc3545;"></i>Terjadi kesalahan: ' + err.message, 'error');
                }
            });
        }

        // Inisialisasi
        if (categorySelect) {
            console.log('[INIT] Initializing category select. Available menus:', Object.keys(menus));
            categorySelect.value = 'Minum';
            populateItemsForCategory('Minum');
            console.log('[INIT] Category initialized to Minum');
        }
    }

    // Halaman Daftar (daftar.html)
    if (isListPage) {
        const orderList = document.getElementById('orderList');
        const noOrdersMsg = document.getElementById('noOrdersMsg');
        const orderTable = document.getElementById('orderTable');
        const exportBtn = document.getElementById('exportBtn');
        const importBtn = document.getElementById('importBtn');
        const importFile = document.getElementById('importFile');
        function loadOrders() {
            const orders = getOrders();
            if (!orderList) return;
            orderList.innerHTML = '';

            const isAdmin = clientIsAdmin();
            if (!isAdmin) {
                if (orderTable) orderTable.style.display = 'none';
                if (noOrdersMsg) {
                    noOrdersMsg.style.display = 'block';
                    noOrdersMsg.innerHTML = 'Akses terbatas: hanya admin dapat melihat daftar pesanan. <a href="admin-login.html">Login sebagai admin</a>';
                }
                if (exportBtn) exportBtn.disabled = true;
                if (importBtn) importBtn.disabled = true;
                return;
            }

            if (orderTable) orderTable.style.display = '';
            if (exportBtn) exportBtn.disabled = false;
            if (importBtn) importBtn.disabled = false;

            // If no explicit filter entered and we have a stored lastBuyerName, default to showing that user's orders
            const lastBuyer = (localStorage.getItem('lastBuyerName') || '').toLowerCase().trim();
            // Safely get filter inputs if present on the page (daftar.html may not have them)
            const filterNameEl = document.getElementById('filterName');
            const filterTableEl = document.getElementById('filterTable');
            const hasFilterInputs = (filterNameEl && filterNameEl.value.trim() !== '') || (filterTableEl && filterTableEl.value.trim() !== '');
            let finalOrders = orders;
            if (!hasFilterInputs && lastBuyer) {
                finalOrders = orders.filter(o => (o.buyerName || '').toLowerCase() === lastBuyer);
            }

            if (finalOrders.length === 0) {
                if (noOrdersMsg) noOrdersMsg.style.display = 'block';
                return;
            }
            if (noOrdersMsg) noOrdersMsg.style.display = 'none';

            const listIsAdmin = true; // we're already confirmed admin
            orders.forEach(order => {
                if (!order.items || !Array.isArray(order.items) || order.items.length === 0) return;
                const row = document.createElement('tr');

                if (order.completed) {
                    row.classList.add('table-success');
                }

                const tdName = document.createElement('td');
                tdName.textContent = order.buyerName || '-';
                row.appendChild(tdName);

                const tdTable = document.createElement('td');
                tdTable.textContent = order.tableNumber || '-';
                row.appendChild(tdTable);

                const tdItem = document.createElement('td');
                order.items.forEach(it => {
                    const div = document.createElement('div');
                    div.textContent = `${it.itemName} (${it.category}) x${it.quantity}`;
                    tdItem.appendChild(div);
                });
                row.appendChild(tdItem);

                const tdQty = document.createElement('td');
                tdQty.textContent = order.items.reduce((s, it) => s + it.quantity, 0);
                row.appendChild(tdQty);

                const tdTotal = document.createElement('td');
                tdTotal.textContent = formatCurrency(order.total || 0);
                row.appendChild(tdTotal);

                const tdActions = document.createElement('td');
                if (listIsAdmin) {
                    if (!order.completed) {
                        const editBtn = document.createElement('button');
                        editBtn.className = 'edit-btn';
                        editBtn.type = 'button';
                        editBtn.textContent = 'Edit';
                        editBtn.addEventListener('click', () => editOrder(order.id));
                        tdActions.appendChild(editBtn);

                        const deleteBtn = document.createElement('button');
                        deleteBtn.className = 'delete-btn';
                        deleteBtn.type = 'button';
                        deleteBtn.textContent = 'Hapus';
                        deleteBtn.addEventListener('click', () => deleteOrder(order.id));
                        tdActions.appendChild(deleteBtn);

                        const completeBtn = document.createElement('button');
                        completeBtn.className = 'complete-btn';
                        completeBtn.type = 'button';
                        completeBtn.textContent = 'Selesai';
                        completeBtn.addEventListener('click', () => completeOrder(order.id));
                        tdActions.appendChild(completeBtn);
                    } else {
                        const badge = document.createElement('span');
                        badge.className = 'badge bg-success';
                        badge.textContent = 'Selesai';
                        tdActions.appendChild(badge);

                        const receiptBtn = document.createElement('button');
                        receiptBtn.className = 'receipt-btn';
                        receiptBtn.type = 'button';
                        receiptBtn.innerHTML = '<i class="bi bi-receipt me-1"></i>Struk';
                        receiptBtn.style.cssText = 'background: linear-gradient(135deg, #00a856 0%, #007a42 100%); color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 12px; margin-left: 5px;';
                        receiptBtn.addEventListener('click', () => {
                            showReceiptModal(order);
                        });
                        tdActions.appendChild(receiptBtn);

                        const deleteBtn = document.createElement('button');
                        deleteBtn.className = 'delete-btn';
                        deleteBtn.type = 'button';
                        deleteBtn.textContent = 'Hapus';
                        deleteBtn.addEventListener('click', () => deleteOrder(order.id));
                        tdActions.appendChild(deleteBtn);
                    }
                } else {
                    tdActions.textContent = '—';
                }

                row.appendChild(tdActions);
                orderList.appendChild(row);
            });
        }

        function deleteOrder(id) {
            if (!clientIsAdmin()) { showToast('Akses ditolak: hanya admin yang dapat menghapus pesanan.', 'error'); return; }
            const oldOrders = getOrders();
            showConfirmUndo('Hapus pesanan ini?', () => {
                const orders = oldOrders.filter(order => order.id !== id);
                saveOrders(orders);
                loadOrders();
                showToast('Pesanan berhasil dihapus.', 'success');
            });
        }

        function editOrder(id) {
            if (!clientIsAdmin()) { showToast('Akses ditolak: hanya admin yang dapat mengedit pesanan.', 'error'); return; }
            const orders = getOrders();
            const order = orders.find(o => o.id === id);
            if (!order) return;

            // Redirect ke halaman pesan dengan data order di localStorage
            localStorage.setItem('editingOrder', JSON.stringify(order));
            window.location.href = 'pesan.html';
        }

        function completeOrder(id) {
            if (!clientIsAdmin()) { showToast('Akses ditolak: hanya admin yang dapat menandai selesai.', 'error'); return; }
            const oldOrders = getOrders();
            showConfirmUndo('Tandai pesanan ini sebagai selesai?', () => {
                const orders = getOrders();
                const idx = orders.findIndex(o => o.id === id);
                if (idx === -1) { showToast('Pesanan tidak ditemukan.', 'error'); return; }
                orders[idx].completed = true;
                saveOrders(orders);
                loadOrders();
                showToast('Pesanan ditandai selesai.', 'success');
            });
        }

        // EXPORT TO EXCEL
        if (exportBtn) {
            exportBtn.addEventListener('click', function() {
                console.log('Export button clicked');
                
                waitForXLSX(() => {
                    const orders = getOrders();
                    console.log('Orders:', orders);

                    if (!orders || orders.length === 0) {
                        showToast('<i class="bi bi-exclamation-circle-fill me-2" style="color: #dc3545;"></i>Tidak ada pesanan untuk diekspor. Buat pesanan dulu di halaman "Pesan Sekarang".', 'error');
                        return;
                    }

                    try {
                        // Siapkan data untuk Excel
                        const excelData = [];
                        excelData.push(['NO', 'NAMA PEMBELI', 'NOMOR MEJA', 'ITEM', 'KATEGORI', 'HARGA', 'JUMLAH', 'SUBTOTAL', 'TOTAL PESANAN', 'TANGGAL']);

                        let no = 1;
                        orders.forEach(order => {
                            const date = new Date(parseInt(order.id)).toLocaleDateString('id-ID');
                            
                            if (order.items && order.items.length > 0) {
                                order.items.forEach((item, idx) => {
                                    if (idx === 0) {
                                        excelData.push([
                                            no,
                                            order.buyerName || '-',
                                            order.tableNumber || '-',
                                            item.itemName || '-',
                                            item.category || '-',
                                            item.price || 0,
                                            item.quantity || 0,
                                            item.subtotal || 0,
                                            order.total || 0,
                                            date
                                        ]);
                                    } else {
                                        excelData.push([
                                            '',
                                            '',
                                            '',
                                            item.itemName || '-',
                                            item.category || '-',
                                            item.price || 0,
                                            item.quantity || 0,
                                            item.subtotal || 0,
                                            '',
                                            ''
                                        ]);
                                    }
                                });
                                no++;
                            }
                        });

                        console.log('Excel Data:', excelData);

                        // Buat workbook & sheet
                        const ws = XLSX.utils.aoa_to_sheet(excelData);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, 'Pesanan');

                        // Set lebar kolom
                        ws['!cols'] = [
                            { wch: 5 },   // NO
                            { wch: 20 },  // NAMA
                            { wch: 12 },  // MEJA
                            { wch: 25 },  // ITEM
                            { wch: 12 },  // KATEGORI
                            { wch: 12 },  // HARGA
                            { wch: 8 },   // JUMLAH
                            { wch: 12 },  // SUBTOTAL
                            { wch: 12 },  // TOTAL
                            { wch: 15 }   // TANGGAL
                        ];

                        // Download file
                        const fileName = `Pesanan_BAZAR_HmI_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.xlsx`;
                        XLSX.writeFile(wb, fileName);
                        showToast('<i class="bi bi-check-circle-fill me-2" style="color: #28a745;"></i>Data berhasil diekspor ke Excel!\nFile: ' + fileName, 'success');
                        
                    } catch (err) {
                        console.error('Export error:', err);
                        showToast('<i class="bi bi-exclamation-circle-fill me-2" style="color: #dc3545;"></i>Error saat export: ' + err.message, 'error');
                    }
                });
            });
        }

        // IMPORT FROM EXCEL
        if (importBtn) {
            importBtn.addEventListener('click', function() {
                importFile.click();
            });
        }

        if (importFile) {
            importFile.addEventListener('change', function(e) {
                waitForXLSX(() => {
                    const file = e.target.files[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onload = function(event) {
                        try {
                            const data = new Uint8Array(event.target.result);
                            const workbook = XLSX.read(data, { type: 'array' });
                            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                            const jsonData = XLSX.utils.sheet_to_json(worksheet);

                            // Parse data dari Excel
                            const importedOrders = [];
                            let currentOrder = null;

                            jsonData.forEach((row, idx) => {
                                if (idx === 0) return;

                                if (row['NAMA PEMBELI'] && row['NAMA PEMBELI'].trim() !== '') {
                                    if (currentOrder) {
                                        importedOrders.push(currentOrder);
                                    }
                                    currentOrder = {
                                        id: Date.now().toString() + Math.random(),
                                        buyerName: row['NAMA PEMBELI'],
                                        tableNumber: row['NOMOR MEJA'] || '-',
                                        items: [],
                                        total: row['TOTAL PESANAN'] || 0
                                    };
                                }

                                if (currentOrder && row['ITEM']) {
                                    currentOrder.items.push({
                                        itemName: row['ITEM'],
                                        category: row['KATEGORI'] || '',
                                        price: parseInt(row['HARGA']) || 0,
                                        quantity: parseInt(row['JUMLAH']) || 0,
                                        subtotal: parseInt(row['SUBTOTAL']) || 0
                                    });
                                }
                            });

                            if (currentOrder) {
                                importedOrders.push(currentOrder);
                            }

                            if (importedOrders.length === 0) {
                                showToast('<i class="bi bi-exclamation-circle-fill me-2" style="color: #dc3545;"></i>File Excel tidak memiliki data yang valid.', 'error');
                                return;
                            }

                            showConfirmUndo(`Akan mengimpor ${importedOrders.length} pesanan. Data existing akan ditambahkan, tidak diganti. Lanjutkan?`, () => {
                                const existingOrders = getOrders();
                                const mergedOrders = [...existingOrders, ...importedOrders];
                                saveOrders(mergedOrders);
                                showToast(`✅ ${importedOrders.length} pesanan berhasil diimpor!`, 'success');
                                loadOrders();
                                importFile.value = '';
                            });
                        } catch (err) {
                            console.error('Import error:', err);
                            showToast('<i class="bi bi-exclamation-circle-fill me-2" style="color: #dc3545;"></i>Gagal mengimpor file. Pastikan format Excel benar.', 'error');
                        }
                    };
                    reader.readAsArrayBuffer(file);
                });
            });
        }

        loadOrders();
    }

    // Halaman Pesanan Saya (pesanan-saya.html)
    if (isMyOrdersPage) {
        const myOrdersContainer = document.getElementById('myOrdersContainer');
        const noOrdersMsg = document.getElementById('noOrdersMsg');
        const filterBtn = document.getElementById('filterBtn');
        const resetBtn = document.getElementById('resetBtn');
        const filterName = document.getElementById('filterName');
        const filterTable = document.getElementById('filterTable');

        function displayMyOrders(ordersToShow = null) {
            const allOrders = getOrders();
            const orders = ordersToShow || allOrders;
            
            if (!myOrdersContainer) return;
            myOrdersContainer.innerHTML = '';

            let finalOrders = orders;

            if (finalOrders.length === 0) {
                if (noOrdersMsg) noOrdersMsg.style.display = 'block';
                return;
            }

            if (noOrdersMsg) noOrdersMsg.style.display = 'none';

            finalOrders.forEach((order) => {
                const statusBadge = order.completed ? 
                    '<span class="badge bg-success">✅ Selesai</span>' : 
                    '<span class="badge bg-warning">⏳ Sedang Diproses</span>';

                const itemsList = order.items.map(item => 
                    `<tr>
                        <td>${item.itemName}</td>
                        <td>(${item.category})</td>
                        <td class="text-end">${item.quantity}x</td>
                        <td class="text-end">${formatCurrency(item.subtotal)}</td>
                    </tr>`
                ).join('');

                const qrisBadge = order.paymentMethod === 'qris' ? '<span class="badge bg-info">📱 QRIS</span>' : '';

                // Build card DOM safely (avoid embedding raw JSON into HTML attributes)
                const card = document.createElement('div');
                card.className = 'card mb-4';
                card.style.cssText = 'border-left: 5px solid #17a2b8; border-radius: 8px;';

                const cardBody = document.createElement('div');
                cardBody.className = 'card-body';

                const row = document.createElement('div');
                row.className = 'row mb-3';

                const left = document.createElement('div');
                left.className = 'col-md-6';
                left.innerHTML = `<p class="mb-1"><strong>👤 Nama Pembeli:</strong> ${order.buyerName}</p>\n                              <p class="mb-1"><strong>🪑 Nomor Meja:</strong> ${order.tableNumber}</p>\n                              <p class="mb-0"><strong>📅 ID Pesanan:</strong> <code>${order.id}</code></p>`;

                const right = document.createElement('div');
                right.className = 'col-md-6 text-md-end';
                right.innerHTML = `<p class="mb-3">${statusBadge}</p>\n                               <p><strong>💰 Total:</strong> <span style="color: #17a2b8; font-size: 1.3rem; font-weight: bold;">${formatCurrency(order.total)}</span></p>`;

                row.appendChild(left);
                row.appendChild(right);
                cardBody.appendChild(row);

                const hr = document.createElement('hr');
                cardBody.appendChild(hr);

                const h6 = document.createElement('h6');
                h6.className = 'fw-bold mb-3';
                h6.textContent = '📋 Detail Item:';
                cardBody.appendChild(h6);

                const tableWrap = document.createElement('div');
                tableWrap.className = 'table-responsive';
                const table = document.createElement('table');
                table.className = 'table table-sm mb-0';
                table.innerHTML = `<thead style="background-color: #f8f9fb;">\n                                        <tr>\n                                            <th style="color: #1a3a52; font-weight: 600;">Nama Item</th>\n                                            <th style="color: #1a3a52; font-weight: 600;">Kategori</th>\n                                            <th style="color: #1a3a52; font-weight: 600;">Jumlah</th>\n                                            <th class="text-end" style="color: #1a3a52; font-weight: 600;">Subtotal</th>\n                                        </tr>\n                                    </thead><tbody>${itemsList}</tbody>`;
                tableWrap.appendChild(table);
                cardBody.appendChild(tableWrap);

                const actionRow = document.createElement('div');
                actionRow.className = 'mt-3 d-flex justify-content-between align-items-center';

                const leftBadge = document.createElement('div');
                leftBadge.innerHTML = qrisBadge;
                actionRow.appendChild(leftBadge);

                const actions = document.createElement('div');

                const receiptBtn = document.createElement('button');
                receiptBtn.type = 'button';
                receiptBtn.className = 'btn btn-sm btn-outline-primary me-2';
                receiptBtn.textContent = '🧾 Lihat Struk';
                receiptBtn.addEventListener('click', () => {
                    try { showReceiptModal(order); } catch (e) { console.error(e); }
                });
                actions.appendChild(receiptBtn);

                if (order.paymentMethod === 'qris') {
                    const qrBtn = document.createElement('button');
                    qrBtn.type = 'button';
                    qrBtn.className = 'btn btn-sm btn-primary';
                    qrBtn.textContent = '🔍 Lihat QR';
                    qrBtn.addEventListener('click', () => {
                        try { showReceiptModal(order); } catch (e) { console.error(e); }
                    });
                    actions.appendChild(qrBtn);
                }

                actionRow.appendChild(actions);
                cardBody.appendChild(actionRow);

                card.appendChild(cardBody);
                myOrdersContainer.appendChild(card);
            });
        }

        function filterOrders() {
            const allOrders = getOrders();
            const name = (filterName.value || '').toLowerCase().trim();
            const table = (filterTable.value || '').toLowerCase().trim();

            const filtered = allOrders.filter(order => {
                const nameMatch = !name || order.buyerName.toLowerCase().includes(name);
                const tableMatch = !table || order.tableNumber.toLowerCase().includes(table);
                return nameMatch && tableMatch;
            });

            displayMyOrders(filtered);
        }

        if (filterBtn) {
            filterBtn.addEventListener('click', filterOrders);
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (filterName) filterName.value = '';
                if (filterTable) filterTable.value = '';
                displayMyOrders();
            });
        }

        // Allow Enter key to search
        if (filterName) {
            filterName.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') filterOrders();
            });
        }
        if (filterTable) {
            filterTable.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') filterOrders();
            });
        }

        // Load orders on page load
        displayMyOrders();
    }

    // Admin Settings - Password Change & Logout
    const isDaftarPage = document.getElementById('orderTable') !== null;
    if (isDaftarPage) {
        const adminContentContainer = document.getElementById('adminContentContainer');
        const accessDeniedMsg = document.getElementById('accessDeniedMsg');
        
        // Check admin status and show/hide content
        if (clientIsAdmin()) {
            if (adminContentContainer) adminContentContainer.style.display = 'block';
            if (accessDeniedMsg) accessDeniedMsg.style.display = 'none';
        } else {
            if (adminContentContainer) adminContentContainer.style.display = 'none';
            if (accessDeniedMsg) accessDeniedMsg.style.display = 'block';
        }

        // Rest of admin handlers
        if (clientIsAdmin()) {
            const changePasswordForm = document.getElementById('changePasswordForm');
            const logoutBtn = document.getElementById('logoutAdminBtn');
            const adminSettingsCard = document.getElementById('adminSettingsCard');

            if (adminSettingsCard) {
                adminSettingsCard.style.display = 'block';
            }

            if (changePasswordForm) {
                changePasswordForm.addEventListener('submit', async function(e) {
                    e.preventDefault();
                    const newPassword = document.getElementById('newPassword').value;
                    const confirmPassword = document.getElementById('confirmPassword').value;

                    // Validation
                    if (newPassword.length < 6) {
                        showToast('<i class="bi bi-exclamation-circle-fill me-2" style="color: #dc3545;"></i>Password minimal 6 karakter', 'error');
                        return;
                    }

                    if (newPassword !== confirmPassword) {
                        showToast('<i class="bi bi-exclamation-circle-fill me-2" style="color: #dc3545;"></i>Password tidak cocok', 'error');
                        return;
                    }

                    // Change password
                    try {
                        await setAdminPassword(newPassword);
                        showToast('<i class="bi bi-check-circle-fill me-2" style="color: #28a745;"></i>Password berhasil diubah! Silakan login kembali.', 'success');
                        logoutAdmin();
                        window.location.href = 'admin-login.html';
                    } catch (error) {
                        showToast('<i class="bi bi-exclamation-circle-fill me-2" style="color: #dc3545;"></i>Terjadi kesalahan: ' + error.message, 'error');
                    }
                });
            }

            if (logoutBtn) {
                logoutBtn.addEventListener('click', function() {
                    showConfirmUndo('⚠️ Apakah Anda yakin ingin logout?', () => {
                        logoutAdmin();
                        showToast('<i class="bi bi-check-circle-fill me-2" style="color: #28a745;"></i>Logout berhasil', 'success');
                        window.location.href = 'admin-login.html';
                    });
                });
            }

            // QRIS settings form handlers
            const qrisForm = document.getElementById('adminQrisForm');
            const qrisNmidInput = document.getElementById('qrisNmid');
            const qrisMerchantNameInput = document.getElementById('qrisMerchantName');
            const qrisMerchantCityInput = document.getElementById('qrisMerchantCity');

            async function loadQrisSettings() {
                try {
                    if (typeof fetchSettingsFromAPI === 'function') {
                        const s = await fetchSettingsFromAPI();
                        window.serverSettings = s || {};
                        if (qrisNmidInput) qrisNmidInput.value = s.QRIS_MERCHANT_NMID || '';
                        if (qrisMerchantNameInput) qrisMerchantNameInput.value = s.MERCHANT_NAME || '';
                        if (qrisMerchantCityInput) qrisMerchantCityInput.value = s.MERCHANT_CITY || '';
                    }
                } catch (e) {
                    console.error('Gagal load settings:', e);
                }
            }

            if (qrisForm) {
                // populate current values
                loadQrisSettings();

                qrisForm.addEventListener('submit', async function(e) {
                    e.preventDefault();
                    const nm = qrisNmidInput ? qrisNmidInput.value.trim() : '';
                    const nmName = qrisMerchantNameInput ? qrisMerchantNameInput.value.trim() : '';
                    const nmCity = qrisMerchantCityInput ? qrisMerchantCityInput.value.trim() : '';
                    if (!nm) { showToast('<i class="bi bi-exclamation-circle-fill me-2" style="color: #dc3545;"></i>NMID tidak boleh kosong', 'error'); return; }
                    try {
                        const ok = await apiCall('settings', {
                            method: 'POST',
                            body: JSON.stringify({ QRIS_MERCHANT_NMID: nm, MERCHANT_NAME: nmName, MERCHANT_CITY: nmCity })
                        });
                        if (ok && ok.ok) {
                            showToast('<i class="bi bi-check-circle-fill me-2" style="color: #28a745;"></i>Pengaturan QRIS berhasil disimpan', 'success');
                            // refresh local settings
                            window.serverSettings = { ...(window.serverSettings || {}), QRIS_MERCHANT_NMID: nm, MERCHANT_NAME: nmName, MERCHANT_CITY: nmCity };
                        } else {
                            showToast('❌ Gagal menyimpan pengaturan', 'error');
                            console.error('Save settings failed', ok);
                        }
                    } catch (err) {
                        console.error('Error saving settings:', err);
                        showToast('❌ Terjadi kesalahan saat menyimpan', 'error');
                    }
                });
            }
        }
    }
});