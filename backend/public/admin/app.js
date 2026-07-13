const API = '/admin';
const AUTH = '/auth';

const tokenStore = {
    get: () => localStorage.getItem('admin_token'),
    set: (t) => localStorage.setItem('admin_token', t),
    clear: () => localStorage.removeItem('admin_token')
};

const $ = (sel) => document.querySelector(sel);

async function api(path, options = {}) {
    const res = await fetch(`${API}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(tokenStore.get() ? { Authorization: `Bearer ${tokenStore.get()}` } : {}),
            ...(options.headers || {})
        }
    });
    if (res.status === 401 && path !== '/dashboard') {
        tokenStore.clear();
        showLogin();
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
    return data.data;
}

/* ----------------------------- Auth ----------------------------- */
$('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('#login-error').hidden = true;
    try {
        const res = await fetch(`${AUTH}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: $('#login-email').value,
                password: $('#login-password').value
            })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Login failed');
        if (data.data.user.role !== 'admin') throw new Error('Not an admin account');
        tokenStore.set(data.data.token);
        showApp();
    } catch (err) {
        $('#login-error').textContent = err.message;
        $('#login-error').hidden = false;
    }
});

$('#logout-btn').addEventListener('click', () => {
    tokenStore.clear();
    showLogin();
});

function showLogin() {
    $('#login-view').hidden = false;
    $('#app-view').hidden = true;
}
function showApp() {
    $('#login-view').hidden = true;
    $('#app-view').hidden = false;
    try {
        const payload = JSON.parse(atob(tokenStore.get().split('.')[1]));
        $('#admin-email').textContent = payload.email || 'admin';
    } catch (_) {}
    loadDashboard();
}

/* --------------------------- Navigation ------------------------- */
document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const view = btn.dataset.view;
        document.querySelectorAll('.panel').forEach((p) => (p.hidden = p.dataset.panel !== view));
        if (view === 'dashboard') loadDashboard();
        if (view === 'products') loadProducts();
        if (view === 'orders') loadOrders();
        if (view === 'users') loadUsers();
        if (view === 'activity') loadActivity();
    });
});

/* --------------------------- Dashboard -------------------------- */
async function loadDashboard() {
    const { metrics, dailySales } = await api('/dashboard');
    $('#metric-cards').innerHTML = [
        ['Total Revenue', `$${Number(metrics.totalRevenue).toFixed(2)}`],
        ['Total Orders', metrics.totalOrders],
        ['Paid Orders', metrics.paidOrders],
        ['Avg Order Value', `$${Number(metrics.avgOrderValue).toFixed(2)}`],
        ['Total Users', metrics.totalUsers],
        ['Total Products', metrics.totalProducts]
    ].map(([label, value]) => `<div class="metric-card"><div class="label">${label}</div><div class="value">${value}</div></div>`).join('');

    const tbody = $('#daily-sales-table tbody');
    tbody.innerHTML = dailySales.map((d) =>
        `<tr><td>${d.date}</td><td>${d.orders}</td><td>$${Number(d.revenue).toFixed(2)}</td></tr>`
    ).join('');
}

/* --------------------------- Products --------------------------- */
async function loadProducts() {
    const { items } = await api('/products?limit=50');
    $('#products-table tbody').innerHTML = items.map((p) => `
        <tr>
            <td>${p.id}</td><td>${escapeHtml(p.name)}</td><td>${escapeHtml(p.category)}</td>
            <td>$${Number(p.price).toFixed(2)}</td><td>${p.stock}</td>
            <td class="row-actions">
                <button class="link-btn" onclick="editProduct(${p.id})">Edit</button>
                <button class="link-btn" onclick="deleteProduct(${p.id})">Delete</button>
            </td>
        </tr>`).join('');
}

