// ==========================================
// CONFIGURATION & DUMMY DATA STATE
// ==========================================

// Current simulation date: Monday, June 22, 2026
const SYSTEM_DATE_STR = "2026-06-22T20:14:00";
const systemDateObj = new Date(SYSTEM_DATE_STR);

// Authentication State & Credentials
let currentUser = null;
let activeRole = null; // 'admin' or 'kasir'
let activeCashier = "";

const credentials = {
    admin: { password: "admin", role: "admin", name: "Administrator", avatar: "AD" },
    kasir: { password: "kasir", role: "kasir", name: "Siti Aminah", avatar: "SA" }
};

// Initial Products Dummy Data (with variants, stock, and expired dates)
let products = [
    {
        id: "PRD001",
        name: "Velvet Matte Lip Cream",
        variant: "01 Dusty Rose",
        price: 65000,
        stock: 12,
        expiryDate: "2027-12-15",
        category: "lips"
    },
    {
        id: "PRD002",
        name: "Velvet Matte Lip Cream",
        variant: "05 Brick Red",
        price: 65000,
        stock: 3, // Low stock alert
        expiryDate: "2026-09-10", // Near expiry (~80 days)
        category: "lips"
    },
    {
        id: "PRD003",
        name: "Flawless Liquid Cushion",
        variant: "Natural Beige",
        price: 120000,
        stock: 8,
        expiryDate: "2026-05-15", // Already expired (Relative to June 22, 2026)
        category: "face"
    },
    {
        id: "PRD004",
        name: "Perfect Glow Loose Powder",
        variant: "Translucent",
        price: 85000,
        stock: 1, // Critical low stock
        expiryDate: "2028-02-20",
        category: "face"
    },
    {
        id: "PRD005",
        name: "Waterproof Volume Mascara",
        variant: "Midnight Black",
        price: 95000,
        stock: 15,
        expiryDate: "2026-08-01", // Near expiry (~40 days)
        category: "eyes"
    },
    {
        id: "PRD006",
        name: "Hydrating Face Mist",
        variant: "Aloe Vera Extract",
        price: 45000,
        stock: 20,
        expiryDate: "2026-07-15", // Near expiry (~23 days)
        category: "mist"
    }
];

// Initial Transaction History Dummy Data
let transactionHistory = [
    {
        id: "TRX-20260622-001",
        date: "2026-06-22T10:15:30",
        items: [
            { name: "Velvet Matte Lip Cream (01 Dusty Rose)", price: 65000, qty: 2, subtotal: 130000 }
        ],
        subtotal: 130000,
        discount: 5000,
        total: 125000,
        cashPaid: 150000,
        cashChange: 25000,
        cashier: "Siti Aminah"
    },
    {
        id: "TRX-20260622-002",
        date: "2026-06-22T11:45:00",
        items: [
            { name: "Flawless Liquid Cushion (Natural Beige)", price: 120000, qty: 1, subtotal: 120000 },
            { name: "Perfect Glow Loose Powder (Translucent)", price: 85000, qty: 1, subtotal: 85000 }
        ],
        subtotal: 205000,
        discount: 10000,
        total: 195000,
        cashPaid: 200000,
        cashChange: 5000,
        cashier: "Siti Aminah"
    },
    {
        id: "TRX-20260622-003",
        date: "2026-06-22T14:20:10",
        items: [
            { name: "Waterproof Volume Mascara (Midnight Black)", price: 95000, qty: 2, subtotal: 190000 },
            { name: "Hydrating Face Mist (Aloe Vera Extract)", price: 45000, qty: 1, subtotal: 45000 }
        ],
        subtotal: 235000,
        discount: 15000,
        total: 220000,
        cashPaid: 250000,
        cashChange: 30000,
        cashier: "Budi Santoso"
    }
];

// Load state from localStorage if exists, otherwise save current state as base
if (localStorage.getItem("beautypos_products")) {
    products = JSON.parse(localStorage.getItem("beautypos_products"));
} else {
    localStorage.setItem("beautypos_products", JSON.stringify(products));
}

if (localStorage.getItem("beautypos_transaction_history")) {
    transactionHistory = JSON.parse(localStorage.getItem("beautypos_transaction_history"));
} else {
    localStorage.setItem("beautypos_transaction_history", JSON.stringify(transactionHistory));
}

function saveStateToLocalStorage() {
    localStorage.setItem("beautypos_products", JSON.stringify(products));
    localStorage.setItem("beautypos_transaction_history", JSON.stringify(transactionHistory));
}

// Shopping Cart State
let cart = [];
let currentFilterCategory = "all";
let currentSearchQuery = "";
let latestCheckoutTransaction = null;

// ==========================================
// SYSTEM HELPERS & UTILITIES
// ==========================================

// Format Number to Rupiah (IDR) currency layout
function formatRupiah(value) {
    return "Rp " + new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(value);
}

