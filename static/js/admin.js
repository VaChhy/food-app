/**
 * admin.js — Admin Dashboard Logic
 * Manages orders, menu, customers, and stats
 */

let allOrders = [];
let allMenu = [];
let allCustomers = [];

// ── Init ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  applyTheme();
  const loggedIn = await checkAuth();
  if (!loggedIn) {
    window.location.href = '/admin/login';
    return;
  }
  loadDashboard();
  loadOrders();
  loadMenu();
  loadCustomers();
});

async function checkAuth() {
  try {
    const res = await fetch('/api/admin/check');
    const json = await res.json();
    return json.logged_in;
  } catch {
    return false;
  }
}

async function logout() {
  await fetch('/api/admin/logout', { method: 'POST' });
  window.location.href = '/admin/login';
}

// ── Theme ───────────────────────────────────────────────────────────────────
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('adminTheme', next);
}
function applyTheme() {
  const saved = localStorage.getItem('adminTheme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
}

// ── Sidebar ──────────────────────────────────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ── Section Navigation ────────────────────────────────────────────────────────
function showSection(name, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
  document.getElementById(`section${capitalize(name)}`).classList.add('active');
  if (btn) btn.classList.add('active');
  document.getElementById('topbarTitle').textContent = {
    dashboard: '📊 Dashboard',
    orders: '📋 Orders',
    menu: '🍛 Menu',
    customers: '👥 Customers'
  }[name] || name;

  // Close sidebar on mobile
  document.getElementById('sidebar').classList.remove('open');
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ── Dashboard Stats ──────────────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const res = await fetch('/api/admin/stats');
    const json = await res.json();
    const stats = json.data;

    document.getElementById('statsGrid').innerHTML = `
      <div class="stat-card accent-red">
        <div class="stat-icon">📋</div>
        <div class="stat-value">${stats.total_orders}</div>
        <div class="stat-label">Total Orders</div>
      </div>
      <div class="stat-card accent-yellow">
        <div class="stat-icon">⏳</div>
        <div class="stat-value">${stats.pending_orders}</div>
        <div class="stat-label">Pending Orders</div>
      </div>
      <div class="stat-card accent-green">
        <div class="stat-icon">💰</div>
        <div class="stat-value">$${stats.total_revenue.toFixed(2)}</div>
        <div class="stat-label">Total Revenue</div>
      </div>
      <div class="stat-card accent-blue">
        <div class="stat-icon">👥</div>
        <div class="stat-value">${stats.total_customers}</div>
        <div class="stat-label">Customers</div>
      </div>
    `;

    // Recent orders
    const recent = stats.recent_orders || [];
    if (!recent.length) {
      document.getElementById('recentOrders').innerHTML = '<div class="empty-cell">No orders yet</div>';
      return;
    }

    document.getElementById('recentOrders').innerHTML = `
      <div class="table-wrap" style="border:none;box-shadow:none">
        <table class="data-table">
          <thead><tr>
            <th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Time</th>
          </tr></thead>
          <tbody>
            ${recent.map(o => `<tr>
              <td><strong>${o.id}</strong></td>
              <td>${o.user_name}</td>
              <td><strong>$${parseFloat(o.total).toFixed(2)}</strong></td>
              <td><span class="badge badge-${o.status}">${statusLabel(o.status)}</span></td>
              <td>${o.created_at}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (e) {
    console.error('Dashboard error:', e);
  }
}

// ── Orders ────────────────────────────────────────────────────────────────────
async function loadOrders() {
  try {
    const res = await fetch('/api/orders');
    const json = await res.json();
    allOrders = json.data || [];
    renderOrdersTable(allOrders);
  } catch (e) {
    document.getElementById('ordersTable').innerHTML = '<div class="empty-cell">Failed to load orders</div>';
  }
}

function filterOrders() {
  const status = document.getElementById('orderFilter').value;
  const search = document.getElementById('orderSearch').value.toLowerCase();

  let filtered = allOrders;
  if (status) filtered = filtered.filter(o => o.status === status);
  if (search) filtered = filtered.filter(o =>
    o.id.toLowerCase().includes(search) ||
    o.user_name.toLowerCase().includes(search) ||
    o.phone.includes(search)
  );

  renderOrdersTable(filtered);
}

function renderOrdersTable(orders) {
  const container = document.getElementById('ordersTable');

  if (!orders.length) {
    container.innerHTML = '<div class="empty-cell" style="padding:40px">No orders found</div>';
    return;
  }

  container.innerHTML = `
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr>
          <th>Order ID</th>
          <th>Customer</th>
          <th>Phone</th>
          <th>Items</th>
          <th>Total</th>
          <th>Status</th>
          <th>Time</th>
          <th>Actions</th>
        </tr></thead>
        <tbody>
          ${orders.map(o => `<tr>
            <td><strong>${o.id}</strong></td>
            <td>
              <div>${o.user_name}</div>
              ${o.telegram_id ? `<div style="font-size:10px;color:var(--text3)">ID: ${o.telegram_id}</div>` : ''}
            </td>
            <td>${o.phone}</td>
            <td>
              <div style="max-width:200px;font-size:12px;color:var(--text2)">
                ${o.items.map(i => `${i.name_en} x${i.quantity}`).join(', ')}
              </div>
              ${o.note ? `<div style="font-size:11px;color:var(--text3);margin-top:2px">📝 ${o.note}</div>` : ''}
            </td>
            <td><strong>$${parseFloat(o.total).toFixed(2)}</strong></td>
            <td>
              <span class="badge badge-${o.status}">${statusLabel(o.status)}</span>
              ${o.reject_reason ? `<div style="font-size:10px;color:var(--danger);margin-top:4px">${o.reject_reason}</div>` : ''}
            </td>
            <td style="font-size:11px;color:var(--text3)">${o.created_at}</td>
            <td>
              <div class="action-btns">
                ${o.status === 'pending' ? `
                  <button class="btn-accept" onclick="acceptOrder('${o.id}')">✅ Accept</button>
                  <button class="btn-reject" onclick="openRejectModal('${o.id}')">❌ Reject</button>
                ` : `<span style="font-size:11px;color:var(--text3)">—</span>`}
              </div>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

async function acceptOrder(orderId) {
  if (!confirm(`Accept order ${orderId}?`)) return;

  try {
    const res = await fetch(`/api/orders/${orderId}/accept`, { method: 'POST' });
    const json = await res.json();

    if (json.success) {
      showAlert('✅ Order accepted! Customer has been notified.', 'success');
      loadOrders();
      loadDashboard();
    } else {
      showAlert(json.message || 'Failed to accept order', 'error');
    }
  } catch (e) {
    showAlert('Connection error', 'error');
  }
}

function openRejectModal(orderId) {
  document.getElementById('rejectOrderId').value = orderId;
  document.getElementById('rejectModal').classList.add('active');
}

async function confirmReject() {
  const orderId = document.getElementById('rejectOrderId').value;
  const reason = document.getElementById('rejectReason').value;

  try {
    const res = await fetch(`/api/orders/${orderId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    const json = await res.json();

    if (json.success) {
      document.getElementById('rejectModal').classList.remove('active');
      showAlert('Order rejected. Customer has been notified.', 'info');
      loadOrders();
      loadDashboard();
    } else {
      showAlert(json.message || 'Failed', 'error');
    }
  } catch (e) {
    showAlert('Connection error', 'error');
  }
}

// ── Menu Management ───────────────────────────────────────────────────────────
async function loadMenu() {
  try {
    const res = await fetch('/api/menu');
    const json = await res.json();
    allMenu = json.data || [];
    renderMenuTable(allMenu);
  } catch (e) {
    document.getElementById('menuTable').innerHTML = '<div class="empty-cell">Failed to load menu</div>';
  }
}

function renderMenuTable(items) {
  const container = document.getElementById('menuTable');

  if (!items.length) {
    container.innerHTML = '<div class="empty-cell" style="padding:40px">No menu items yet. Add your first item!</div>';
    return;
  }

  container.innerHTML = `
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr>
          <th>Image</th><th>Name</th><th>Category</th>
          <th>Price</th><th>Available</th><th>Actions</th>
        </tr></thead>
        <tbody>
          ${items.map(item => `<tr>
            <td><img class="food-thumb" src="${item.image}" alt="${item.name_en}"
              onerror="this.src='/static/images/placeholder-food.jpg'" /></td>
            <td>
              <div style="font-weight:600">${item.name_en}</div>
              <div style="font-size:11px;color:var(--text3)">${item.name_km || ''}</div>
            </td>
            <td><span class="badge badge-pending" style="text-transform:capitalize">${item.category}</span></td>
            <td><strong>$${parseFloat(item.price).toFixed(2)}</strong></td>
            <td>
              <label class="toggle">
                <input type="checkbox" ${item.available ? 'checked' : ''}
                  onchange="toggleItem('${item.id}')" />
                <span class="toggle-slider"></span>
              </label>
            </td>
            <td>
              <div class="action-btns">
                <button class="btn-edit" onclick="openEditModal('${item.id}')">✏️ Edit</button>
                <button class="btn-delete" onclick="deleteMenuItem('${item.id}')">🗑️ Delete</button>
              </div>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function openAddMenuModal() {
  document.getElementById('modalTitle').textContent = 'Add Menu Item';
  document.getElementById('menuItemId').value = '';
  document.getElementById('fNameEn').value = '';
  document.getElementById('fNameKm').value = '';
  document.getElementById('fDescEn').value = '';
  document.getElementById('fDescKm').value = '';
  document.getElementById('fPrice').value = '';
  document.getElementById('fCategory').value = 'main';
  document.getElementById('fAvailable').checked = true;
  document.getElementById('fImage').value = '';
  document.getElementById('imgPreview').style.display = 'none';
  document.getElementById('menuModal').classList.add('active');
}

function openEditModal(itemId) {
  const item = allMenu.find(i => i.id === itemId);
  if (!item) return;

  document.getElementById('modalTitle').textContent = 'Edit Menu Item';
  document.getElementById('menuItemId').value = item.id;
  document.getElementById('fNameEn').value = item.name_en;
  document.getElementById('fNameKm').value = item.name_km || '';
  document.getElementById('fDescEn').value = item.description_en || '';
  document.getElementById('fDescKm').value = item.description_km || '';
  document.getElementById('fPrice').value = item.price;
  document.getElementById('fCategory').value = item.category;
  document.getElementById('fAvailable').checked = item.available;

  const preview = document.getElementById('imgPreview');
  if (item.image) {
    preview.src = item.image;
    preview.style.display = 'block';
  } else {
    preview.style.display = 'none';
  }

  document.getElementById('menuModal').classList.add('active');
}

function previewImage() {
  const input = document.getElementById('fImage');
  const preview = document.getElementById('imgPreview');
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = e => { preview.src = e.target.result; preview.style.display = 'block'; };
    reader.readAsDataURL(input.files[0]);
  }
}

async function saveMenuItem() {
  const itemId = document.getElementById('menuItemId').value;
  const btn = document.getElementById('saveMenuBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Saving...';

  const formData = new FormData();
  formData.append('name_en', document.getElementById('fNameEn').value);
  formData.append('name_km', document.getElementById('fNameKm').value);
  formData.append('description_en', document.getElementById('fDescEn').value);
  formData.append('description_km', document.getElementById('fDescKm').value);
  formData.append('price', document.getElementById('fPrice').value);
  formData.append('category', document.getElementById('fCategory').value);
  formData.append('available', document.getElementById('fAvailable').checked);

  const imageFile = document.getElementById('fImage').files[0];
  if (imageFile) formData.append('image', imageFile);

  try {
    const url = itemId ? `/api/menu/${itemId}` : '/api/menu';
    const method = itemId ? 'PUT' : 'POST';

    const res = await fetch(url, { method, body: formData });
    const json = await res.json();

    if (json.success) {
      closeMenuModal();
      showAlert(`Menu item ${itemId ? 'updated' : 'added'} successfully!`, 'success');
      loadMenu();
    } else {
      showAlert(json.message || 'Failed to save', 'error');
    }
  } catch (e) {
    showAlert('Connection error', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '💾 Save';
  }
}

async function toggleItem(itemId) {
  try {
    await fetch(`/api/menu/${itemId}/toggle`, { method: 'POST' });
    loadMenu();
  } catch (e) {
    showAlert('Failed to toggle', 'error');
  }
}

async function deleteMenuItem(itemId) {
  if (!confirm('Delete this menu item? This cannot be undone.')) return;

  try {
    const res = await fetch(`/api/menu/${itemId}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      showAlert('Item deleted', 'info');
      loadMenu();
    }
  } catch (e) {
    showAlert('Failed to delete', 'error');
  }
}

function closeMenuModal() {
  document.getElementById('menuModal').classList.remove('active');
}

// ── Customers ─────────────────────────────────────────────────────────────────
async function loadCustomers() {
  try {
    const res = await fetch('/api/orders');
    const json = await res.json();
    const orders = json.data || [];

    // Derive customers from orders
    const customerMap = {};
    orders.forEach(o => {
      const id = o.telegram_id || o.phone;
      if (!customerMap[id]) {
        customerMap[id] = {
          name: o.user_name,
          phone: o.phone,
          telegram_id: o.telegram_id,
          orders: 0,
          spent: 0,
          last_order: o.created_at
        };
      }
      customerMap[id].orders++;
      if (o.status === 'accepted') customerMap[id].spent += parseFloat(o.total);
      if (o.created_at > customerMap[id].last_order) customerMap[id].last_order = o.created_at;
    });

    allCustomers = Object.values(customerMap);
    renderCustomersTable(allCustomers);
  } catch (e) {
    document.getElementById('customersTable').innerHTML = '<div class="empty-cell">Failed to load</div>';
  }
}

function renderCustomersTable(customers) {
  const container = document.getElementById('customersTable');

  if (!customers.length) {
    container.innerHTML = '<div class="empty-cell" style="padding:40px">No customers yet</div>';
    return;
  }

  container.innerHTML = `
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr>
          <th>Name</th><th>Telegram ID</th><th>Phone</th>
          <th>Orders</th><th>Total Spent</th><th>Last Order</th>
        </tr></thead>
        <tbody>
          ${customers.map(c => `<tr>
            <td><strong>${c.name}</strong></td>
            <td>${c.telegram_id ? `<code>${c.telegram_id}</code>` : '—'}</td>
            <td>${c.phone}</td>
            <td>${c.orders}</td>
            <td><strong>$${c.spent.toFixed(2)}</strong></td>
            <td style="font-size:11px;color:var(--text3)">${c.last_order}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

// ── Modal Helpers ─────────────────────────────────────────────────────────────
function closeModal(event) {
  if (event.target.classList.contains('modal-overlay')) {
    event.target.classList.remove('active');
  }
}

// ── Alert / Toast ─────────────────────────────────────────────────────────────
function showAlert(message, type = 'info') {
  const existing = document.getElementById('adminAlert');
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.id = 'adminAlert';
  el.style.cssText = `
    position:fixed;top:80px;right:20px;z-index:9999;
    padding:14px 20px;border-radius:10px;font-size:13px;font-weight:500;
    background:${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--info)'};
    color:white;box-shadow:0 4px 20px rgba(0,0,0,0.2);
    animation:slideIn 0.3s ease;max-width:320px;
  `;
  el.textContent = message;

  const style = document.createElement('style');
  style.textContent = '@keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}';
  document.head.appendChild(style);

  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3500);
}

// ── Status Label ──────────────────────────────────────────────────────────────
function statusLabel(status) {
  return { pending: '⏳ Pending', accepted: '✅ Accepted', rejected: '❌ Rejected', delivered: '🚀 Delivered' }[status] || status;
}
