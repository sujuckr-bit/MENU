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
            showToast('❌ Library Excel gagal ter-load. Refresh halaman.', 'error');
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
                    const orders = getOrders();
                    orders.push(order);
                    saveOrders(orders);
                    if (typeof loadOrders === 'function') loadOrders();
                    if (typeof displayMyOrders === 'function') displayMyOrders();
                    console.log('Realtime: new order', order.id);
                } catch (e) { console.error('Realtime order_created handler error', e); }
            });

            realtime.on('order_updated', (order) => {
                try {
                    if (!order || !order.id) return;
                    const orders = getOrders();
                    const idx = orders.findIndex(o => o.id == order.id);
                    if (idx !== -1) { orders[idx] = order; saveOrders(orders); }
                    if (typeof loadOrders === 'function') loadOrders();
                    if (typeof displayMyOrders === 'function') displayMyOrders();
                    console.log('Realtime: order updated', order.id);
                } catch (e) { console.error('Realtime order_updated handler error', e); }
            });
        }
    }

    // Deteksi halaman mana yang sedang aktif
    const isOrderPage = document.getElementById('orderForm') !== null;
    const isListPage = document.getElementById('orderList') !== null;
    const isMyOrdersPage = document.getElementById('myOrdersContainer') !== null;

    const submitBtn = document.querySelector('button[type="submit"]');
    const initialSubmitText = submitBtn ? submitBtn.textContent : 'Simpan Pesanan';
    let editingId = null;
    let cart = [];
    
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
            itemsHTML += `
                <tr>
                    <td>${item.itemName || item.name}</td>
                    <td style="text-align: right;">${item.quantity || 1}x</td>
                    <td style="text-align: right;">Rp${(item.price || 0).toLocaleString('id-ID')}</td>
                </tr>
            `;
        });

        const paymentMethod = order.paymentMethod === 'qris' ? '📱 QRIS' : '💵 Tunai (Cash)';
        
        return `
            <div style="max-width: 400px; margin: 0 auto; font-family: 'Courier New', monospace; background: white; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; color: #1a3a52;">STRUK PEMESANAN</h3>
                    <p style="margin: 5px 0; color: #666; font-size: 12px;">BAZAR HmI</p>
                </div>
                
                <hr style="border: none; border-top: 1px dashed #999; margin: 15px 0;">
                
                <div style="margin-bottom: 15px; font-size: 12px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span><strong>No. Struk:</strong></span>
                        <span>${receiptNumber}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span><strong>Tanggal:</strong></span>
                        <span>${dateStr}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span><strong>Pembeli:</strong></span>
                        <span>${order.buyerName || '-'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span><strong>Meja:</strong></span>
                        <span>${order.tableNumber || '-'}</span>
                    </div>
                </div>
                
                <hr style="border: none; border-top: 1px dashed #999; margin: 15px 0;">
                
                <table style="width: 100%; font-size: 12px; margin-bottom: 15px;">
                    <thead>
                        <tr style="border-bottom: 1px dashed #999;">
                            <th style="text-align: left; padding-bottom: 5px;">Item</th>
                            <th style="text-align: right; padding-bottom: 5px;">Qty</th>
                            <th style="text-align: right; padding-bottom: 5px;">Harga</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>
                
                <hr style="border: none; border-top: 1px dashed #999; margin: 15px 0;">
                
                <div style="margin-bottom: 15px; font-size: 12px;">
                    <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 5px;">
                        <span>Total:</span>
                        <span>Rp${(order.total || 0).toLocaleString('id-ID')}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; color: #666;">
                        <span><strong>Pembayaran:</strong></span>
                        <span>${paymentMethod}</span>
                    </div>
                </div>
                
                <hr style="border: none; border-top: 1px dashed #999; margin: 15px 0;">
                
                <div style="text-align: center; font-size: 11px; color: #666;">
                    <p style="margin: 0; margin-bottom: 5px;">Terimakasih telah berbelanja</p>
                    <p style="margin: 0;">BAZAR HmI 2024</p>
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
        
        modal.innerHTML = `
            <div style="background: white; border-radius: 12px; max-width: 500px; width: 95%; max-height: 90vh; overflow-y: auto; padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #f0f0f0; padding-bottom: 15px;">
                    <h5 style="margin: 0; color: #1a3a52;">🧾 Struk Pesanan</h5>
                    <button type="button" onclick="document.getElementById('receiptModal').style.display='none'" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">✕</button>
                </div>
                ${receiptHTML}
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button onclick="window.print()" class="btn btn-primary" style="flex: 1; background: #17a2b8; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: 600;">🖨️ Cetak</button>
                    <button onclick="document.getElementById('receiptModal').style.display='none'" class="btn btn-secondary" style="flex: 1; background: #6c757d; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: 600;">Tutup</button>
                </div>
                <style>
                    @media print {
                        body * { display: none !important; }
                        #receiptModal { display: flex !important; position: static !important; background: white !important; }
                        #receiptModal > div { max-width: 100% !important; padding: 0 !important; }
                        .btn { display: none !important; }
                    }
                </style>
            </div>
        `;
        modal.style.display = 'flex';
    }

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
                    showToast('❌ Masukkan nama pembeli.', 'error');
                    if (buyerInput) buyerInput.focus();
                    return;
                }
                if (!tableNumber) {
                    showToast('❌ Pilih nomor meja atau Takeaway.', 'error');
                    if (tableSelect) tableSelect.focus();
                    return;
                }
                if (!paymentMethod) {
                    showToast('❌ Pilih metode pembayaran.', 'error');
                    if (paymentMethodSelect) paymentMethodSelect.focus();
                    return;
                }
                if (!cart.length) {
                    showToast('❌ Keranjang kosong. Tambahkan item ke keranjang.', 'error');
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
                            showToast('✅ Perubahan pesanan berhasil disimpan!', 'success');
                        } else {
                            showToast('❌ Pesanan yang diedit tidak ditemukan.', 'error');
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
                        
                        showToast('✅ Pesanan berhasil disimpan!', 'success');
                        
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
                    showToast('❌ Terjadi kesalahan: ' + err.message, 'error');
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

            if (orders.length === 0) {
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
                        receiptBtn.textContent = '🧾 Struk';
                        receiptBtn.style.cssText = 'background: #17a2b8; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 12px; margin-left: 5px;';
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
                        showToast('❌ Tidak ada pesanan untuk diekspor. Buat pesanan dulu di halaman "Pesan Sekarang".', 'error');
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
                        showToast('✅ Data berhasil diekspor ke Excel!\nFile: ' + fileName, 'success');
                        
                    } catch (err) {
                        console.error('Export error:', err);
                        showToast('❌ Error saat export: ' + err.message, 'error');
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
                                showToast('❌ File Excel tidak memiliki data yang valid.', 'error');
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
                            showToast('❌ Gagal mengimpor file. Pastikan format Excel benar.', 'error');
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

            if (orders.length === 0) {
                if (noOrdersMsg) noOrdersMsg.style.display = 'block';
                return;
            }

            if (noOrdersMsg) noOrdersMsg.style.display = 'none';

            orders.forEach((order) => {
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

                const orderCard = `
                    <div class="card mb-4" style="border-left: 5px solid #17a2b8; border-radius: 8px;">
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <p class="mb-1"><strong>👤 Nama Pembeli:</strong> ${order.buyerName}</p>
                                    <p class="mb-1"><strong>🪑 Nomor Meja:</strong> ${order.tableNumber}</p>
                                    <p class="mb-0"><strong>📅 ID Pesanan:</strong> <code>${order.id}</code></p>
                                </div>
                                <div class="col-md-6 text-md-end">
                                    <p class="mb-3">${statusBadge}</p>
                                    <p><strong>💰 Total:</strong> <span style="color: #17a2b8; font-size: 1.3rem; font-weight: bold;">${formatCurrency(order.total)}</span></p>
                                </div>
                            </div>
                            <hr>
                            <h6 class="fw-bold mb-3">📋 Detail Item:</h6>
                            <div class="table-responsive">
                                <table class="table table-sm mb-0">
                                    <thead style="background-color: #f8f9fb;">
                                        <tr>
                                            <th style="color: #1a3a52; font-weight: 600;">Nama Item</th>
                                            <th style="color: #1a3a52; font-weight: 600;">Kategori</th>
                                            <th style="color: #1a3a52; font-weight: 600;">Jumlah</th>
                                            <th class="text-end" style="color: #1a3a52; font-weight: 600;">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${itemsList}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                `;

                myOrdersContainer.innerHTML += orderCard;
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
                        showToast('❌ Password minimal 6 karakter', 'error');
                        return;
                    }

                    if (newPassword !== confirmPassword) {
                        showToast('❌ Password tidak cocok', 'error');
                        return;
                    }

                    // Change password
                    try {
                        await setAdminPassword(newPassword);
                        showToast('✅ Password berhasil diubah! Silakan login kembali.', 'success');
                        logoutAdmin();
                        window.location.href = 'admin-login.html';
                    } catch (error) {
                        showToast('❌ Terjadi kesalahan: ' + error.message, 'error');
                    }
                });
            }

            if (logoutBtn) {
                logoutBtn.addEventListener('click', function() {
                    showConfirmUndo('⚠️ Apakah Anda yakin ingin logout?', () => {
                        logoutAdmin();
                        showToast('✅ Logout berhasil', 'success');
                        window.location.href = 'admin-login.html';
                    });
                });
            }
        }
    }
});