// Format ISO Date String to Indonesian human-readable format
function formatDateTime(isoString) {
    const d = new Date(isoString);
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    
    const dayName = days[d.getDay()];
    const date = d.getDate();
    const monthName = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${dayName}, ${date} ${monthName} ${year} | ${hours}:${minutes}`;
}

// Calculate Expiry Status relative to Simulation Date
function getExpiryStatus(expiryStr) {
    const today = new Date(SYSTEM_DATE_STR);
    const expDate = new Date(expiryStr);
    
    // Calculate difference in days
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
        return { status: 'expired', label: 'KADALUWARSA (EXPIRED)', days: diffDays };
    } else if (diffDays <= 90) {
        return { status: 'near', label: `DEKAT EXP (${diffDays} HARI Lagi)`, days: diffDays };
    } else {
        return { status: 'normal', label: 'AMAN', days: diffDays };
    }
}

// Check Low Stock Status
function getStockStatus(stock) {
    if (stock === 0) {
        return { status: 'out', label: 'HABIS' };
    } else if (stock < 5) {
        return { status: 'low', label: `MENIPIS (${stock})` };
    } else {
        return { status: 'normal', label: `STOK: ${stock}` };
    }
}

// ==========================================
// RENDERING MODULES
// ==========================================

// Render Product Catalog in POS Section
function renderPOSProducts() {
    const grid = document.getElementById("products-grid");
    grid.innerHTML = "";
    
    const filtered = products.filter(p => {
        const matchesCategory = currentFilterCategory === "all" || p.category === currentFilterCategory;
        const matchesSearch = p.name.toLowerCase().includes(currentSearchQuery.toLowerCase()) || 
                              p.variant.toLowerCase().includes(currentSearchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="empty-cart-message" style="grid-column: 1/-1;">Tidak ada produk kosmetik yang cocok.</div>`;
        return;
    }

    filtered.forEach(p => {
        const exp = getExpiryStatus(p.expiryDate);
        const st = getStockStatus(p.stock);
        
        let stockBadgeClass = "badge-stock";
        if (st.status === 'out') stockBadgeClass += " out-of-stock";
        else if (st.status === 'low') stockBadgeClass += " low-stock";

        let expiryBadgeClass = "badge-expiry";
        if (exp.status === 'expired') expiryBadgeClass += " expired";
        else if (exp.status === 'near') expiryBadgeClass += " near-expiry";
        
        const isButtonDisabled = st.status === 'out' || exp.status === 'expired';
        
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `
            <div class="badge-container">
                <span class="p-badge ${stockBadgeClass}">${st.label}</span>
                <span class="p-badge ${expiryBadgeClass}">${exp.status === 'expired' ? 'EXPIRED' : (exp.status === 'near' ? 'DEKAT EXP' : 'AMAN')}</span>
            </div>
            <div class="product-details">
                <h3 class="product-title">${p.name}</h3>
                <span class="product-variant">${p.variant}</span>
                <span class="product-expiry">Exp: ${p.expiryDate}</span>
            </div>
            <div class="product-bottom">
                <span class="product-price">${formatRupiah(p.price)}</span>
                <button class="btn-add-cart" data-id="${p.id}" ${isButtonDisabled ? 'disabled' : ''}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                    Tambah
                </button>
            </div>
        `;
        
        grid.appendChild(card);
    });

    // Rebind add to cart click events
    document.querySelectorAll(".btn-add-cart").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const prodId = btn.getAttribute("data-id");
            addToCart(prodId);
        });
    });
}

// Render Shopping Cart Panel
function renderCart() {
    const list = document.getElementById("cart-items-list");
    const emptyMsg = document.getElementById("empty-cart-message");
    
    // Clear list but retain layout
    list.querySelectorAll(".cart-item").forEach(item => item.remove());
    
    if (cart.length === 0) {
        emptyMsg.style.display = "flex";
        document.getElementById("cart-count").textContent = "0";
    } else {
        emptyMsg.style.display = "none";
        document.getElementById("cart-count").textContent = cart.reduce((acc, item) => acc + item.qty, 0);
        
        cart.forEach(item => {
            const cartItemDiv = document.createElement("div");
            cartItemDiv.className = "cart-item";
            cartItemDiv.innerHTML = `
                <div class="cart-item-header">
                    <div class="cart-item-details">
                        <span class="cart-item-name">${item.product.name}</span>
                        <span class="cart-item-variant">${item.product.variant}</span>
                    </div>
                    <button class="btn-remove-item" data-id="${item.product.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                </div>
                <div class="cart-item-footer">
                    <span class="cart-item-price">${formatRupiah(item.product.price)}</span>
                    <div class="cart-item-qty-control">
                        <button class="qty-btn btn-qty-minus" data-id="${item.product.id}">-</button>
                        <span class="qty-value">${item.qty}</span>
                        <button class="qty-btn btn-qty-plus" data-id="${item.product.id}">+</button>
                    </div>
                </div>
            `;
            list.appendChild(cartItemDiv);
        });

        // Event bindings for cart controls
        document.querySelectorAll(".btn-remove-item").forEach(btn => {
            btn.addEventListener("click", () => {
                removeFromCart(btn.getAttribute("data-id"));
            });
        });
        
        document.querySelectorAll(".btn-qty-minus").forEach(btn => {
            btn.addEventListener("click", () => {
                updateCartQty(btn.getAttribute("data-id"), -1);
            });
        });

        document.querySelectorAll(".btn-qty-plus").forEach(btn => {
            btn.addEventListener("click", () => {
                updateCartQty(btn.getAttribute("data-id"), 1);
            });
        });
    }
    
    calculateTotals();
}

