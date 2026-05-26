/**
 * app.js — Telegram Food Order Mini App
 * Full frontend logic: Telegram WebApp, cart, orders, i18n, theme
 */

// ── Telegram WebApp Init ──────────────────────────────────────────────────────
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  // Use Telegram theme if available
  if (tg.colorScheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  }
}

const TG_USER = tg?.initDataUnsafe?.user || null;

// ── State ─────────────────────────────────────────────────────────────────────
let menuData = [];
let currentCategory = 'all';
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let lang = localStorage.getItem('lang') || 'en';
let currentPage = 'pageHome';

// ── i18n Translations ──────────────────────────────────────────────────────
const i18n = {
  en: {
    loading: 'Loading menu...',
    brandName: 'Food Order',
    brandSub: 'Fresh & Delicious',
    greeting: 'Good day! 👋',
    heroTitle: 'What would you like to eat?',
    heroSub: 'Fresh food delivered to your door',
    searchPlaceholder: 'Search food...',
    catTitle: 'Categories',
    menuTitle: 'Menu',
    navHome: 'Home',
    navCart: 'Cart',
    navOrders: 'Orders',
    cartTitle: 'My Cart',
    cartEmpty: 'Your cart is empty',
    cartEmptySub: 'Browse the menu and add your favorites!',
    clearCart: 'Clear All',
    subtotal: 'Subtotal',
    delivery: 'Delivery',
    total: 'Total',
    checkout: 'Proceed to Checkout',
    checkoutTitle: 'Checkout',
    deliveryInfo: '📍 Delivery Information',
    orderSummaryTitle: '🛒 Order Summary',
    labelName: 'Your Name',
    labelPhone: 'Phone Number',
    labelAddress: 'Delivery Address',
    labelNote: 'Note (optional)',
    placeOrder: '🍽️ Place Order',
    ordersTitle: 'My Orders',
    ordersEmpty: 'No orders yet',
    ordersEmptySub: 'Your order history will appear here',
    statusPending: '⏳ Pending',
    statusAccepted: '✅ Accepted',
    statusRejected: '❌ Rejected',
    statusDelivered: '🚀 Delivered',
    catAll: 'All',
    catMain: '🍛 Main',
    catNoodle: '🍜 Noodle',
    catDessert: '🍮 Dessert',
    catDrink: '🥤 Drink',
    catAppetizer: '🥗 Appetizer',
    unavailable: 'Unavailable',
    addedToCart: 'Added to cart!',
    orderPlaced: '✅ Order placed successfully!',
    orderError: '❌ Failed to place order',
    fillRequired: 'Please fill all required fields',
    free: 'Free',
    rejectReason: 'Reason: ',
  },
  km: {
    loading: 'កំពុងផ្ទុក...',
    brandName: 'ការបញ្ជាទិញ',
    brandSub: 'ស្រស់ & においs',
    greeting: 'សួស្ដី! 👋',
    heroTitle: 'អ្នកចង់ញ៉ាំអ្វី?',
    heroSub: 'អាហារស្រស់ដឹកជញ្ជូនដល់ទ្វាររបស់អ្នក',
    searchPlaceholder: 'ស្វែងរកអាហារ...',
    catTitle: 'ប្រភេទ',
    menuTitle: 'ម៉ឺនុយ',
    navHome: 'ផ្ទះ',
    navCart: 'រទេះ',
    navOrders: 'ការបញ្ជាទិញ',
    cartTitle: 'រទេះខ្ញុំ',
    cartEmpty: 'រទេះរបស់អ្នកទទេ',
    cartEmptySub: 'រុករកម៉ឺនុយ ហើយបន្ថែមចំណូលចិត្ត!',
    clearCart: 'លុបទាំងអស់',
    subtotal: 'តម្លៃរង',
    delivery: 'ដឹកជញ្ជូន',
    total: 'សរុប',
    checkout: 'បន្តការបង់ប្រាក់',
    checkoutTitle: 'ការទូទាត់',
    deliveryInfo: '📍 ព័ត៌មានដឹកជញ្ជូន',
    orderSummaryTitle: '🛒 សង្ខេបការបញ្ជាទិញ',
    labelName: 'ឈ្មោះ',
    labelPhone: 'លេខទូរស័ព្ទ',
    labelAddress: 'អាសយដ្ឋានដឹកជញ្ជូន',
    labelNote: 'កំណត់ចំណាំ (ស្រេចចិត្ត)',
    placeOrder: '🍽️ ដាក់ការបញ្ជាទិញ',
    ordersTitle: 'ការបញ្ជាទិញរបស់ខ្ញុំ',
    ordersEmpty: 'មិនទាន់មានការបញ្ជាទិញ',
    ordersEmptySub: 'ប្រវត្តិការបញ្ជាទិញរបស់អ្នកនឹងបង្ហាញនៅទីនេះ',
    statusPending: '⏳ កំពុងរង់ចាំ',
    statusAccepted: '✅ ទទួលយកបានហើយ',
    statusRejected: '❌ បដិសេធ',
    statusDelivered: '🚀 ដឹកជញ្ជូន',
    catAll: 'ទាំងអស់',
    catMain: '🍛 មុខម្ហូបចម្បង',
    catNoodle: '🍜 មីស',
    catDessert: '🍮 បង្អែម',
    catDrink: '🥤 ភេសជ្ជៈ',
    catAppetizer: '🥗 ចាន់ first',
    unavailable: 'មិនមាន',
    addedToCart: 'បានបន្ថែមទៅរទេះ!',
    orderPlaced: '✅ ការបញ្ជាទិញបានជោគជ័យ!',
    orderError: '❌ បរាជ័យក្នុងការបញ្ជាទិញ',
    fillRequired: 'សូមបំពេញព័ត៌មានទាំងអស់',
    free: 'ឥតគិតថ្លៃ',
    rejectReason: 'មូលហេតុ: ',
  }
};

