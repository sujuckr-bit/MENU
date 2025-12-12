document.addEventListener('DOMContentLoaded', () => {
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
    }

    function render() {
        const menus = loadMenus();
        categoriesEl.innerHTML = '';
        // update category select used by manual add
        addItemCategory.innerHTML = '';
        const placeholderOpt = document.createElement('option'); placeholderOpt.value=''; placeholderOpt.textContent='Pilih kategori'; addItemCategory.appendChild(placeholderOpt);
        for (const cat of Object.keys(menus)) {
            const opt = document.createElement('option'); opt.value = cat; opt.textContent = cat; addItemCategory.appendChild(opt);
            const container = document.createElement('div');
            container.className = 'cat';
            const header = document.createElement('div');
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.innerHTML = `<strong>${cat}</strong>`;

            const headerBtns = document.createElement('div');
            const addItemBtn = document.createElement('button'); addItemBtn.textContent = 'Tambah Item'; addItemBtn.className = 'btn';
            const delCatBtn = document.createElement('button'); delCatBtn.textContent = 'Hapus Kategori'; delCatBtn.className = 'btn danger';
            headerBtns.appendChild(addItemBtn); headerBtns.appendChild(delCatBtn);
            header.appendChild(headerBtns);
            container.appendChild(header);

            const list = document.createElement('div');
            menus[cat].forEach((it, idx) => {
                const row = document.createElement('div'); row.className = 'item-row';
                const colName = document.createElement('div'); colName.textContent = it.name + (it.outOfStock ? ' (Habis)' : '');
                const colPrice = document.createElement('div'); colPrice.textContent = it.price;
                const colActions = document.createElement('div');
                const editBtn = document.createElement('button'); editBtn.textContent = 'Edit'; editBtn.className = 'btn';
                const delBtn = document.createElement('button'); delBtn.textContent = 'Hapus'; delBtn.className = 'btn danger';
                const toggle = document.createElement('button'); toggle.textContent = it.outOfStock ? 'Tersedia' : 'Tandai Habis'; toggle.className='btn';
                colActions.appendChild(editBtn); colActions.appendChild(delBtn); colActions.appendChild(toggle);
                row.appendChild(colName); row.appendChild(colPrice); row.appendChild(colActions);
                list.appendChild(row);

                editBtn.addEventListener('click', () => {
                    // open dedicated edit page
                    const params = new URLSearchParams({ cat, idx: String(idx) });
                    window.location.href = 'edit_item.html?' + params.toString();
                });

                delBtn.addEventListener('click', () => {
                    if (!confirm('Hapus item ini?')) return;
                    menus[cat].splice(idx,1);
                    persist(menus);
                    render();
                });

                toggle.addEventListener('click', () => {
                    menus[cat][idx].outOfStock = !menus[cat][idx].outOfStock;
                    persist(menus);
                    render();
                });
            });

            container.appendChild(list);
            categoriesEl.appendChild(container);

            addItemBtn.addEventListener('click', () => {
                const name = prompt('Nama item baru:'); if (!name) return;
                const price = parseInt(prompt('Harga (angka):','0'),10); if (Number.isNaN(price)) { alert('Harga tidak valid'); return; }
                menus[cat].push({ name, price });
                persist(menus); render();
            });

            delCatBtn.addEventListener('click', () => {
                if (!confirm('Hapus kategori dan semua itemnya?')) return;
                delete menus[cat]; persist(menus); render();
            });
        }
    }

    addCategoryBtn.addEventListener('click', () => {
        const name = newCategoryName.value && newCategoryName.value.trim();
        if (!name) { alert('Isi nama kategori'); return; }
        const menus = loadMenus();
        if (menus[name]) { alert('Kategori sudah ada'); return; }
        menus[name] = [];
        persist(menus); newCategoryName.value=''; render();
    });

    // Manual add item via inline form
    addItemSubmit.addEventListener('click', () => {
        const cat = addItemCategory.value;
        const name = addItemName.value && addItemName.value.trim();
        const price = parseInt(addItemPrice.value, 10);
        const out = !!addItemOut.checked;
        if (!cat) { alert('Pilih kategori tujuan'); return; }
        if (!name) { alert('Isi nama item'); return; }
        if (Number.isNaN(price)) { alert('Harga tidak valid'); return; }
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
        if (!cat) { alert('Isi nama kategori baru'); return; }
        const menus = loadMenus();
        if (menus[cat]) { if (!confirm('Kategori sudah ada. Tambahkan item baru ke kategori yang ada?')) return; }
        const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) { alert('Tambahkan minimal satu baris item dengan format yang benar.'); return; }
        const parsedItems = [];
        for (const line of lines) {
            // accept '|' or ',' sebagai delimiter
            const parts = line.split('|').map(s => s.trim());
            let name, priceRaw, outRaw;
            if (parts.length >= 2) {
                name = parts[0]; priceRaw = parts[1]; outRaw = parts[2];
            } else {
                const parts2 = line.split(',').map(s=>s.trim());
                if (parts2.length < 2) { alert('Format baris salah: ' + line); return; }
                name = parts2[0]; priceRaw = parts2[1]; outRaw = parts2[2];
            }
            const price = parseInt(priceRaw.replace(/[^0-9]/g, ''), 10);
            if (!name || Number.isNaN(price)) { alert('Nama atau harga tidak valid pada baris: ' + line); return; }
            const outOfStock = String(outRaw || '').toLowerCase() === 'true';
            parsedItems.push({ name, price, outOfStock });
        }
        if (!menus[cat]) menus[cat] = [];
        menus[cat] = menus[cat].concat(parsedItems);
        persist(menus);
        createMenuCategory.value=''; createMenuItems.value='';
        render();
        alert('Kategori dan item berhasil dibuat.');
    });

    saveBtn.addEventListener('click', () => {
        alert('Perubahan disimpan. Halaman lain dapat memuat ulang untuk mengambil perubahan.');
    });

    resetBtn.addEventListener('click', () => {
        if (!confirm('Reset menu ke isi default dari `menu_bazar.txt`? (Akan menimpa perubahan)')) return;
        // try to remove siteMenus so script will use bundled defaults on reload
        localStorage.removeItem('siteMenus');
        localStorage.setItem('siteMenusUpdatedAt', String(Date.now()));
        alert('Reset selesai. Silakan buka halaman utama untuk melihat perubahan.');
        render();
    });

    render();
});
