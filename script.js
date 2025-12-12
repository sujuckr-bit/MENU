document.addEventListener('DOMContentLoaded', function() {
    // Tunggu XLSX library ter-load
    function waitForXLSX(callback, attempt = 0) {
        if (typeof XLSX !== 'undefined') {
            callback();
        } else if (attempt < 50) {
            setTimeout(() => waitForXLSX(callback, attempt + 1), 100);
        } else {
            console.error('XLSX library gagal ter-load');
            alert('❌ Library Excel gagal ter-load. Refresh halaman.');
        }
    }

    // Deteksi halaman mana yang sedang aktif
    const isOrderPage = document.getElementById('orderForm') !== null;
    const isListPage = document.getElementById('orderList') !== null;

    const submitBtn = document.querySelector('button[type="submit"]');
    const initialSubmitText = submitBtn ? submitBtn.textContent : 'Simpan Pesanan';
    let editingId = null;
    let cart = [];

    // Menu data
    const menus = {
        Minum: [
            { name: "Kopi Susu (Hot/Ice)", price: 23000 },
            { name: "Cappucino (Hot/Ice)", price: 23000 },
            { name: "Coffee Latte (Hot/Ice)", price: 23000 },
            { name: "Coffee Spanish Latte (Hot/Ice)", price: 23000 },
            { name: "Coffee Caramel", price: 26000 },
            { name: "Coffee Mochacino", price: 26000 },
            { name: "Coffee Cream", price: 26000 },
            { name: "Coffee Pandan (Ice)", price: 26000 },
            { name: "Coffee Gula Aren (Ice)", price: 26000 },
            { name: "Air Mineral", price: 13000 },
            { name: "Fanta", price: 16000 },
            { name: "Es Teh Tawar", price: 14000 },
            { name: "Es Teh Manis", price: 14000 },
            { name: "Thaitea", price: 23000 },
            { name: "Teh Tarik (Hot/Ice)", price: 23000 },
            { name: "Lemon Tea (Hot/Ice)", price: 23000 },
            { name: "Green Tea (Hot/Ice)", price: 23000 },
            { name: "Lychee Tea", price: 23000 },
            { name: "Taro", price: 23000 },
            { name: "Red Velvet", price: 23000 },
            { name: "Pink Lava", price: 23000 },
            { name: "Juice Markisa", price: 23000 },
            { name: "Juice Jeruk", price: 23000 },
            { name: "Juice Mangga", price: 23000 },
            { name: "Juice Alpukat", price: 23000 },
            { name: "Juice Buah Naga", price: 23000 },
            { name: "Extra Joss Susu", price: 23000 },
            { name: "Kuku Bima Susu", price: 23000 },
            { name: "Coklat (Hot/Ice)", price: 23000 },
            { name: "Milo (Hot/Ice)", price: 23000 },
            { name: "Soda Gembira (Ice)", price: 23000 },
            { name: "Blue Bell Soda (Ice)", price: 23000 },
            { name: "Melon Yakult (Ice)", price: 26000 },
            { name: "Mango Yakult (Ice)", price: 26000 },
            { name: "Lychee Yakult (Ice)", price: 26000 },
            { name: "Strawberry Yakult (Ice)", price: 26000 },
            { name: "Mango Soda (Ice)", price: 25000 },
            { name: "Matcha Latte", price: 28000 },
            { name: "Strawberry Matcha", price: 28000 },
            { name: "Matcha Oreo", price: 28000 },
            { name: "Matchaco", price: 28000 },
            { name: "Matcha Koko", price: 28000 },
            { name: "Oreo Frappe Blend", price: 28000 }
        ],
        Makan: [
            { name: "Chicken Teriyaki", price: 23000 },
            { name: "Chicken Yakiniku", price: 23000 },
            { name: "Nasi Goreng Merah", price: 25000 },
            { name: "Nasi Goreng Kampung", price: 26000 },
            { name: "Nasi Goreng Jakarta", price: 26000 },
            { name: "Nasi Goreng Ikan Asin", price: 28000 },
            { name: "Nasi Goreng Bangkok", price: 28000 },
            { name: "Nasi Goreng Special", price: 28000 },
            { name: "Nasi Ayam Rica", price: 28000 },
            { name: "Nasi Ayam Cobek Mata", price: 28000 },
            { name: "Nasi Putih", price: 13000 },
            { name: "Bakso", price: 23000 },
            { name: "Mie Goreng Jawa", price: 25000 },
            { name: "Mie Bakso", price: 26000 },
            { name: "Spaghetti Sausage", price: 26000 },
            { name: "Kwetiau Goreng", price: 26000 },
            { name: "Kwetiau Kuah", price: 26000 },
            { name: "Mie Kering", price: 28000 },
            { name: "Ubi Goreng", price: 18000 },
            { name: "Pisang Goreng Ori", price: 18000 },
            { name: "Kroket Goreng", price: 23000 },
            { name: "Kentang Goreng", price: 23000 },
            { name: "Pisang Goreng (varian)", price: 23000 },
            { name: "Chicken Wing", price: 28000 },
            { name: "Snack Pletter", price: 28000 },
            { name: "Burger (Sapi/Ayam)", price: 28000 },
            { name: "Pangsit Kuah", price: 28000 },
            { name: "Pangsit Pedas", price: 28000 },
            { name: "Indomie Soto/Goreng", price: 16000 },
            { name: "Toping", price: 13000 },
            { name: "Toping Bakso/Telur/Nugget/Sosis", price: 13000 }
        ]
    };

    // Helper functions
    function formatCurrency(n) {
        return n.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });
    }

    function clientIsAdmin() {
        return sessionStorage.getItem('isAdmin') === '1';
    }

    function getOrders() {
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

    // Halaman Pesan (pesan.html)
    if (isOrderPage) {
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

        // If someone requested to edit an existing order, only allow it for admin
        const editingJson = localStorage.getItem('editingOrder');
        if (editingJson) {
            try {
                const editingOrder = JSON.parse(editingJson);
                if (!clientIsAdmin()) {
                    alert('Hanya admin yang dapat mengedit pesanan. Silakan login sebagai admin.');
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
            if (!cat || !menus[cat]) return;
            const q = String(filter || '').toLowerCase();
            let added = 0;
            menus[cat].forEach((it, idx) => {
                const label = `${it.name} — ${formatCurrency(it.price)}`;
                const match = !q || it.name.toLowerCase().includes(q) || String(it.price).includes(q) || label.toLowerCase().includes(q);
                if (!match) return;
                const opt = document.createElement('option');
                opt.value = String(idx);
                opt.textContent = label;
                itemSelect.appendChild(opt);
                added++;
            });
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
                const label = `${it.name} — ${formatCurrency(it.price)}`;
                const match = it.name.toLowerCase().includes(q) || String(it.price).includes(q) || label.toLowerCase().includes(q);
                if (match) results.push({ idx, name: it.name, price: it.price, label });
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
                alert('Item tidak valid atau kategori belum dipilih.');
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
                alert('Pilih kategori, item dan masukkan jumlah valid (>0).');
                return;
            }

            const itemObj = menus[cat][idx];
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
        }

        // Form submission
        if (orderForm) {
            orderForm.addEventListener('submit', function(e) {
                e.preventDefault();
            const buyerName = buyerInput ? buyerInput.value.trim() : '';
                const tableNumber = tableSelect ? (tableSelect.value || '') : '';

                if (!buyerName) {
                    alert('❌ Masukkan nama pembeli.');
                    if (buyerInput) buyerInput.focus();
                    return;
                }
                if (!tableNumber) {
                    alert('❌ Pilih nomor meja atau Takeaway.');
                    if (tableSelect) tableSelect.focus();
                    return;
                }
                if (!cart.length) {
                    alert('❌ Keranjang kosong. Tambahkan item ke keranjang.');
                    return;
                }

                try {
                    const orders = getOrders();
                    const clonedItems = cart.map(it => ({ category: it.category, itemName: it.itemName, price: it.price, quantity: it.quantity, subtotal: it.subtotal }));
                    const total = clonedItems.reduce((s, it) => s + it.subtotal, 0);

                    if (editingId) {
                        // Update existing order (admin only - also validated earlier)
                        const idx = orders.findIndex(o => o.id === editingId);
                        if (idx !== -1) {
                            const prevCompleted = orders[idx].completed || false;
                            orders[idx] = { id: editingId, buyerName, tableNumber, items: clonedItems, total, completed: prevCompleted };
                            saveOrders(orders);
                            alert('✅ Perubahan pesanan berhasil disimpan!');
                        } else {
                            alert('❌ Pesanan yang diedit tidak ditemukan.');
                        }
                        editingId = null;
                        if (submitBtn) submitBtn.textContent = initialSubmitText;
                    } else {
                        const id = Date.now().toString();
                        orders.push({ id, buyerName, tableNumber, items: clonedItems, total, completed: false });
                        saveOrders(orders);
                        alert('✅ Pesanan berhasil disimpan!');
                    }

                    orderForm.reset();
                    cart = [];
                    updateCartDisplay();
                    if (categorySelect) {
                        categorySelect.value = 'Minum';
                        populateItemsForCategory('Minum');
                    }
                    if (tableSelect) tableSelect.value = '';
                } catch (err) {
                    console.error('Error:', err);
                    alert('❌ Terjadi kesalahan: ' + err.message);
                }
            });
        }

        // Inisialisasi
        if (categorySelect) {
            categorySelect.value = 'Minum';
            populateItemsForCategory('Minum');
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
                    noOrdersMsg.innerHTML = 'Akses terbatas: hanya admin dapat melihat daftar pesanan. <a href="admin.html">Login sebagai admin</a>';
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
            if (!clientIsAdmin()) { alert('Akses ditolak: hanya admin yang dapat menghapus pesanan.'); return; }
            if (!confirm('Hapus pesanan ini?')) return;
            const orders = getOrders().filter(order => order.id !== id);
            saveOrders(orders);
            loadOrders();
        }

        function editOrder(id) {
            if (!clientIsAdmin()) { alert('Akses ditolak: hanya admin yang dapat mengedit pesanan.'); return; }
            const orders = getOrders();
            const order = orders.find(o => o.id === id);
            if (!order) return;

            // Redirect ke halaman pesan dengan data order di localStorage
            localStorage.setItem('editingOrder', JSON.stringify(order));
            window.location.href = 'pesan.html';
        }

        function completeOrder(id) {
            if (!clientIsAdmin()) { alert('Akses ditolak: hanya admin yang dapat menandai selesai.'); return; }
            if (!confirm('Tandai pesanan ini sebagai selesai?')) return;
            const orders = getOrders();
            const idx = orders.findIndex(o => o.id === id);
            if (idx === -1) { alert('Pesanan tidak ditemukan.'); return; }
            orders[idx].completed = true;
            saveOrders(orders);
            loadOrders();
        }

        // EXPORT TO EXCEL
        if (exportBtn) {
            exportBtn.addEventListener('click', function() {
                console.log('Export button clicked');
                
                waitForXLSX(() => {
                    const orders = getOrders();
                    console.log('Orders:', orders);

                    if (!orders || orders.length === 0) {
                        alert('❌ Tidak ada pesanan untuk diekspor. Buat pesanan dulu di halaman "Pesan Sekarang".');
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
                        alert('✅ Data berhasil diekspor ke Excel!\nFile: ' + fileName);
                        
                    } catch (err) {
                        console.error('Export error:', err);
                        alert('❌ Error saat export: ' + err.message);
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
                                alert('❌ File Excel tidak memiliki data yang valid.');
                                return;
                            }

                            const confirmation = confirm(`Akan mengimpor ${importedOrders.length} pesanan. Data existing akan ditambahkan, tidak diganti. Lanjutkan?`);
                            if (!confirmation) return;

                            const existingOrders = getOrders();
                            const mergedOrders = [...existingOrders, ...importedOrders];
                            saveOrders(mergedOrders);

                            alert(`✅ ${importedOrders.length} pesanan berhasil diimpor!`);
                            loadOrders();
                            importFile.value = '';
                        } catch (err) {
                            console.error('Import error:', err);
                            alert('❌ Gagal mengimpor file. Pastikan format Excel benar.');
                        }
                    };
                    reader.readAsArrayBuffer(file);
                });
            });
        }

        loadOrders();
    }
});