function t(key) { return i18n[lang][key] || i18n.en[key] || key; }

const CATEGORIES = [
  { id: 'all', emoji: '🍽️' },
  { id: 'main', emoji: '🍛' },
  { id: 'noodle', emoji: '🍜' },
  { id: 'dessert', emoji: '🍮' },
  { id: 'drink', emoji: '🥤' },
  { id: 'appetizer', emoji: '🥗' },
];

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  applyLang();
  updateCartBadge();
  loadMenu();
  registerTelegramUser();

  // Pre-fill name from Telegram user
  if (TG_USER) {
    const nameInput = document.getElementById('inputName');
    if (nameInput) nameInput.value = `${TG_USER.first_name || ''} ${TG_USER.last_name || ''}`.trim();
  }
});

// ── Telegram User Registration ────────────────────────────────────────────────
function registerTelegramUser() {
  if (!TG_USER) return;
  fetch('/api/users/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TG_USER)
  }).catch(() => {});
}

// ── Menu Loading ──────────────────────────────────────────────────────────────
async function loadMenu() {
  try {
    const res = await fetch('/api/menu?available=true');
    const json = await res.json();
    menuData = json.data || [];
    hideLoader();
    renderCategories();
    renderMenu(menuData);
  } catch (e) {
    hideLoader();
    showToast('❌ Failed to load menu', 'error');
    renderMenu([]);
  }
}

function hideLoader() {
  const screen = document.getElementById('loadingScreen');
  const wrapper = document.getElementById('appWrapper');
  screen.classList.add('hidden');
  wrapper.style.display = 'flex';
  setTimeout(() => screen.remove(), 400);
}

// ── Categories ────────────────────────────────────────────────────────────────
function renderCategories() {
  const container = document.getElementById('categoriesScroll');
  container.innerHTML = CATEGORIES.map(cat => {
    const label = cat.id === 'all' ? t('catAll')
      : cat.id === 'main' ? t('catMain')
      : cat.id === 'noodle' ? t('catNoodle')
      : cat.id === 'dessert' ? t('catDessert')
      : cat.id === 'drink' ? t('catDrink')
      : t('catAppetizer');
    return `<button class="cat-chip ${cat.id === currentCategory ? 'active' : ''}"
      onclick="filterCategory('${cat.id}')">${label}</button>`;
  }).join('');
}

function filterCategory(catId) {
  currentCategory = catId;
  renderCategories();
  const filtered = catId === 'all' ? menuData : menuData.filter(i => i.category === catId);
  renderMenu(filtered);
  clearSearchInput();
}