async function editProduct(id) {
    const { product } = await api(`/products/${id}`);
    openProductModal(product);
}
function openProductModal(product = {}) {
    $('#product-modal-title').textContent = product.id ? 'Edit Product' : 'New Product';
    $('#product-id').value = product.id || '';
    $('#product-name').value = product.name || '';
    $('#product-category').value = product.category || '';
    $('#product-material').value = product.material || '';
    $('#product-price').value = product.price || '';
    $('#product-stock').value = product.stock ?? 0;
    $('#product-description').value = product.description || '';
    $('#product-modal').hidden = false;
}
$('#product-new').addEventListener('click', () => openProductModal());
$('#product-cancel').addEventListener('click', () => ($('#product-modal').hidden = true));

$('#product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = $('#product-id').value;
    const payload = {
        name: $('#product-name').value,
        category: $('#product-category').value,
        material: $('#product-material').value,
        price: Number($('#product-price').value),
        stock: Number($('#product-stock').value),
        description: $('#product-description').value
    };
    if (id) await api(`/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    else await api('/products', { method: 'POST', body: JSON.stringify(payload) });
    $('#product-modal').hidden = true;
    loadProducts();
});

window.deleteProduct = async (id) => {
    if (!confirm('Delete product #' + id + '?')) return;
    await api(`/products/${id}`, { method: 'DELETE' });
    loadProducts();
};

/* ---------------------------- Orders ---------------------------- */
async function loadOrders() {
    const { items } = await api('/orders?limit=50');
    $('#orders-table tbody').innerHTML = items.map((o) => `
        <tr>
            <td>${o.id}</td>
            <td>${o.user ? escapeHtml(o.user.email) : o.userId}</td>
            <td>$${Number(o.total).toFixed(2)}</td>
            <td><span class="badge ${o.status}">${o.status}</span></td>
            <td>${new Date(o.createdAt).toLocaleDateString()}</td>
            <td class="row-actions">
                <select onchange="updateOrderStatus(${o.id}, this.value)">
                    ${['pending', 'paid', 'shipped', 'canceled'].map((s) =>
                        `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
            </td>
        </tr>`).join('');
}
window.updateOrderStatus = async (id, status) => {
    await api(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    loadOrders();
};

/* ----------------------------- Users ---------------------------- */
async function loadUsers() {
    const { items } = await api('/users?limit=50');
    $('#users-table tbody').innerHTML = items.map((u) => `
        <tr>
            <td>${u.id}</td>
            <td>${escapeHtml((u.firstName || '') + ' ' + (u.lastName || ''))}</td>
            <td>${escapeHtml(u.email)}</td>
            <td>
                <select onchange="updateUserRole(${u.id}, this.value)">
                    ${['customer', 'admin'].map((r) =>
                        `<option value="${r}" ${r === u.role ? 'selected' : ''}>${r}</option>`).join('')}
                </select>
            </td>
            <td><span class="badge ${u.isActive ? 'active' : 'inactive'}">${u.isActive ? 'active' : 'inactive'}</span></td>
            <td class="row-actions">
                <button class="link-btn" onclick="toggleUserStatus(${u.id}, ${!u.isActive})">${u.isActive ? 'Deactivate' : 'Activate'}</button>
                <button class="link-btn" onclick="deleteUser(${u.id})">Delete</button>
            </td>
        </tr>`).join('');
}
window.updateUserRole = async (id, role) => {
    await api(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });
    loadUsers();
};
window.toggleUserStatus = async (id, isActive) => {
    await api(`/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) });
    loadUsers();
};
window.deleteUser = async (id) => {
    if (!confirm('Delete user #' + id + '? This cannot be undone.')) return;
    await api(`/users/${id}`, { method: 'DELETE' });
    loadUsers();
};

/* --------------------------- Activity --------------------------- */
async function loadActivity() {
    const { items } = await api('/logs?limit=50');
    $('#activity-table tbody').innerHTML = items.map((l) => `
        <tr>
            <td>${new Date(l.createdAt).toLocaleString()}</td>
            <td>${escapeHtml(l.adminEmail || '')}</td>
            <td>${escapeHtml(l.action)}</td>
            <td>${escapeHtml(l.entity)}</td>
            <td>${l.entityId ?? ''}</td>
        </tr>`).join('');
}

function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ----------------------------- Boot ----------------------------- */
if (tokenStore.get()) showApp();
else showLogin();
