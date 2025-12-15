// --- Sync Status Indicator ---
function updateSyncStatus(status) {
    const statusEl = document.getElementById('syncStatus');
    const textEl = document.getElementById('syncStatusText');
    const spinnerEl = document.getElementById('syncSpinner');
    const dotEl = document.getElementById('syncDot');

    if (!statusEl) return; // element not yet loaded

    // default hide spinner
    if (spinnerEl) spinnerEl.style.display = 'none';

    if (dotEl) dotEl.className = 'sync-dot';

    if (status === 'syncing') {
        if (dotEl) dotEl.classList.remove('online','offline','error'); dotEl.classList.add('syncing');
        if (textEl) textEl.textContent = 'Menyimpan...';
        if (spinnerEl) spinnerEl.style.display = 'inline-block';
    } else if (status === 'online') {
        if (dotEl) dotEl.classList.remove('syncing','offline','error'); dotEl.classList.add('online');
        if (textEl) textEl.textContent = '🟢 Siap';
    } else if (status === 'offline') {
        if (dotEl) dotEl.classList.remove('syncing','online','error'); dotEl.classList.add('offline');
        if (textEl) textEl.textContent = '🟡 Offline';
    } else if (status === 'error') {
        if (dotEl) dotEl.classList.remove('syncing','online','offline'); dotEl.classList.add('error');
        if (textEl) textEl.textContent = '🔴 Error';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const isAdmin = sessionStorage.getItem('isAdmin') === '1';
    const notAuth = document.getElementById('notAuth');
    const app = document.getElementById('app');
    if (!isAdmin) {
        notAuth.style.display = 'block';
    }
    // always show app (UI visible for all)
    app.style.display = 'block';

    const categoriesEl = document.getElementById('categories');
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const newCategoryName = document.getElementById('newCategoryName');
    const addItemCategory = document.getElementById('addItemCategory');
    const addItemName = document.getElementById('addItemName');
    const addItemPrice = document.getElementById('addItemPrice');
    const addItemOut = document.getElementById('addItemOut');
    const addItemSubmit = document.getElementById('addItemSubmit');
    const createMenuCategory = document.getElementById('createMenuCategory');
    const createMenuItems = document.getElementById('createMenuItems');
    const createMenuBtn = document.getElementById('createMenuBtn');
    const saveBtn = document.getElementById('saveBtn');
    const resetBtn = document.getElementById('resetBtn');

    function getDefaultMenus() {
        return {
            "Minum": [
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
            "Makan": [
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
    }

    function loadMenus() {
        try {
            const saved = localStorage.getItem('siteMenus');
            if (saved) return JSON.parse(saved);
            // If empty, use defaults and save
            const defaults = getDefaultMenus();
            localStorage.setItem('siteMenus', JSON.stringify(defaults));
            return defaults;
        } catch (e) {
            console.error('Gagal parse siteMenus', e);
            const defaults = getDefaultMenus();
            localStorage.setItem('siteMenus', JSON.stringify(defaults));
            return defaults;
        }
    }

    function persist(menus) {
        localStorage.setItem('siteMenus', JSON.stringify(menus));
        localStorage.setItem('siteMenusUpdatedAt', String(Date.now()));
        // Try to save to backend API (non-blocking)
        try {
            if (typeof saveMenusToAPI === 'function') {
                updateSyncStatus('syncing');
                saveMenusToAPI(menus).then(ok => {
                    console.log('[SYNC] saveMenusToAPI result:', ok);
                    if (!ok) {
                        enqueuePendingSync(menus);
                        updateSyncStatus('offline');
                        showToast('Tidak dapat menghubungi server. Perubahan akan dicoba otomatis nanti.', 'warn');
                    } else {
                        updateSyncStatus('online');
                    }
                }).catch(err => {
                    console.warn('[SYNC] saveMenusToAPI error:', err);
                    enqueuePendingSync(menus);
                    updateSyncStatus('offline');
                    showToast('Gagal menyimpan ke server. Perubahan disimpan lokal dan akan dicoba kembali.', 'warn');
                });
            }
        } catch (e) {
            console.warn('[SYNC] saveMenusToAPI exception', e);
        }
    }

    // --- Pending sync queue (robust retry when server unavailable) ---
    const PENDING_KEY = 'pendingMenuSync';

    function enqueuePendingSync(menus) {
        try {
            const list = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
            list.push({ menus, ts: Date.now() });
            localStorage.setItem(PENDING_KEY, JSON.stringify(list));
            // schedule a retry soon
            scheduleRetry(2000);
        } catch (e) {
            console.error('enqueuePendingSync failed', e);
        }
    }

    let retryTimer = null;
    function scheduleRetry(delayMs = 3000) {
        if (retryTimer) return; // already scheduled
        retryTimer = setTimeout(async () => {
            retryTimer = null;
            await processPendingSyncs();
        }, delayMs);
    }

    async function processPendingSyncs() {
        try {
            const raw = localStorage.getItem(PENDING_KEY);
            if (!raw) return;
            const list = JSON.parse(raw || '[]');
            if (!Array.isArray(list) || list.length === 0) {
                updateSyncStatus('online');
                return;
            }
            
            updateSyncStatus('syncing');
            // try each in order; if one fails stop to avoid rapid retries
            for (let i = 0; i < list.length; i++) {
                const entry = list[i];
                try {
                    const ok = await saveMenusToAPI(entry.menus);
                    if (ok) {
                        // remove this entry
                        list.splice(i, 1);
                        i--; // adjust index
                        localStorage.setItem(PENDING_KEY, JSON.stringify(list));
                        showToast('Perubahan yang tertunda berhasil disinkronkan ke server.', 'success');
                    } else {
                        // server still not accepting; schedule later
                        updateSyncStatus('offline');
                        scheduleRetry(5000);
                        return;
                    }
                } catch (e) {
                    console.warn('processPendingSyncs entry failed', e);
                    updateSyncStatus('error');
                    scheduleRetry(5000);
                    return;
                }
            }
            // all processed
            localStorage.removeItem(PENDING_KEY);
            updateSyncStatus('online');
        } catch (e) {
            console.error('processPendingSyncs failed', e);
            updateSyncStatus('error');
            scheduleRetry(5000);
        }
    }

    // try pending syncs on network back online
    window.addEventListener('online', () => {
        processPendingSyncs().catch(()=>{});
    });

    // start background attempt at load
    (function startPendingProcessor() {
        // small delay to allow page initialization
        setTimeout(() => { processPendingSyncs().catch(()=>{}); }, 1200);
    })();

    // showToast is provided by assets/js/toast.js

    // Undo / tentative-delete helpers
    let currentUndoEl = null;
    function showUndo(message, undoFn, timeoutMs = 7000) {
        // remove existing
        if (currentUndoEl) { currentUndoEl.remove(); currentUndoEl = null; }
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

        const txt = document.createElement('div'); txt.textContent = message;
        const btns = document.createElement('div');
        const undoBtn = document.createElement('button'); undoBtn.textContent = 'Undo';
        undoBtn.style.marginLeft = '12px';
        undoBtn.className = 'btn-secondary-custom';
        btns.appendChild(undoBtn);
        bar.appendChild(txt); bar.appendChild(btns);
        document.body.appendChild(bar);
        currentUndoEl = bar;

        let done = false;
        const timer = setTimeout(() => {
            if (done) return;
            done = true;
            if (currentUndoEl) { currentUndoEl.remove(); currentUndoEl = null; }
        }, timeoutMs);

        undoBtn.addEventListener('click', () => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            try { undoFn(); } catch (e) { console.error('Undo failed', e); }
            if (currentUndoEl) { currentUndoEl.remove(); currentUndoEl = null; }
        });
    }

    function render() {
        const menus = loadMenus();
        categoriesEl.innerHTML = '';

        // update category select used by manual add
        addItemCategory.innerHTML = '';
        const placeholderOpt = document.createElement('option');
        placeholderOpt.value = '';
        placeholderOpt.textContent = 'Pilih kategori';
        addItemCategory.appendChild(placeholderOpt);

        const grid = document.createElement('div');
        grid.className = 'categories-grid';

        for (const cat of Object.keys(menus)) {
            // populate select
            const opt = document.createElement('option'); opt.value = cat; opt.textContent = cat; addItemCategory.appendChild(opt);

            // create category card
            const card = document.createElement('div');
            card.className = 'category-box';

            const hdr = document.createElement('div');
            hdr.style.display = 'flex';
            hdr.style.justifyContent = 'space-between';
            hdr.style.alignItems = 'center';

            const title = document.createElement('div');
            title.className = 'category-title';
            title.textContent = cat + ' (' + (menus[cat]?.length || 0) + ')';

            const headerBtns = document.createElement('div');
            headerBtns.className = 'btn-group-actions';
            const addItemBtn = document.createElement('button'); addItemBtn.textContent = 'Tambah Item'; addItemBtn.className = 'btn-edit';
            const delCatBtn = document.createElement('button'); delCatBtn.textContent = 'Hapus Kategori'; delCatBtn.className = 'btn-hapus';
            headerBtns.appendChild(addItemBtn); headerBtns.appendChild(delCatBtn);

            hdr.appendChild(title);
            hdr.appendChild(headerBtns);
            card.appendChild(hdr);

            // items list
            const list = document.createElement('div');
            list.style.marginTop = '12px';

            (menus[cat] || []).forEach((it, idx) => {
                const row = document.createElement('div'); row.className = 'item-row';

                const info = document.createElement('div'); info.className = 'item-info';
                const nameEl = document.createElement('div'); nameEl.className = 'item-name'; nameEl.textContent = it.name;
                const meta = document.createElement('div'); meta.style.marginTop = '6px'; meta.innerHTML = `<span class="item-price">Rp ${Number(it.price).toLocaleString('id-ID')}</span>`;
                if (it.outOfStock) {
                    const badge = document.createElement('span'); badge.className = 'item-status'; badge.textContent = 'Habis';
                    badge.style.marginLeft = '12px';
                    meta.appendChild(badge);
                }
                info.appendChild(nameEl); info.appendChild(meta);

                const actions = document.createElement('div'); actions.className = 'btn-group-actions';
                const editBtn = document.createElement('button'); editBtn.className = 'btn-edit'; editBtn.textContent = 'Edit';
                const delBtn = document.createElement('button'); delBtn.className = 'btn-hapus'; delBtn.textContent = 'Hapus';
                const toggleBtn = document.createElement('button'); toggleBtn.className = 'btn-stock'; toggleBtn.textContent = it.outOfStock ? 'Tersedia' : 'Tandai Habis';
                actions.appendChild(editBtn); actions.appendChild(delBtn); actions.appendChild(toggleBtn);

                row.appendChild(info); row.appendChild(actions);
                list.appendChild(row);

                // handlers
                editBtn.addEventListener('click', () => {
                    const params = new URLSearchParams({ cat, idx: String(idx) });
                    window.location.href = 'edit_item.html?' + params.toString();
                });

                delBtn.addEventListener('click', () => {
                    if (!confirm('Hapus item ini?')) return;
                    // remove item and allow undo
                    const removed = menus[cat].splice(idx,1)[0];
                    persist(menus);
                    render();
                    showUndo(`Item "${removed.name}" dihapus.`, () => {
                        // restore
                        if (!menus[cat]) menus[cat] = [];
                        menus[cat].splice(idx, 0, removed);
                        persist(menus);
                        render();
                    });
                });

                toggleBtn.addEventListener('click', () => {
                    menus[cat][idx].outOfStock = !menus[cat][idx].outOfStock;
                    persist(menus);
                    render();
                });
            });

            card.appendChild(list);
            grid.appendChild(card);

            // header actions
            addItemBtn.addEventListener('click', () => {
                const name = prompt('Nama item baru:'); if (!name) return;
                const price = parseInt(prompt('Harga (angka):','0'),10); if (Number.isNaN(price)) { showToast('Harga tidak valid', 'error'); return; }
                menus[cat].push({ name, price });
                persist(menus); render();
            });

            delCatBtn.addEventListener('click', () => {
                if (!confirm('Hapus kategori dan semua itemnya?')) return;
                const removedItems = menus[cat];
                delete menus[cat]; persist(menus); render();
                showUndo(`Kategori "${cat}" dihapus.`, () => {
                    menus[cat] = removedItems;
                    persist(menus);
                    render();
                });
            });
        }

        categoriesEl.appendChild(grid);
    }

    addCategoryBtn.addEventListener('click', () => {
        const name = newCategoryName.value && newCategoryName.value.trim();
        if (!name) { showToast('Isi nama kategori', 'error'); return; }
        const menus = loadMenus();
        if (menus[name]) { showToast('Kategori sudah ada', 'error'); return; }
        menus[name] = [];
        persist(menus); newCategoryName.value=''; render();
    });

    // Manual add item via inline form
    addItemSubmit.addEventListener('click', () => {
        const cat = addItemCategory.value;
        const name = addItemName.value && addItemName.value.trim();
        const price = parseInt(addItemPrice.value, 10);
        const out = !!addItemOut.checked;
        if (!cat) { showToast('Pilih kategori tujuan', 'error'); return; }
        if (!name) { showToast('Isi nama item', 'error'); return; }
        if (Number.isNaN(price)) { showToast('Harga tidak valid', 'error'); return; }
        const menus = loadMenus();
        if (!menus[cat]) menus[cat] = [];
        menus[cat].push({ name, price, outOfStock: out });
        persist(menus);
        addItemName.value=''; addItemPrice.value=''; addItemOut.checked=false;
        render();
    });

    // Create new category with multiple items from textarea
    createMenuBtn.addEventListener('click', () => {
        const cat = createMenuCategory.value && createMenuCategory.value.trim();
        const raw = createMenuItems.value || '';
        if (!cat) { showToast('Isi nama kategori baru', 'error'); return; }
        const menus = loadMenus();
        if (menus[cat]) { if (!confirm('Kategori sudah ada. Tambahkan item baru ke kategori yang ada?')) return; }
        const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) { showToast('Tambahkan minimal satu baris item dengan format yang benar.', 'error'); return; }
        const parsedItems = [];
        for (const line of lines) {
            // accept '|' or ',' sebagai delimiter
            const parts = line.split('|').map(s => s.trim());
            let name, priceRaw, outRaw;
            if (parts.length >= 2) {
                name = parts[0]; priceRaw = parts[1]; outRaw = parts[2];
            } else {
                const parts2 = line.split(',').map(s=>s.trim());
                if (parts2.length < 2) { showToast('Format baris salah: ' + line, 'error'); return; }
                name = parts2[0]; priceRaw = parts2[1]; outRaw = parts2[2];
            }
            const price = parseInt(priceRaw.replace(/[^0-9]/g, ''), 10);
            if (!name || Number.isNaN(price)) { showToast('Nama atau harga tidak valid pada baris: ' + line, 'error'); return; }
            const outOfStock = String(outRaw || '').toLowerCase() === 'true';
            parsedItems.push({ name, price, outOfStock });
        }
        if (!menus[cat]) menus[cat] = [];
        menus[cat] = menus[cat].concat(parsedItems);
        persist(menus);
        createMenuCategory.value=''; createMenuItems.value='';
        render();
        showToast('Kategori dan item berhasil dibuat.', 'success');
    });

    // Wrapper for direct sync with better error handling and details
    async function saveMenusToAPIWithValidation(menus) {
        try {
            // First validate locally on client side
            if (!menus || typeof menus !== 'object') {
                throw new Error('Menu data is invalid');
            }
            
            // Check for empty categories or invalid items
            let issues = [];
            for (const [cat, items] of Object.entries(menus)) {
                if (!items || !Array.isArray(items)) {
                    issues.push(`Category "${cat}": items not an array`);
                }
                for (const item of items || []) {
                    if (!item.name || !item.price) {
                        issues.push(`Item missing name or price in "${cat}"`);
                    }
                }
            }
            
            if (issues.length > 0) {
                return { ok: false, error: 'Validation failed: ' + issues.join('; ') };
            }
            
            // Call server API
            const result = await apiCall('menus', {
                method: 'POST',
                body: JSON.stringify(menus)
            });
            
            if (!result.ok) {
                // Extract error details from server response
                const errorMsg = result.data?.error || 'Unknown error';
                const details = result.data?.details || '';
                const fullError = details ? `${errorMsg} (${details})` : errorMsg;
                return { ok: false, error: fullError, status: result.status };
            }
            
            return { ok: true };
        } catch (e) {
            return { ok: false, error: 'Network error: ' + e.message };
        }
    }

    saveBtn.addEventListener('click', async () => {
        const menus = loadMenus();
        updateSyncStatus('syncing');
        try {
            if (typeof apiCall === 'function') {
                const result = await saveMenusToAPIWithValidation(menus);
                if (result.ok) {
                    updateSyncStatus('online');
                    showToast('Perubahan berhasil disimpan ke server.', 'success');
                } else {
                    console.warn('[SAVE] Server error:', result.error);
                    updateSyncStatus('error');
                    showToast('Gagal menyimpan: ' + (result.error || 'Unknown error') + '. Perubahan tersimpan lokal.', 'warn');
                    // Try to enqueue for later
                    enqueuePendingSync(menus);
                    updateSyncStatus('offline');
                }
            } else {
                showToast('Perubahan disimpan secara lokal. (No API available)', 'info');
                updateSyncStatus('online');
            }
        } catch (e) {
            console.error('Save to API failed', e);
            updateSyncStatus('error');
            showToast('Terjadi error saat menyimpan ke server. Perubahan tersimpan lokal.', 'error');
            enqueuePendingSync(menus);
            updateSyncStatus('offline');
        }
    });

    resetBtn.addEventListener('click', () => {
        if (!confirm('Reset menu ke isi default dari `menu-bazar.txt`? (Akan menimpa perubahan)')) return;
        // try to remove siteMenus so script will use bundled defaults on reload
        localStorage.removeItem('siteMenus');
        localStorage.setItem('siteMenusUpdatedAt', String(Date.now()));
        showToast('Reset selesai. Silakan buka halaman utama untuk melihat perubahan.', 'success');
        render();
    });

    // Initialize: try to fetch menus from API first, fallback to local
    try {
        if (typeof fetchMenusFromAPI === 'function') {
            const remote = await fetchMenusFromAPI();
            if (remote && Object.keys(remote).length > 0) {
                persist(remote);
            }
        }
    } catch (e) {
        console.warn('Failed to fetch menus from API:', e);
    }

    render();
});