// ── Menu Rendering ────────────────────────────────────────────────────────────
function renderMenu(items) {
  const grid = document.getElementById('menuGrid');
  const count = document.getElementById('menuCount');
  count.textContent = items.length ? `${items.length} items` : '';

  if (!items.length) {
    grid.innerHTML = `<div class="empty-state">
      <div class="empty-icon">🍽️</div>
      <div class="empty-title">${t('ordersEmpty')}</div>
    </div>`;
    return;
  }

  grid.innerHTML = items.map((item, idx) => `
    <div class="food-card ${!item.available ? 'unavailable' : ''}"
      style="animation-delay:${idx * 0.05}s"
      onclick="openFoodDetail('${item.id}')">
      <div class="food-img-wrap">
        <img class="food-img" src="${item.image || '/static/images/placeholder-food.jpg'}"
          alt="${item.name_en}" loading="lazy"
          onerror="this.src='/static/images/placeholder-food.jpg'" />
        ${!item.available
          ? `<span class="food-badge badge-unavail">${t('unavailable')}</span>`
          : `<span class="food-badge">$${parseFloat(item.price).toFixed(2)}</span>`}
      </div>
      <div class="food-body">
        <div class="food-name">${lang === 'km' && item.name_km ? item.name_km : item.name_en}</div>
        <div class="food-desc">${lang === 'km' && item.description_km ? item.description_km : item.description_en}</div>
        <div class="food-footer">
          <span class="food-price">$${parseFloat(item.price).toFixed(2)}</span>
          ${item.available
            ? `<button class="btn-add" onclick="addToCartFromGrid(event,'${item.id}')">+</button>`
            : ''}
        </div>
      </div>
    </div>`).join('');
}

// ── Search ────────────────────────────────────────────────────────────────────
function searchMenu() {
  const query = document.getElementById('searchInput').value.toLowerCase().trim();
  const clearBtn = document.getElementById('searchClear');
  clearBtn.style.display = query ? 'block' : 'none';

  let pool = currentCategory === 'all' ? menuData : menuData.filter(i => i.category === currentCategory);
  if (query) {
    pool = pool.filter(i =>
      i.name_en.toLowerCase().includes(query) ||
      (i.name_km && i.name_km.includes(query)) ||
      (i.description_en && i.description_en.toLowerCase().includes(query))
    );
  }
  renderMenu(pool);
}

function clearSearch() {
  document.getElementById('searchInput').value = '';
  document.getElementById('searchClear').style.display = 'none';
  filterCategory(currentCategory);
}

function clearSearchInput() {
  document.getElementById('searchInput').value = '';
  document.getElementById('searchClear').style.display = 'none';
}

// ── Cart ──────────────────────────────────────────────────────────────────────
function addToCartFromGrid(e, itemId) {
  e.stopPropagation();
  addToCart(itemId);
}

function addToCart(itemId) {
  const item = menuData.find(i => i.id === itemId);
  if (!item || !item.available) return;

  const existing = cart.find(c => c.id === itemId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...item, quantity: 1 });
  }

  saveCart();
  updateCartBadge();
  showToast(`${t('addedToCart')} ${lang === 'km' && item.name_km ? item.name_km : item.name_en}`, 'success');

  // Haptic feedback
  tg?.HapticFeedback?.impactOccurred('light');
}

function removeFromCart(itemId) {
  cart = cart.filter(c => c.id !== itemId);
  saveCart();
  updateCartBadge();
  renderCart();
}

function updateQty(itemId, delta) {
  const item = cart.find(c => c.id === itemId);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    removeFromCart(itemId);
    return;
  }
  saveCart();
  updateCartBadge();
  renderCart();
}