// Calculate Shopping Cart pricing totals
function calculateTotals() {
    const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
    const discInput = document.getElementById("cart-discount");
    let discount = parseFloat(discInput.value) || 0;
    
    if (discount < 0) {
        discount = 0;
        discInput.value = 0;
    }
    if (discount > subtotal) {
        discount = subtotal;
        discInput.value = subtotal;
    }

    const total = Math.max(0, subtotal - discount);
    
    document.getElementById("cart-subtotal").textContent = formatRupiah(subtotal);
    document.getElementById("cart-total").textContent = formatRupiah(total);

    // Update payment details
    calculateChange(total);
}

// Calculate Customer payment change
function calculateChange(total) {
    const cashInput = document.getElementById("payment-cash");
    const changeSpan = document.getElementById("payment-change");
    const checkoutBtn = document.getElementById("btn-checkout");
    
    const cashPaid = parseFloat(cashInput.value) || 0;
    
    if (cart.length === 0) {
        changeSpan.textContent = "Rp 0";
        changeSpan.className = "change-value";
        checkoutBtn.disabled = true;
        return;
    }
    
    if (cashPaid < total) {
        const diff = total - cashPaid;
        changeSpan.textContent = `Kurang ${formatRupiah(diff)}`;
        changeSpan.className = "change-value insufficient";
        checkoutBtn.disabled = true;
    } else {
        const change = cashPaid - total;
        changeSpan.textContent = formatRupiah(change);
        changeSpan.className = "change-value";
        checkoutBtn.disabled = false;
    }
}

// Render Stocks Management Tab
function renderStockManagement() {
    // Render Stats Metrics
    const totalProdSpan = document.getElementById("metric-total-products");
    const lowStockSpan = document.getElementById("metric-low-stock");
    const expiredSpan = document.getElementById("metric-expired");
    
    totalProdSpan.textContent = products.length;
    
    let lowStockCount = 0;
    let expiredCount = 0;
    
    const tableBody = document.getElementById("stock-table-body");
    tableBody.innerHTML = "";

    products.forEach(p => {
        const exp = getExpiryStatus(p.expiryDate);
        const st = getStockStatus(p.stock);
        
        let isLow = false;
        let isExp = false;
        
        if (p.stock < 5) {
            lowStockCount++;
            isLow = true;
        }
        
        if (exp.status === 'expired' || exp.status === 'near') {
            expiredCount++;
            isExp = true;
        }
        
        // Rows highlight styling class
        let rowClass = "";
        if (exp.status === 'expired') {
            rowClass = "row-danger";
        } else if (isLow || exp.status === 'near') {
            rowClass = "row-warning";
        }
        
        // Badges HTML
        let stockBadge = `<span class="badge badge-success">${st.label}</span>`;
        if (st.status === 'out') {
            stockBadge = `<span class="badge badge-danger">${st.label}</span>`;
        } else if (st.status === 'low') {
            stockBadge = `<span class="badge badge-warning">${st.label}</span>`;
        }

        let expiryBadge = `<span class="badge badge-success">${exp.label}</span>`;
        if (exp.status === 'expired') {
            expiryBadge = `<span class="badge badge-danger">${exp.label}</span>`;
        } else if (exp.status === 'near') {
            expiryBadge = `<span class="badge badge-warning">${exp.label}</span>`;
        }

        const tr = document.createElement("tr");
        tr.className = rowClass;
        tr.innerHTML = `
            <td class="text-bold">${p.id}</td>
            <td>${p.name}</td>
            <td>${p.variant}</td>
            <td class="text-price">${formatRupiah(p.price)}</td>
            <td>${stockBadge}</td>
            <td>${p.expiryDate}</td>
            <td>${expiryBadge}</td>
            <td class="admin-only">
                <div class="crud-actions-wrapper">
                    <button class="btn-crud-edit" data-id="${p.id}">Edit</button>
                    <button class="btn-crud-delete" data-id="${p.id}">Hapus</button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });

    lowStockSpan.textContent = lowStockCount;
    expiredSpan.textContent = expiredCount;

    // Bind CRUD action buttons
    document.querySelectorAll(".btn-crud-edit").forEach(btn => {
        btn.addEventListener("click", () => {
            const prodId = btn.getAttribute("data-id");
            openEditProductModal(prodId);
        });
    });

    document.querySelectorAll(".btn-crud-delete").forEach(btn => {
        btn.addEventListener("click", () => {
            const prodId = btn.getAttribute("data-id");
            deleteProduct(prodId);
        });
    });
}

// Render Transaction Laporan History Tab
function renderTransactionsReport() {
    const totalRevSpan = document.getElementById("report-total-revenue");
    const totalTrxSpan = document.getElementById("report-total-transactions");
    const avgBasketSpan = document.getElementById("report-avg-transaction");
    
    const totalRevenue = transactionHistory.reduce((acc, trx) => acc + trx.total, 0);
    const totalTransactions = transactionHistory.length;
    const avgBasket = totalTransactions > 0 ? (totalRevenue / totalTransactions) : 0;
    
    totalRevSpan.textContent = formatRupiah(totalRevenue);
    totalTrxSpan.textContent = totalTransactions;
    avgBasketSpan.textContent = formatRupiah(avgBasket);
    
    const tableBody = document.getElementById("report-table-body");
    tableBody.innerHTML = "";
    
    transactionHistory.forEach(trx => {
        // Formulate items lists formatting
        let itemsHTML = `<ul class="tx-items-list">`;
        trx.items.forEach(item => {
            itemsHTML += `<li>${item.name} <span>x${item.qty}</span></li>`;
        });
        itemsHTML += `</ul>`;
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="text-bold">${trx.id}</td>
            <td>${formatDateTime(trx.date)}</td>
            <td>${itemsHTML}</td>
            <td class="text-price">${formatRupiah(trx.subtotal)}</td>
            <td class="text-price">${formatRupiah(trx.discount)}</td>
            <td class="text-bold text-price" style="color: var(--primary);">${formatRupiah(trx.total)}</td>
            <td>${trx.cashier}</td>
        `;
        tableBody.appendChild(tr);
    });
}