function clearCart() {
  if (!cart.length) return;
  cart = [];
  saveCart();
  updateCartBadge();
  renderCart();
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function getCartTotal() {
  return cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

function updateCartBadge() {
  const total = cart.reduce((sum, i) => sum + i.quantity, 0);
  const badge = document.getElementById('cartBadge');
  if (total > 0) {
    badge.style.display = 'flex';
    badge.textContent = total > 99 ? '99+' : total;
  } else {
    badge.style.display = 'none';
  }
}

function renderCart() {
  const content = document.getElementById('cartContent');
  const summary = document.getElementById('cartSummary');

  if (!cart.length) {
    content.innerHTML = `<div class="empty-state">
      <div class="empty-icon">🛒</div>
      <div class="empty-title">${t('cartEmpty')}</div>
      <div class="empty-sub">${t('cartEmptySub')}</div>
    </div>`;
    summary.style.display = 'none';
    return;
  }

  content.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img class="cart-item-img" src="${item.image || '/static/images/placeholder-food.jpg'}"
        alt="${item.name_en}" onerror="this.src='/static/images/placeholder-food.jpg'" />
      <div class="cart-item-info">
        <div class="cart-item-name">${lang === 'km' && item.name_km ? item.name_km : item.name_en}</div>
        <div class="cart-item-price">$${parseFloat(item.price).toFixed(2)}</div>
        <div class="qty-control">
          <button class="qty-btn" onclick="updateQty('${item.id}', -1)">−</button>
          <span class="qty-value">${item.quantity}</span>
          <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
        </div>
      </div>
      <div class="cart-item-subtotal">$${(item.price * item.quantity).toFixed(2)}</div>
    </div>`).join('');

  const total = getCartTotal();
  document.getElementById('cartSubtotal').textContent = `$${total.toFixed(2)}`;
  document.getElementById('cartTotal').innerHTML = `<strong>$${total.toFixed(2)}</strong>`;
  summary.style.display = 'block';
}

// ── Checkout ──────────────────────────────────────────────────────────────────
function goToCheckout() {
  if (!cart.length) return;
  renderCheckoutSummary();
  switchPage('pageCheckout');
  document.getElementById('bottomNav').style.display = 'none';
  document.getElementById('btnBack').style.display = 'flex';
}

function goBack() {
  switchPage('pageCart');
  document.getElementById('bottomNav').style.display = 'flex';
  document.getElementById('btnBack').style.display = 'none';
}

function renderCheckoutSummary() {
  const container = document.getElementById('checkoutItems');
  container.innerHTML = cart.map(item => `
    <div class="checkout-item">
      <span>${lang === 'km' && item.name_km ? item.name_km : item.name_en} x${item.quantity}</span>
      <span>$${(item.price * item.quantity).toFixed(2)}</span>
    </div>`).join('');
  document.getElementById('checkoutTotal').innerHTML = `<strong>$${getCartTotal().toFixed(2)}</strong>`;
}

async function placeOrder() {
  const name = document.getElementById('inputName').value.trim();
  const phone = document.getElementById('inputPhone').value.trim();
  const address = document.getElementById('inputAddress').value.trim();
  const note = document.getElementById('inputNote').value.trim();

  if (!phone || !address) {
    showToast(t('fillRequired'), 'error');
    return;
  }

  const btn = document.getElementById('btnPlaceOrder');
  btn.disabled = true;
  document.getElementById('placeOrderText').textContent = '⏳ Placing order...';

  const orderData = {
    telegram_id: TG_USER?.id || '',
    user_name: name || (TG_USER ? `${TG_USER.first_name || ''} ${TG_USER.last_name || ''}`.trim() : 'Guest'),
    user_info: TG_USER || null,
    phone,
    delivery_address: address,
    note,
    items: cart.map(i => ({
      id: i.id,
      name_en: i.name_en,
      name_km: i.name_km,
      price: i.price,
      quantity: i.quantity,
      subtotal: parseFloat((i.price * i.quantity).toFixed(2))
    })),
    total: parseFloat(getCartTotal().toFixed(2))
  };

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    const json = await res.json();

    if (json.success) {
      cart = [];
      saveCart();
      updateCartBadge();
      showToast(t('orderPlaced'), 'success');
      tg?.HapticFeedback?.notificationOccurred('success');

      // Go to orders page
      document.getElementById('bottomNav').style.display = 'flex';
      document.getElementById('btnBack').style.display = 'none';
      switchPage('pageOrders');
      document.querySelector('[data-page="pageOrders"]').click();
      loadOrders();
    } else {
      showToast(json.message || t('orderError'), 'error');
    }
  } catch (e) {
    showToast(t('orderError'), 'error');
  } finally {
    btn.disabled = false;
    document.getElementById('placeOrderText').textContent = t('placeOrder');
  }
}

// ── Orders ────────────────────────────────────────────────────────────────────
async function loadOrders() {
  const container = document.getElementById('ordersContent');
  container.innerHTML = `<div class="empty-state"><div class="loader-spinner"></div></div>`;

  const userId = TG_USER?.id;
  if (!userId) {
    container.innerHTML = `<div class="empty-state">
      <div class="empty-icon">📱</div>
      <div class="empty-title">Open via Telegram</div>
      <div class="empty-sub">Please open this app inside Telegram to view orders</div>
    </div>`;
    return;
  }

  try {
    const res = await fetch(`/api/orders/user/${userId}`);
    const json = await res.json();
    const orders = json.data || [];

    if (!orders.length) {
      container.innerHTML = `<div class="empty-state">
        <div class="empty-icon">📋</div>
        <div class="empty-title">${t('ordersEmpty')}</div>
        <div class="empty-sub">${t('ordersEmptySub')}</div>
      </div>`;
      return;
    }

    const statusMap = {
      pending: t('statusPending'),
      accepted: t('statusAccepted'),
      rejected: t('statusRejected'),
      delivered: t('statusDelivered'),
    };

    container.innerHTML = orders.map((order, idx) => `
      <div class="order-card" style="animation-delay:${idx * 0.05}s">
        <div class="order-header">
          <span class="order-id">📋 ${order.id}</span>
          <span class="order-status status-${order.status}">${statusMap[order.status] || order.status}</span>
        </div>
        <div class="order-items">
          ${order.items.map(i => `${lang === 'km' && i.name_km ? i.name_km : i.name_en} x${i.quantity}`).join(' • ')}
        </div>
        ${order.reject_reason
          ? `<div class="order-reject-reason">${t('rejectReason')}${order.reject_reason}</div>`
          : ''}
        <div class="order-footer">
          <span class="order-total">$${parseFloat(order.total).toFixed(2)}</span>
          <span class="order-date">${order.created_at}</span>
        </div>
      </div>`).join('');
  } catch (e) {
    container.innerHTML = `<div class="empty-state">
      <div class="empty-icon">❌</div>
      <div class="empty-title">Failed to load orders</div>
    </div>`;
  }
}

// ── Page Navigation ───────────────────────────────────────────────────────────
function switchPage(pageId, navBtn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  currentPage = pageId;

  // Update nav
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const btn = navBtn || document.querySelector(`[data-page="${pageId}"]`);
  if (btn) btn.classList.add('active');

  // Render cart when switching to it
  if (pageId === 'pageCart') renderCart();

  // Scroll to top
  document.getElementById(pageId).scrollTop = 0;
}

// ── Language Toggle ───────────────────────────────────────────────────────────
function toggleLanguage() {
  lang = lang === 'en' ? 'km' : 'en';
  localStorage.setItem('lang', lang);
  applyLang();
  renderCategories();
  renderMenu(currentCategory === 'all' ? menuData : menuData.filter(i => i.category === currentCategory));
  if (currentPage === 'pageCart') renderCart();
}

function applyLang() {
  document.getElementById('langLabel').textContent = lang === 'en' ? 'ខ្មែរ' : 'EN';
  document.getElementById('brandName').textContent = t('brandName');
  document.getElementById('heroGreeting').textContent = t('greeting');
  document.getElementById('heroTitle').textContent = t('heroTitle');
  document.getElementById('heroSub').textContent = t('heroSub');
  document.getElementById('searchInput').placeholder = t('searchPlaceholder');
  document.getElementById('catTitle').textContent = t('catTitle');
  document.getElementById('menuTitle').textContent = t('menuTitle');
  document.getElementById('navHome').textContent = t('navHome');
  document.getElementById('navCart').textContent = t('navCart');
  document.getElementById('navOrders').textContent = t('navOrders');
  document.getElementById('cartTitle').textContent = t('cartTitle');
  document.getElementById('btnClearCart').textContent = t('clearCart');
  document.getElementById('subtotalLabel').textContent = t('subtotal');
  document.getElementById('deliveryLabel').textContent = t('delivery');
  document.getElementById('checkoutBtnText').textContent = t('checkout');
  document.getElementById('checkoutTitle').textContent = t('checkoutTitle');
  document.getElementById('deliveryInfoTitle').textContent = t('deliveryInfo');
  document.getElementById('orderSummaryTitle').textContent = t('orderSummaryTitle');
  document.getElementById('labelName').textContent = t('labelName');
  document.getElementById('labelPhone').textContent = t('labelPhone');
  document.getElementById('labelAddress').textContent = t('labelAddress');
  document.getElementById('labelNote').textContent = t('labelNote');
  document.getElementById('placeOrderText').textContent = t('placeOrder');
  document.getElementById('ordersTitle').textContent = t('ordersTitle');

  // Khmer font class
  document.body.classList.toggle('lang-km', lang === 'km');
}

// ── Theme ─────────────────────────────────────────────────────────────────────
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  document.getElementById('themeIcon').textContent = next === 'dark' ? '☀️' : '🌙';
}

function applyTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  document.getElementById('themeIcon').textContent = saved === 'dark' ? '☀️' : '🌙';
}

// ── Toast Notifications ───────────────────────────────────────────────────────
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-8px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ── Food Detail (simple add to cart) ─────────────────────────────────────────
function openFoodDetail(itemId) {
  const item = menuData.find(i => i.id === itemId);
  if (!item || !item.available) return;
  addToCart(itemId);
}