// ==========================================
// CORE BUSINESS LOGIC ACTIONS
// ==========================================

// Add Product to basket
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Safety check for expired items
    const exp = getExpiryStatus(product.expiryDate);
    if (exp.status === 'expired') {
        alert("Gagal menambahkan! Produk ini sudah kedaluwarsa.");
        return;
    }

    const cartItem = cart.find(item => item.product.id === productId);
    const currentCartQty = cartItem ? cartItem.qty : 0;
    
    if (currentCartQty >= product.stock) {
        alert(`Gagal! Stok ${product.name} (${product.variant}) tidak mencukupi (Sisa Stok: ${product.stock}).`);
        return;
    }
    
    if (cartItem) {
        cartItem.qty++;
    } else {
        cart.push({ product: product, qty: 1 });
    }
    
    renderCart();
}

// Update Qty in basket
function updateCartQty(productId, delta) {
    const item = cart.find(i => i.product.id === productId);
    if (!item) return;
    
    const newQty = item.qty + delta;
    
    if (newQty <= 0) {
        removeFromCart(productId);
        return;
    }
    
    // Stock availability check
    if (newQty > item.product.stock) {
        alert(`Maksimal kuantitas adalah batas stok (${item.product.stock})`);
        return;
    }
    
    item.qty = newQty;
    renderCart();
}

// Remove from basket
function removeFromCart(productId) {
    cart = cart.filter(item => item.product.id !== productId);
    renderCart();
}

// Clear entire basket
function clearCart() {
    cart = [];
    document.getElementById("payment-cash").value = "";
    document.getElementById("cart-discount").value = 0;
    renderCart();
}

// ==========================================
// CHECKOUT & RECEIPT OPERATIONS
// ==========================================

// Process current POS Cart transaction
function checkout() {
    if (cart.length === 0) return;
    
    const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
    const discount = parseFloat(document.getElementById("cart-discount").value) || 0;
    const total = Math.max(0, subtotal - discount);
    
    const cashInput = document.getElementById("payment-cash");
    const cashPaid = parseFloat(cashInput.value) || 0;
    
    if (cashPaid < total) {
        alert("Nominal pembayaran tunai tidak mencukupi!");
        return;
    }
    
    const cashChange = cashPaid - total;
    
    // 1. Deduct Product stocks
    cart.forEach(item => {
        const prod = products.find(p => p.id === item.product.id);
        if (prod) {
            prod.stock = Math.max(0, prod.stock - item.qty);
        }
    });
    
    // 2. Generate transaction record
    const dateObj = new Date();
    const isoString = dateObj.toISOString();
    
    const trxId = `TRX-${dateObj.getFullYear()}${String(dateObj.getMonth()+1).padStart(2,'0')}${String(dateObj.getDate()).padStart(2,'0')}-${String(transactionHistory.length + 1).padStart(3, '0')}`;
    
    const itemsRecord = cart.map(item => ({
        name: `${item.product.name} (${item.product.variant})`,
        price: item.product.price,
        qty: item.qty,
        subtotal: item.product.price * item.qty
    }));
    
    const newTransaction = {
        id: trxId,
        date: isoString,
        items: itemsRecord,
        subtotal: subtotal,
        discount: discount,
        total: total,
        cashPaid: cashPaid,
        cashChange: cashChange,
        cashier: activeCashier
    };
    
    transactionHistory.unshift(newTransaction); // Add to beginning of history
    latestCheckoutTransaction = newTransaction;
    
    // 3. Render Receipt Preview inside modal
    renderReceiptPreview(newTransaction);
    
    // 4. Reset checkout panels
    clearCart();
    
    // 5. Open modal dialog
    const modal = document.getElementById("receipt-modal-overlay");
    modal.classList.add("active");
    
    // 6. Save state to local storage
    saveStateToLocalStorage();

    // 7. Refresh states
    renderPOSProducts();
    renderStockManagement();
    renderTransactionsReport();
}

// Generate human-friendly formatted receipt for POS Preview modal
function renderReceiptPreview(trx) {
    const body = document.getElementById("receipt-modal-body");
    
    let itemsRows = "";
    trx.items.forEach(item => {
        itemsRows += `
            <div style="display:flex; justify-content:space-between; margin-bottom: 4px;">
                <div style="flex-grow:1; padding-right:10px;">
                    <div>${item.name}</div>
                    <div style="font-size:11px; color:#555;">${item.qty} x ${formatRupiah(item.price)}</div>
                </div>
                <div style="text-align:right; font-weight:600;">${formatRupiah(item.subtotal)}</div>
            </div>
        `;
    });
    
    body.innerHTML = `
        <div style="font-family:'Courier New', monospace; color:black; text-align:left; font-size:12px;">
            <div style="text-align:center; font-weight:bold; font-size:14px; margin-bottom:2px;">TOKO KOSMETIK BEAUTY</div>
            <div style="text-align:center; font-size:11px; margin-bottom:8px;">Jl. Matani, Kupang</div>
            
            <div style="border-top:1px dashed black; padding-top:6px; margin-bottom:6px; font-size:11px;">
                <div>Nota: ${trx.id}</div>
                <div>Tgl : ${formatDateTime(trx.date)}</div>
                <div>Ksr : ${trx.cashier}</div>
            </div>
            
            <div style="border-top:1px dashed black; padding-top:6px; margin-bottom:6px;">
                ${itemsRows}
            </div>
            
            <div style="border-top:1px dashed black; padding-top:6px; margin-bottom:8px; font-size:11px;">
                <div style="display:flex; justify-content:space-between;">
                    <span>Subtotal:</span>
                    <span>${formatRupiah(trx.subtotal)}</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span>Diskon:</span>
                    <span>-${formatRupiah(trx.discount)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:13px; margin-top:2px;">
                    <span>TOTAL:</span>
                    <span>${formatRupiah(trx.total)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-top:4px;">
                    <span>Tunai:</span>
                    <span>${formatRupiah(trx.cashPaid)}</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span>Kembali:</span>
                    <span>${formatRupiah(trx.cashChange)}</span>
                </div>
            </div>
            
            <div style="border-top:1px dashed black; padding-top:8px; text-align:center; font-size:11px; font-weight:bold;">
                Terima Kasih Atas Kunjungan Anda<br>
                Produk kosmetik yang sudah dibeli tidak dapat ditukar/dikembalikan.
            </div>
        </div>
    `;
}

// Generate raw printer string layout for browser thermal printing
function buildThermalPrintHTML(trx) {
    let itemsRows = "";
    trx.items.forEach(item => {
        itemsRows += `
            <div style="margin-bottom: 4px;">
                <div>${item.name}</div>
                <div style="display:flex; justify-content:space-between; padding-left:5px;">
                    <span>  ${item.qty} x ${formatRupiah(item.price)}</span>
                    <span>${formatRupiah(item.subtotal)}</span>
                </div>
            </div>
        `;
    });

    return `
        <div style="text-align: center; font-weight: bold; font-size: 11px;">TOKO KOSMETIK BEAUTY</div>
        <div style="text-align: center; font-size: 9px; margin-bottom: 6px;">Jl. Matani, Kupang</div>
        <div style="border-top: 1px dashed black; margin-bottom: 4px;"></div>
        
        <table style="width: 100%; font-size: 9px; margin-bottom: 4px;">
            <tr><td>Nota:</td><td style="text-align:right;">${trx.id}</td></tr>
            <tr><td>Tgl :</td><td style="text-align:right;">${new Date(trx.date).toLocaleString('id-ID')}</td></tr>
            <tr><td>Ksr :</td><td style="text-align:right;">${trx.cashier}</td></tr>
        </table>
        
        <div style="border-top: 1px dashed black; margin-bottom: 4px;"></div>
        <div style="font-size: 9px; margin-bottom: 4px;">
            ${itemsRows}
        </div>
        
        <div style="border-top: 1px dashed black; margin-bottom: 4px;"></div>
        <table style="width: 100%; font-size: 9px; font-weight: bold;">
            <tr><td>Subtotal:</td><td style="text-align:right;">${formatRupiah(trx.subtotal)}</td></tr>
            <tr><td>Diskon:</td><td style="text-align:right;">-${formatRupiah(trx.discount)}</td></tr>
            <tr style="font-size: 10px;"><td>TOTAL:</td><td style="text-align:right;">${formatRupiah(trx.total)}</td></tr>
            <tr style="font-weight: normal;"><td>Bayar Tunai:</td><td style="text-align:right;">${formatRupiah(trx.cashPaid)}</td></tr>
            <tr style="font-weight: normal;"><td>Kembali:</td><td style="text-align:right;">${formatRupiah(trx.cashChange)}</td></tr>
        </table>
        
        <div style="border-top: 1px dashed black; margin-top: 6px; margin-bottom: 6px;"></div>
        <div style="text-align: center; font-size: 8px; font-weight: bold;">
            Terima Kasih Atas Kunjungan Anda<br>
            Beauty Cosmetics Shop
        </div>
    `;
}

// Generate raw report print layout for browser A4 printing
function buildA4ReportHTML() {
    const today = new Date(SYSTEM_DATE_STR);
    const dateFormatted = today.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    let tableRows = "";
    let grandSubtotal = 0;
    let grandDiscount = 0;
    let grandTotal = 0;
    
    transactionHistory.forEach((trx, index) => {
        grandSubtotal += trx.subtotal;
        grandDiscount += trx.discount;
        grandTotal += trx.total;
        
        let listItems = "";
        trx.items.forEach(item => {
            listItems += `<div>- ${item.name} (${item.qty}x)</div>`;
        });
        
        tableRows += `
            <tr>
                <td style="text-align:center;">${index + 1}</td>
                <td style="font-weight:bold;">${trx.id}</td>
                <td>${new Date(trx.date).toLocaleString('id-ID')}</td>
                <td>${listItems}</td>
                <td style="text-align:right;">${formatRupiah(trx.subtotal)}</td>
                <td style="text-align:right;">${formatRupiah(trx.discount)}</td>
                <td style="text-align:right; font-weight:bold;">${formatRupiah(trx.total)}</td>
                <td>${trx.cashier}</td>
            </tr>
        `;
    });
    
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:3px double #000; padding-bottom:10px; margin-bottom:20px;">
            <div>
                <h1 style="font-family:'Outfit', sans-serif; font-size:24px; font-weight:800; margin:0;">LAPORAN TRANSAKSI PENJUALAN</h1>
                <p style="font-size:12px; color:#555; margin:5px 0 0 0;">Toko Kosmetik Beauty - Alamat: Jl. Matani, Kupang</p>
            </div>
            <div style="text-align:right; font-size:12px;">
                <div>Tanggal Cetak: <strong>${dateFormatted}</strong></div>
                <div>Waktu Cetak  : <strong>${today.toLocaleTimeString('id-ID')}</strong></div>
                <div>Petugas      : <strong>${activeCashier}</strong></div>
            </div>
        </div>
        
        <table class="print-table">
            <thead>
                <tr>
                    <th style="width:5%; text-align:center;">No</th>
                    <th style="width:15%;">No. Nota</th>
                    <th style="width:15%;">Tgl & Waktu</th>
                    <th style="width:25%;">Detail Item</th>
                    <th style="width:10%; text-align:right;">Subtotal</th>
                    <th style="width:10%; text-align:right;">Diskon</th>
                    <th style="width:12%; text-align:right;">Total Akhir</th>
                    <th style="width:8%;">Kasir</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
                <tr style="font-weight:bold; background-color:#f5f5f5;">
                    <td colspan="4" style="text-align:right; padding:10px; border-top:2px solid #000;">GRAND TOTAL PENJUALAN</td>
                    <td style="text-align:right; padding:10px; border-top:2px solid #000;">${formatRupiah(grandSubtotal)}</td>
                    <td style="text-align:right; padding:10px; border-top:2px solid #000;">${formatRupiah(grandDiscount)}</td>
                    <td style="text-align:right; padding:10px; border-top:2px solid #000; color:#e11d48; font-size:12px;">${formatRupiah(grandTotal)}</td>
                    <td style="border-top:2px solid #000;"></td>
                </tr>
            </tbody>
        </table>
        
        <div style="margin-top:50px; display:flex; justify-content:flex-end;">
            <div style="text-align:center; width:200px; font-size:12px;">
                <p>Kupang, ${dateFormatted}</p>
                <p style="margin-top:60px; font-weight:bold; border-bottom:1px solid #000; padding-bottom:3px;">${activeCashier}</p>
                <p style="margin-top:3px; font-size:10px; color:#555;">Kasir Penanggung Jawab</p>
            </div>
        </div>
    `;
}

// Print thermal receipt triggered via modal or checkouts
function triggerPrintReceipt() {
    if (!latestCheckoutTransaction) return;
    
    const container = document.getElementById("thermal-receipt-container");
    container.innerHTML = buildThermalPrintHTML(latestCheckoutTransaction);
    
    document.body.classList.add("printing-receipt");
    
    // Trigger browser printing dialog
    window.print();
    
    // Fallback/Safety to clear printing state classes
    setTimeout(() => {
        document.body.classList.remove("printing-receipt");
    }, 500);
}

// Print transaction summaries triggered via Reports tab
function triggerPrintReport() {
    if (transactionHistory.length === 0) {
        alert("Tidak ada transaksi untuk dicetak!");
        return;
    }
    
    const container = document.getElementById("a4-report-container");
    container.innerHTML = buildA4ReportHTML();
    
    document.body.classList.add("printing-report");
    
    // Trigger browser printing dialog
    window.print();
    
    // Fallback/Safety to clear printing state classes
    setTimeout(() => {
        document.body.classList.remove("printing-report");
    }, 500);
}

// ==========================================
// ROLE MULTI-USER & PRODUCT CRUD MANAGEMENT
// ==========================================

// Handle Login action
function processLogin(username, password) {
    const errorMsg = document.getElementById("login-error-msg");
    const user = credentials[username.trim().toLowerCase()];
    
    if (user && user.password === password) {
        // Successful login
        currentUser = user.name;
        activeRole = user.role;
        activeCashier = user.name;
        
        // Save session state to localStorage
        localStorage.setItem("beautypos_username", username.trim().toLowerCase());
        
        // Update DOM elements
        document.getElementById("current-cashier").textContent = user.name;
        document.getElementById("avatar-display").textContent = user.avatar;
        document.getElementById("role-display").textContent = user.role === 'admin' ? "Administrator" : "Kasir Utama";
        
        // Set body class for CSS role selections
        document.body.className = `role-${user.role}`;
        
        // Hide login modal overlay
        document.getElementById("login-section").style.display = "none";
        errorMsg.style.display = "none";
        
        // Force tab redirection to POS view
        switchTab("pos-section");
        
        // Clear login fields
        document.getElementById("login-username").value = "";
        document.getElementById("login-password").value = "";
        
        // Refresh POS list and stock listings
        renderPOSProducts();
        renderStockManagement();
        renderTransactionsReport();
        return true;
    } else {
        errorMsg.style.display = "block";
        return false;
    }
}

// Handle Logout action
function processLogout() {
    currentUser = null;
    activeRole = null;
    activeCashier = "";
    
    // Clear session state
    localStorage.removeItem("beautypos_username");
    
    // Clear cart and calculations
    clearCart();
    
    // Remove body role classes
    document.body.classList.remove("role-admin", "role-kasir");
    
    // Display login screen again
    document.getElementById("login-section").style.display = "flex";
    
    // Switch navigation back to POS internally for next login
    switchTab("pos-section");
}

// Utility to switch active views programmatically
function switchTab(sectionId) {
    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.remove("active");
        if (link.getAttribute("data-target") === sectionId) {
            link.classList.add("active");
        }
    });
    
    document.querySelectorAll(".view-section").forEach(sec => {
        sec.classList.remove("active");
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add("active");
    }
    
    const titlesMap = {
        "pos-section": "Kasir (POS)",
        "stock-section": "Manajemen Stok",
        "report-section": "Laporan Transaksi"
    };
    document.getElementById("page-title").textContent = titlesMap[sectionId] || "Dashboard";
}

// CRUD: Open modal to add product
function openAddProductModal() {
    document.getElementById("product-modal-title").textContent = "Tambah Produk Kosmetik Baru";
    document.getElementById("crud-product-id").value = "";
    document.getElementById("crud-product-name").value = "";
    document.getElementById("crud-product-variant").value = "";
    document.getElementById("crud-product-category").value = "lips";
    document.getElementById("crud-product-price").value = "";
    document.getElementById("crud-product-stock").value = "";
    
    // Set default date picker to today
    const today = new Date(SYSTEM_DATE_STR);
    const dateFormatted = today.toISOString().split("T")[0];
    document.getElementById("crud-product-expiry").value = dateFormatted;
    
    document.getElementById("product-modal-overlay").classList.add("active");
}

// CRUD: Open modal populated to edit product
function openEditProductModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    document.getElementById("product-modal-title").textContent = "Edit Detail Produk Kosmetik";
    document.getElementById("crud-product-id").value = product.id;
    document.getElementById("crud-product-name").value = product.name;
    document.getElementById("crud-product-variant").value = product.variant;
    document.getElementById("crud-product-category").value = product.category;
    document.getElementById("crud-product-price").value = product.price;
    document.getElementById("crud-product-stock").value = product.stock;
    document.getElementById("crud-product-expiry").value = product.expiryDate;
    
    document.getElementById("product-modal-overlay").classList.add("active");
}

// CRUD: Handle saving or updating product data
function saveProduct() {
    const name = document.getElementById("crud-product-name").value.trim();
    const variant = document.getElementById("crud-product-variant").value.trim();
    const category = document.getElementById("crud-product-category").value;
    const price = parseFloat(document.getElementById("crud-product-price").value) || 0;
    const stock = parseInt(document.getElementById("crud-product-stock").value) || 0;
    const expiryDate = document.getElementById("crud-product-expiry").value;
    const id = document.getElementById("crud-product-id").value;
    
    if (!name || !variant || !expiryDate) {
        alert("Harap lengkapi seluruh formulir data produk!");
        return;
    }
    
    if (id) {
        // Edit existing product
        const prod = products.find(p => p.id === id);
        if (prod) {
            prod.name = name;
            prod.variant = variant;
            prod.category = category;
            prod.price = price;
            prod.stock = stock;
            prod.expiryDate = expiryDate;
            
            // Sync with cart items if present
            cart.forEach(item => {
                if (item.product.id === id) {
                    item.product.name = name;
                    item.product.variant = variant;
                    item.product.category = category;
                    item.product.price = price;
                    item.product.stock = stock;
                    item.product.expiryDate = expiryDate;
                    if (item.qty > stock) {
                        item.qty = stock;
                    }
                }
            });
            // Remove items that now have 0 quantity due to stock reduction
            cart = cart.filter(item => item.qty > 0);
            
            alert(`Produk ${id} berhasil diperbarui!`);
        }
    } else {
        // Add new product
        // Generate new ID (e.g. PRD007)
        const idNums = products.map(p => {
            const numPart = p.id.replace("PRD", "");
            return parseInt(numPart) || 0;
        });
        const maxNum = Math.max(...idNums, 0);
        const newId = `PRD${String(maxNum + 1).padStart(3, "0")}`;
        
        products.push({
            id: newId,
            name: name,
            variant: variant,
            price: price,
            stock: stock,
            expiryDate: expiryDate,
            category: category
        });
        alert(`Produk baru ${newId} berhasil ditambahkan!`);
    }
    
    // Save to local storage
    saveStateToLocalStorage();
    
    // Close modal
    document.getElementById("product-modal-overlay").classList.remove("active");
    
    // Refresh page state and grids
    renderPOSProducts();
    renderCart();
    renderStockManagement();
    renderTransactionsReport();
}

// CRUD: Delete product with safety confirmation
function deleteProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const confirmDelete = confirm(`Apakah Anda yakin ingin menghapus produk "${product.name} (${product.variant})"?`);
    if (confirmDelete) {
        products = products.filter(p => p.id !== productId);
        
        // Remove item from cart if it is currently inside the basket
        cart = cart.filter(item => item.product.id !== productId);
        
        // Save to local storage
        saveStateToLocalStorage();
        
        alert(`Produk ${productId} berhasil dihapus dari inventaris.`);
        
        // Refresh pages
        renderPOSProducts();
        renderCart();
        renderStockManagement();
        renderTransactionsReport();
    }
}

// ==========================================
// NAVIGATION & EVENT BINDINGS
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    // 0. Restore Login Session if preserved in localStorage
    const savedUsername = localStorage.getItem("beautypos_username");
    if (savedUsername && credentials[savedUsername]) {
        const user = credentials[savedUsername];
        currentUser = user.name;
        activeRole = user.role;
        activeCashier = user.name;
        
        document.getElementById("current-cashier").textContent = user.name;
        document.getElementById("avatar-display").textContent = user.avatar;
        document.getElementById("role-display").textContent = user.role === 'admin' ? "Administrator" : "Kasir Utama";
        document.body.className = `role-${user.role}`;
        document.getElementById("login-section").style.display = "none";
    } else {
        document.getElementById("login-section").style.display = "flex";
    }

    // 1. Initialize view content renders
    renderPOSProducts();
    renderCart();
    renderStockManagement();
    renderTransactionsReport();
    
    // Set system clock display
    document.getElementById("live-clock").textContent = formatDateTime(SYSTEM_DATE_STR);
    
    // 2. Tab Navigation
    document.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            
            if (link.id === "nav-logout") return; // Handled separately
            
            const targetId = link.getAttribute("data-target");
            
            // Safety check for role access
            if (targetId === "stock-section" && activeRole !== "admin") {
                alert("Akses ditolak! Halaman ini hanya untuk Administrator.");
                switchTab("pos-section");
                return;
            }
            
            // Remove active from links
            document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
            
            // Add active to current
            link.classList.add("active");
            
            // Toggle view section
            document.querySelectorAll(".view-section").forEach(sec => sec.classList.remove("active"));
            document.getElementById(targetId).classList.add("active");
            
            // Update Top Title header
            const titlesMap = {
                "pos-section": "Kasir (POS)",
                "stock-section": "Manajemen Stok",
                "report-section": "Laporan Transaksi"
            };
            document.getElementById("page-title").textContent = titlesMap[targetId];
        });
    });

    // 3. Search and Category Filters in POS
    document.getElementById("search-product").addEventListener("input", (e) => {
        currentSearchQuery = e.target.value;
        renderPOSProducts();
    });

    document.querySelectorAll(".category-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            document.querySelectorAll(".category-chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            currentFilterCategory = chip.getAttribute("data-category");
            renderPOSProducts();
        });
    });

    // 4. Cart Discount & Payment Input changes
    document.getElementById("cart-discount").addEventListener("input", calculateTotals);
    document.getElementById("payment-cash").addEventListener("input", () => {
        const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
        const discount = parseFloat(document.getElementById("cart-discount").value) || 0;
        const total = Math.max(0, subtotal - discount);
        calculateChange(total);
    });

    // 5. Quick Pay Buttons
    document.querySelectorAll(".quick-pay-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const val = btn.getAttribute("data-val");
            const cashInput = document.getElementById("payment-cash");
            const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
            const discount = parseFloat(document.getElementById("cart-discount").value) || 0;
            const total = Math.max(0, subtotal - discount);
            
            if (val) {
                cashInput.value = parseFloat(val);
            } else if (btn.id === "quick-pay-pas") {
                cashInput.value = total;
            }
            
            calculateChange(total);
        });
    });

    // 6. Checkout button click
    document.getElementById("btn-checkout").addEventListener("click", checkout);

    // 7. Modal buttons action
    document.getElementById("btn-close-modal").addEventListener("click", () => {
        document.getElementById("receipt-modal-overlay").classList.remove("active");
    });
    
    document.getElementById("btn-print-modal-receipt").addEventListener("click", triggerPrintReceipt);

    // 8. Clear cart button
    document.getElementById("btn-clear-cart").addEventListener("click", clearCart);

    // 9. Cetak Laporan button click
    document.getElementById("btn-print-report").addEventListener("click", triggerPrintReport);

    // 10. Global Print Listener cleanups
    window.addEventListener('afterprint', () => {
        document.body.classList.remove("printing-receipt");
        document.body.classList.remove("printing-report");
    });

    // 11. Authentication Event Listeners
    document.getElementById("login-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const u = document.getElementById("login-username").value;
        const p = document.getElementById("login-password").value;
        processLogin(u, p);
    });

    document.getElementById("nav-logout").addEventListener("click", (e) => {
        e.preventDefault();
        processLogout();
    });

    // 12. Admin CRUD Stock Event Listeners
    document.getElementById("btn-add-product").addEventListener("click", openAddProductModal);
    
    document.getElementById("btn-cancel-crud").addEventListener("click", () => {
        document.getElementById("product-modal-overlay").classList.remove("active");
    });
    
    document.getElementById("btn-save-product").addEventListener("click", (e) => {
        e.preventDefault();
        saveProduct();
    });
});
