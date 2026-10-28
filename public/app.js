/* ==========================================================================
   LIVE AUCTION PLATFORM - CLIENT APPLICATION ENGINE (Amazon-Grade UI/UX)
   ========================================================================== */

// --- Global Application State ---
let state = {
  currentUser: null,
  selectedRole: null, // 'auctioner' or 'bidder'
  currentRoom: null,
  activeView: 'role-select',
  lockedInPayment: false,
  audioEnabled: true,
  searchQuery: '',
  selectedCategory: 'All',
  allRooms: [],
  systemStats: { userCount: 4, maxUsers: 10, availableSlots: 6 }
};

// --- Web Audio API Synthesizers for Sound Effects ---
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playSound(type) {
  if (!state.audioEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (type === 'bid') {
      // Pleasant rising chime for new bid
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'hammer') {
      // Deep resonant gavel hammer impact
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.6, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'alert') {
      // Double attention chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'success') {
      // Victorious major chord
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + 0.6);
      });
    }
  } catch (err) {
    console.warn('Audio playback error:', err);
  }
}

function toggleAudio() {
  state.audioEnabled = !state.audioEnabled;
  const btn = document.getElementById('audio-toggle-btn');
  if (btn) {
    btn.textContent = state.audioEnabled ? '🔔 Sound: ON' : '🔕 Sound: OFF';
  }
  showToast(state.audioEnabled ? 'Sound alerts enabled' : 'Sound alerts muted', 'info');
}

// --- Confetti Animation for Celebrations ---
function triggerConfetti() {
  const container = document.body;
  const colors = ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#3b82f6'];
  for (let i = 0; i < 50; i++) {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.zIndex = '99999';
    el.style.width = Math.random() * 10 + 6 + 'px';
    el.style.height = Math.random() * 8 + 4 + 'px';
    el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    el.style.left = Math.random() * 100 + 'vw';
    el.style.top = '-20px';
    el.style.borderRadius = '2px';
    el.style.transform = `rotate(${Math.random() * 360}deg)`;
    el.style.pointerEvents = 'none';
    el.style.transition = `all ${Math.random() * 2 + 1.5}s cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
    container.appendChild(el);

    setTimeout(() => {
      el.style.top = '105vh';
      el.style.left = `calc(${el.style.left} + ${(Math.random() - 0.5) * 200}px)`;
      el.style.transform = `rotate(${Math.random() * 720}deg)`;
    }, 20);

    setTimeout(() => el.remove(), 4000);
  }
}

// --- Toast System ---
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// --- Navigation Engine ---
function navigate(viewId) {
  // Enforce mandatory payment lock constraint
  if (state.lockedInPayment && viewId !== 'payment') {
    showToast('⚠️ <strong>Payment Mandatory:</strong> You cannot exit this page until your winning auction item is paid for.', 'error');
    playSound('alert');
    return;
  }

  // Hide all views
  document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));

  // Show target view
  const target = document.getElementById(`view-${viewId}`);
  if (target) {
    target.classList.add('active');
    state.activeView = viewId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Update UI headers & context
  updateHeaderNav();

  // View specific loaders
  if (viewId === 'account') {
    loadAccountDetails();
  } else if (viewId === 'marketplace') {
    loadRoomsCatalog();
  }
}

function updateHeaderNav() {
  const roleBadge = document.getElementById('nav-role-badge');
  const userMenu = document.getElementById('nav-user-menu');
  const authButtons = document.getElementById('nav-auth-buttons');
  const balanceChip = document.getElementById('user-balance-chip');
  const navBalanceVal = document.getElementById('nav-balance-val');
  const navUserName = document.getElementById('nav-user-name');
  const navCreateBtn = document.getElementById('nav-create-btn');
  const navExploreBtn = document.getElementById('nav-explore-btn');

  if (state.currentUser) {
    authButtons.style.display = 'none';
    userMenu.style.display = 'flex';
    balanceChip.style.display = 'flex';
    navBalanceVal.textContent = `$${Number(state.currentUser.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    navUserName.textContent = state.currentUser.name.split(' ')[0] || 'User';

    if (state.currentUser.role === 'auctioner') {
      roleBadge.textContent = 'User 1: Auctioneer';
      roleBadge.className = 'role-pill auctioner';
      navCreateBtn.style.display = 'inline-flex';
      navExploreBtn.style.display = 'inline-flex';
    } else {
      roleBadge.textContent = 'User 2: Bidder';
      roleBadge.className = 'role-pill bidder';
      navCreateBtn.style.display = 'none';
      navExploreBtn.style.display = 'inline-flex';
    }
  } else if (state.selectedRole) {
    authButtons.style.display = 'flex';
    userMenu.style.display = 'none';
    balanceChip.style.display = 'none';
    roleBadge.textContent = state.selectedRole === 'auctioner' ? 'User 1: Auctioneer' : 'User 2: Bidder';
    roleBadge.className = `role-pill ${state.selectedRole}`;
  } else {
    authButtons.style.display = 'flex';
    userMenu.style.display = 'none';
    balanceChip.style.display = 'none';
    roleBadge.textContent = 'Select Role';
    roleBadge.className = 'role-pill guest';
  }
}

// --- Screen 1: Role Selection ---
function selectRole(role) {
  state.selectedRole = role;

  // Check if current logged-in user matches selected role
  if (state.currentUser && state.currentUser.role === role) {
    navigate(role === 'auctioner' ? 'account' : 'marketplace');
    return;
  }

  // Otherwise prompt authentication for this role
  setupAuthScreen(role);
  navigate('auth');
}

// --- Screen 2: Authentication ---
let currentAuthTab = 'login';

function setupAuthScreen(role) {
  const authTitle = document.getElementById('auth-title');
  const authSubtitle = document.getElementById('auth-subtitle');
  const roleIndicator = document.getElementById('auth-role-indicator');
  const groupBalance = document.getElementById('group-balance');
  const quickDemoButtons = document.getElementById('quick-demo-buttons');

  roleIndicator.className = `role-pill ${role}`;
  roleIndicator.textContent = role === 'auctioner' ? 'User 1: Auctioneer' : 'User 2: Bidder';

  // Prefill remembered email if available from previous registration or login
  const rememberedEmail = localStorage.getItem('liveauction_last_user_email');
  const emailInput = document.getElementById('input-email');
  if (rememberedEmail && emailInput && !emailInput.value) {
    emailInput.value = rememberedEmail;
  }

  if (role === 'auctioner') {
    authTitle.textContent = 'Auctioneer Portal Access';
    authSubtitle.textContent = 'Put items on auction, host live bidding rooms, and manage transactions.';
    groupBalance.style.display = 'none';

    quickDemoButtons.innerHTML = `
      <button type="button" class="quick-btn" onclick="autofillDemo('auctioner1@liveauction.com', 'password123')">
        🏛️ Sarah Connor<br><span style="color: var(--text-dim);">Sarah (Host 1)</span>
      </button>
      <button type="button" class="quick-btn" onclick="autofillDemo('auctioner2@liveauction.com', 'password123')">
        🏛️ Marcus Vance<br><span style="color: var(--text-dim);">Marcus (Host 2)</span>
      </button>
    `;
  } else {
    authTitle.textContent = 'Bidder Portal Access';
    authSubtitle.textContent = 'Browse Amazon-style live listings, place bids, and claim luxury items.';
    groupBalance.style.display = currentAuthTab === 'register' ? 'block' : 'none';

    quickDemoButtons.innerHTML = `
      <button type="button" class="quick-btn" onclick="autofillDemo('bidder1@liveauction.com', 'password123')">
        🎯 Alex Mercer ($18.5k)<br><span style="color: var(--text-dim);">High Roller</span>
      </button>
      <button type="button" class="quick-btn" onclick="autofillDemo('bidder2@liveauction.com', 'password123')">
        🎯 Elena Rostova ($6.2k)<br><span style="color: var(--text-dim);">Collector</span>
      </button>
    `;
  }

  updateSystemLimitWarning();
}

function switchAuthTab(tab) {
  currentAuthTab = tab;
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');

  document.getElementById('group-name').style.display = tab === 'register' ? 'block' : 'none';
  document.getElementById('group-balance').style.display = (tab === 'register' && state.selectedRole === 'bidder') ? 'block' : 'none';
  document.getElementById('btn-auth-submit').textContent = tab === 'register' ? 'Create Account' : 'Log In';
}

function autofillDemo(email, password) {
  document.getElementById('input-email').value = email;
  document.getElementById('input-password').value = password;
  switchAuthTab('login');
  showToast('Demo credentials loaded. Click "Log In" to proceed.', 'info');
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('input-email').value.trim();
  const password = document.getElementById('input-password').value;
  const name = document.getElementById('input-name').value.trim();
  const initialBalance = Number(document.getElementById('input-balance').value) || 10000;

  const endpoint = currentAuthTab === 'register' ? '/api/auth/register' : '/api/auth/login';
  const payload = currentAuthTab === 'register' 
    ? { name, email, password, role: state.selectedRole, initialBalance }
    : { email, password, role: state.selectedRole };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok) {
      showToast(`⚠️ ${data.error || 'Authentication failed'}`, 'error');
      playSound('alert');
      return;
    }

    state.currentUser = data.user;
    state.selectedRole = data.user.role; // Adopt user role from database
    saveSessionUser(data.user);
    showToast(`Welcome, <strong>${data.user.name}</strong> (${data.user.role.toUpperCase()})!`, 'success');
    playSound('success');

    // "Once into the website, they are directed to their account details, account balance, and their previous transactions."
    navigate('account');
    fetchSystemStats();
  } catch (err) {
    showToast(`Network error: ${err.message}`, 'error');
  }
}

function logout() {
  state.currentUser = null;
  state.currentRoom = null;
  sessionStorage.removeItem('liveauction_user');
  showToast('Logged out successfully.', 'info');
  navigate('role-select');
}

// --- Screen 3: Account Details & Balance ---
async function loadAccountDetails() {
  if (!state.currentUser) {
    navigate('role-select');
    return;
  }

  try {
    const res = await fetch(`/api/users/${state.currentUser.id}`);
    if (res.ok) {
      const data = await res.json();
      state.currentUser = data.user;
      saveSessionUser(data.user);
    }
  } catch (e) {
    console.warn('Could not refresh user details from server', e);
  }

  const u = state.currentUser;
  document.getElementById('acc-name').textContent = u.name;
  document.getElementById('acc-avatar').textContent = u.name.charAt(0).toUpperCase();
  document.getElementById('acc-id').textContent = u.id;
  document.getElementById('acc-email').textContent = u.email;
  document.getElementById('acc-role-name').textContent = u.role === 'auctioner' ? 'User 1 (Auctioner)' : 'User 2 (Bidder)';
  document.getElementById('acc-role-badge').textContent = u.role === 'auctioner' ? 'Host & Seller' : 'Verified Bidder';
  document.getElementById('acc-balance-display').textContent = `$${Number(u.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  const actionBtn = document.getElementById('acc-action-btn');
  if (u.role === 'auctioner') {
    actionBtn.textContent = '🚀 Put Item on Auction';
    actionBtn.style.display = 'inline-flex';
  } else {
    actionBtn.textContent = '🛒 Browse Live Auctions';
    actionBtn.style.display = 'inline-flex';
  }

  // Populate Further Operations Hub Cards
  const opGrid = document.getElementById('operations-grid');
  if (opGrid) {
    if (u.role === 'auctioner') {
      opGrid.innerHTML = `
        <div class="operation-card primary" onclick="navigate('create-room')">
          <div class="op-card-icon">🚀</div>
          <h4>Put an Item on Auction</h4>
          <p>Create an Amazon-style live room with photo gallery, specifications, and starting bid.</p>
          <div class="op-card-action">Launch Auction Studio →</div>
        </div>
        <div class="operation-card" onclick="navigate('marketplace')">
          <div class="op-card-icon">🏛️</div>
          <h4>Explore Live Marketplace</h4>
          <p>Inspect active auction rooms, real-time leading bids, and audience engagement.</p>
          <div class="op-card-action">Browse Catalog →</div>
        </div>
        <div class="operation-card" onclick="promptDeposit()">
          <div class="op-card-icon">💳</div>
          <h4>Add Funds / Top-Up</h4>
          <p>Add demo liquidity into your seller wallet for collateral and transactions.</p>
          <div class="op-card-action">Top-Up Balance →</div>
        </div>
      `;
    } else {
      opGrid.innerHTML = `
        <div class="operation-card primary" onclick="navigate('marketplace')">
          <div class="op-card-icon">🛒</div>
          <h4>Explore Live Auctions</h4>
          <p>Browse live bidding rooms matching your $${Number(u.balance).toLocaleString()} balance and place bids.</p>
          <div class="op-card-action">Enter Marketplace →</div>
        </div>
        <div class="operation-card" onclick="focusSearchBar()">
          <div class="op-card-icon">🔍</div>
          <h4>Search Specific Products</h4>
          <p>Find luxury watches, electronics, sneakers, and audio gear using the Amazon search bar.</p>
          <div class="op-card-action">Search Items →</div>
        </div>
        <div class="operation-card" onclick="promptDeposit()">
          <div class="op-card-icon">💰</div>
          <h4>Deposit / Increase Balance</h4>
          <p>Increase your balance to unlock high-tier auction rooms with higher current bids.</p>
          <div class="op-card-action">Add Funds →</div>
        </div>
      `;
    }
  }

  // Populate Transactions Table
  const tbody = document.getElementById('transactions-tbody');
  tbody.innerHTML = '';
  const txns = u.transactions || [];
  document.getElementById('txn-count-label').textContent = `${txns.length} transactions recorded`;

  if (txns.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-dim); padding: 20px;">No transaction records yet.</td></tr>`;
  } else {
    txns.forEach(t => {
      const tr = document.createElement('tr');
      const isCredit = t.type === 'credit';
      const dateStr = new Date(t.timestamp).toLocaleString();
      tr.innerHTML = `
        <td style="font-family: var(--font-mono); font-size: 13px; color: #94a3b8;">${t.id}</td>
        <td><span class="txn-badge ${t.type}">${t.type}</span></td>
        <td style="font-weight: 600;">${t.description}</td>
        <td style="font-family: var(--font-mono); font-size: 12px; color: #fbbf24;">${t.roomId || 'N/A'}</td>
        <td style="font-weight: 800; color: ${isCredit ? 'var(--accent-success)' : 'var(--accent-danger)'};">
          ${isCredit ? '+' : '-'}$${Number(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </td>
        <td style="font-size: 12px; color: var(--text-dim);">${dateStr}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Won Items Inventory for Bidder
  const invPanel = document.getElementById('bidder-inventory-panel');
  if (u.role === 'bidder') {
    invPanel.style.display = 'block';
    const grid = document.getElementById('won-items-grid');
    grid.innerHTML = '';
    const won = u.wonItems || [];

    if (won.length === 0) {
      grid.innerHTML = `<p style="color: var(--text-dim); font-size: 13px; padding: 10px;">No items won yet. Enter a live auction room and place winning bids!</p>`;
    } else {
      won.forEach(item => {
        const card = document.createElement('div');
        card.className = 'won-item-card';
        card.innerHTML = `
          <img src="${(item.images && item.images[0]) || ''}" alt="${item.title}" class="won-item-img" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'" />
          <div class="won-item-info">
            <span class="product-category-tag">${item.category || 'Luxury'}</span>
            <h4>${item.title}</h4>
            <div class="price">Claimed for $${Number(item.purchasePrice).toLocaleString()}</div>
            <div style="font-size: 11px; color: var(--text-dim); margin-top: 4px;">Seller ID: ${item.sellerId}</div>
          </div>
        `;
        grid.appendChild(card);
      });
    }
  } else {
    invPanel.style.display = 'none';
  }
}

function handleAccountActionBtn() {
  if (state.currentUser && state.currentUser.role === 'auctioner') {
    navigate('create-room');
  } else {
    navigate('marketplace');
  }
}

async function promptDeposit() {
  if (!state.currentUser) return;
  const input = prompt('Enter funds amount to deposit into your account balance ($):', '2500');
  if (!input) return;

  const amount = Number(input);
  if (isNaN(amount) || amount <= 0) {
    showToast('Please enter a valid positive dollar amount.', 'error');
    return;
  }

  try {
    const res = await fetch(`/api/users/${state.currentUser.id}/balance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, note: 'Instant Test Deposit & Liquidity Top-up' })
    });
    const data = await res.json();
    if (res.ok) {
      state.currentUser.balance = data.balance;
      state.currentUser.transactions = data.transactions;
      saveSessionUser(state.currentUser);
      showToast(`Successfully deposited <strong>$${amount.toLocaleString()}</strong> to your balance!`, 'success');
      playSound('bid');
      loadAccountDetails();
    } else {
      showToast(`Top-up failed: ${data.error}`, 'error');
    }
  } catch (err) {
    showToast(`Error adding funds: ${err.message}`, 'error');
  }
}

// --- Screen 4: User 1 - Create Room (Put Item on Auction) ---
const ITEM_PRESETS = {
  macbook: {
    title: 'Apple MacBook Pro 16" M3 Max (128GB Unified Memory, 2TB SSD)',
    category: 'Electronics & Tech',
    brand: 'Apple',
    condition: 'Brand New (Factory Sealed)',
    minBid: 3200,
    images: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80,https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&auto=format&fit=crop&q=80',
    description: '16-core CPU, 40-core GPU, Liquid Retina XDR display with ProMotion 120Hz, Space Black finish. Sealed in original factory shrink wrap with 1 year AppleCare warranty.'
  },
  rolex: {
    title: 'Rolex Submariner Date 41mm Oystersteel (Reference 126610LN)',
    category: 'Watches & Luxury',
    brand: 'Rolex',
    condition: 'Collector Grade / Mint',
    minBid: 8900,
    images: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80,https://images.unsplash.com/photo-1547996160-71dfabb1d451?w=800&auto=format&fit=crop&q=80',
    description: 'Cerachrom bezel in black ceramic, luminescent Chromalight display, Calibre 3235 automatic movement with 70-hour power reserve. Complete with green presentation box and guarantee card.'
  },
  camera: {
    title: 'Leica M11 Rangefinder Full-Frame Digital Camera Body (Silver Chrome)',
    category: 'Electronics & Tech',
    brand: 'Leica',
    condition: 'Open Box - Never Used',
    minBid: 6500,
    images: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80,https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&auto=format&fit=crop&q=80',
    description: 'Triple Resolution Sensor (60/36/18 MP), internal 64GB memory, iconic brass top plate design, handmade in Germany. Zero actuations.'
  },
  sneakers: {
    title: 'Nike Air Jordan 1 High 1985 "Chicago" (Collector Vault Archive)',
    category: 'Sneakers & Apparel',
    brand: 'Nike / Jordan',
    condition: 'Collector Grade / Mint',
    minBid: 1400,
    images: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80,https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800&auto=format&fit=crop&q=80',
    description: 'Deadstock OG 1985 specifications with aged midsole patina, premium full-grain leather, and authenticated certificate of provenance.'
  }
};

function applyPreset(key) {
  const p = ITEM_PRESETS[key];
  if (!p) return;
  document.getElementById('item-title').value = p.title;
  document.getElementById('item-category').value = p.category;
  document.getElementById('item-brand').value = p.brand;
  document.getElementById('item-condition').value = p.condition;
  document.getElementById('item-minbid').value = p.minBid;
  document.getElementById('item-images').value = p.images;
  document.getElementById('item-description').value = p.description;
  updateImagePreview();
  showToast(`Autofilled preset: <strong>${p.title}</strong>`, 'info');
}

function updateImagePreview() {
  const input = document.getElementById('item-images').value;
  const strip = document.getElementById('image-preview-strip');
  strip.innerHTML = '';
  const urls = input.split(',').map(s => s.trim()).filter(Boolean);
  urls.forEach(u => {
    const img = document.createElement('img');
    img.className = 'preview-thumb';
    img.src = u;
    img.onerror = () => { img.style.display = 'none'; };
    strip.appendChild(img);
  });
}

async function handleCreateRoomSubmit(e) {
  e.preventDefault();
  if (!state.currentUser || state.currentUser.role !== 'auctioner') {
    showToast('Only User 1 (Auctioneer) can create an auction room.', 'error');
    return;
  }

  const title = document.getElementById('item-title').value.trim();
  const category = document.getElementById('item-category').value;
  const brand = document.getElementById('item-brand').value.trim();
  const condition = document.getElementById('item-condition').value;
  const minBid = Number(document.getElementById('item-minbid').value);
  const images = document.getElementById('item-images').value.split(',').map(s => s.trim()).filter(Boolean);
  const description = document.getElementById('item-description').value.trim();

  try {
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auctionerId: state.currentUser.id,
        title,
        category,
        brand,
        condition,
        minBid,
        images,
        description
      })
    });

    const data = await res.json();
    if (res.ok) {
      showToast(`🎉 Auction Room <strong>${data.room.id}</strong> created and open for live bidders!`, 'success');
      playSound('success');
      // Enter the newly created room directly as host
      joinRoom(data.room.id);
    } else {
      showToast(`Creation failed: ${data.error}`, 'error');
    }
  } catch (err) {
    showToast(`Network error: ${err.message}`, 'error');
  }
}

// --- Screen 5: User 2 - Amazon Marketplace & Search ---
async function loadRoomsCatalog() {
  if (state.currentUser) {
    document.getElementById('marketplace-balance-badge').textContent = 
      `Your Account Balance: $${Number(state.currentUser.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  }

  const query = state.searchQuery || '';
  const cat = state.selectedCategory || 'All';
  const url = `/api/rooms?q=${encodeURIComponent(query)}&category=${encodeURIComponent(cat)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.json();
    state.allRooms = data.rooms;
    renderRoomsGrid(data.rooms);
  } catch (err) {
    console.error('Error loading rooms catalog:', err);
  }
}

function handleSearchKey(event) {
  if (event.key === 'Enter') handleSearch();
}

function handleSearch() {
  state.searchQuery = document.getElementById('nav-search-input').value.trim();
  state.selectedCategory = document.getElementById('nav-search-category').value;
  navigate('marketplace');
  loadRoomsCatalog();
}

function filterCategory(cat) {
  state.selectedCategory = cat;
  document.getElementById('nav-search-category').value = cat === 'All' ? 'All' : cat;
  document.querySelectorAll('.category-chip').forEach(chip => {
    chip.classList.toggle('active', chip.textContent.trim().toLowerCase().includes(cat.toLowerCase()));
  });
  navigate('marketplace');
  loadRoomsCatalog();
}

function handleSubnavHome() {
  if (state.currentUser && state.currentUser.role === 'auctioner') {
    navigate('account');
  } else {
    navigate('marketplace');
  }
}

function renderRoomsGrid(rooms) {
  const grid = document.getElementById('products-grid');
  grid.innerHTML = '';

  if (rooms.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px; background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
        <h3 style="color: #fff; margin-bottom: 8px;">No matching auction rooms found</h3>
        <p style="color: var(--text-muted); font-size: 14px;">Try adjusting your search terms or switch categories to explore active auctions.</p>
      </div>
    `;
    return;
  }

  const myBal = state.currentUser ? state.currentUser.balance : 0;
  const isBidder = state.currentUser && state.currentUser.role === 'bidder';

  rooms.forEach(r => {
    const card = document.createElement('div');
    card.className = 'product-card';
    const mainImg = (r.images && r.images[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';
    
    // Constraint check: "The user can get into a room only if the current bid is less than or equal to the user 2 account balance."
    const canAfford = !isBidder || (r.currentBid <= myBal);
    const audienceCount = r.connectedUsers ? r.connectedUsers.length : 0;

    card.innerHTML = `
      <div class="product-thumb-wrap">
        <img src="${mainImg}" alt="${r.title}" class="product-thumb-img" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'" />
        <span class="status-badge ${r.status === 'sold' ? 'sold' : 'live'}">
          ${r.status === 'sold' ? 'SOLD' : '● LIVE'}
        </span>
      </div>

      <div class="product-card-body">
        <div class="product-category-tag">${r.category}</div>
        <h3 class="product-title" title="${r.title}">${r.title}</h3>
        
        <div class="amazon-rating">
          ★★★★★ <span class="rating-count">(${Math.floor(Math.random() * 80 + 20)} bids/views)</span>
        </div>

        <div class="bidding-info-box">
          <div>
            <div class="current-bid-label">Current Bid</div>
            <div class="current-bid-val">$${Number(r.currentBid).toLocaleString()}</div>
          </div>
          <div style="text-align: right; font-size: 11px; color: var(--text-muted);">
            <div>Starting: $${Number(r.minBid).toLocaleString()}</div>
            <div style="color: #60a5fa;">👥 ${audienceCount} live</div>
          </div>
        </div>

        ${
          canAfford
            ? `<button class="room-join-btn enabled" onclick="joinRoom('${r.id}')">
                Enter Live Room →
               </button>`
            : `<button class="room-join-btn insufficient-balance" onclick="alertInsufficientFunds(${r.currentBid}, ${myBal})">
                🚫 Insufficient Funds (Need $${Number(r.currentBid).toLocaleString()})
               </button>`
        }
      </div>
    `;
    grid.appendChild(card);
  });
}

function alertInsufficientFunds(currentBid, myBal) {
  showToast(
    `🚫 <strong>Room Entry Rule:</strong> You can only enter if the current bid is ≤ your balance.<br>` +
    `Current bid: <strong>$${currentBid.toLocaleString()}</strong> | Your balance: <strong>$${myBal.toLocaleString()}</strong>.<br>` +
    `Please top up your account balance from your dashboard to enter!`,
    'error'
  );
  playSound('alert');
}

// --- Screen 6: Live Auction Arena Room ---
async function joinRoom(roomId) {
  if (!state.currentUser) {
    showToast('Please sign in or select your role first.', 'error');
    selectRole('bidder');
    return;
  }

  try {
    const res = await fetch(`/api/rooms/${roomId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: state.currentUser.id })
    });
    const data = await res.json();

    if (!res.ok) {
      showToast(`⚠️ ${data.error}`, 'error');
      playSound('alert');
      return;
    }

    state.currentRoom = data.room;
    setupAuctionRoomView(data.room, data.isViewer);
    navigate('auction-room');
  } catch (err) {
    showToast(`Error connecting to room: ${err.message}`, 'error');
  }
}

function setupAuctionRoomView(room, isViewer) {
  document.getElementById('room-id-display').textContent = room.id;
  document.getElementById('room-host-display').textContent = `${room.auctionerName} (${room.auctionerId})`;
  document.getElementById('current-room-indicator').textContent = `In: ${room.id}`;

  // Gallery
  const mainImg = document.getElementById('room-main-img');
  mainImg.src = (room.images && room.images[0]) || '';
  const thumbsStrip = document.getElementById('room-gallery-thumbs');
  thumbsStrip.innerHTML = '';

  (room.images || []).forEach((imgUrl, index) => {
    const t = document.createElement('img');
    t.className = `thumb-gallery-item ${index === 0 ? 'active' : ''}`;
    t.src = imgUrl;
    t.onclick = () => {
      mainImg.src = imgUrl;
      document.querySelectorAll('.thumb-gallery-item').forEach(el => el.classList.remove('active'));
      t.classList.add('active');
    };
    thumbsStrip.appendChild(t);
  });

  // Specs
  document.getElementById('room-category-display').textContent = room.category;
  document.getElementById('room-title-display').textContent = room.title;
  document.getElementById('room-brand-display').textContent = room.brand || 'Brand';
  document.getElementById('room-condition-display').textContent = room.condition || 'Mint';
  document.getElementById('room-desc-display').textContent = room.description;

  // Bidding & Live Ticker
  updateRoomTicker(room);

  // Audience
  updateRoomAudience(room.connectedUsers || []);

  // Role Controls visibility
  const isAuctioner = state.currentUser.id === room.auctionerId;
  const isBidder = state.currentUser.role === 'bidder';

  const auctionerPanel = document.getElementById('auctioner-stage-panel');
  const bidderPanel = document.getElementById('bidder-bidding-panel');

  if (isAuctioner) {
    auctionerPanel.style.display = 'block';
    bidderPanel.style.display = 'none';
    updateAuctionerPaymentTracker(room.paymentStatus);
  } else if (isBidder) {
    auctionerPanel.style.display = 'none';
    bidderPanel.style.display = 'block';
    evaluateViewerMode(room, isViewer);
  } else {
    auctionerPanel.style.display = 'none';
    bidderPanel.style.display = 'none';
  }
}

function updateRoomTicker(room) {
  document.getElementById('room-current-bid-display').textContent = `$${Number(room.currentBid).toLocaleString()}`;
  
  const bidderDisplay = document.getElementById('room-highest-bidder-display');
  if (room.highestBidderId) {
    bidderDisplay.innerHTML = `🏆 Leading Bidder: <strong>${room.highestBidderName}</strong> (<span style="font-family: var(--font-mono);">${room.highestBidderId}</span>)`;
  } else {
    bidderDisplay.innerHTML = `🏆 Leading Bidder: None yet (Starting bid: $${Number(room.minBid).toLocaleString()})`;
  }

  // Stage Announcement Banner
  const banner = document.getElementById('room-stage-banner');
  banner.textContent = room.stageMessage || 'Auction is LIVE. Bids are being accepted.';
  banner.className = 'stage-announcement-banner';

  if (room.status === 'going_once') banner.classList.add('going-once');
  else if (room.status === 'going_twice') banner.classList.add('going-twice');
  else if (room.status === 'sold') banner.classList.add('sold');

  // Update Bids List
  const bidsList = document.getElementById('room-bids-list');
  bidsList.innerHTML = '';
  const history = room.bidHistory || [];

  if (history.length === 0) {
    bidsList.innerHTML = `<li style="text-align: center; color: var(--text-dim); padding: 14px;">No bids placed yet. Place an opening bid!</li>`;
  } else {
    history.forEach(b => {
      const li = document.createElement('li');
      li.className = 'bid-item';
      const timeStr = new Date(b.timestamp).toLocaleTimeString();
      li.innerHTML = `
        <div>
          <span class="bid-item-bidder">${b.userName}</span> 
          <span style="font-family: var(--font-mono); font-size: 11px; color: #94a3b8;">(${b.userId})</span>
        </div>
        <div style="text-align: right;">
          <div class="bid-item-amount">+$${Number(b.amount).toLocaleString()}</div>
          <div class="bid-item-time">${timeStr}</div>
        </div>
      `;
      bidsList.appendChild(li);
    });
  }

  // Pre-fill next recommended bid in number input
  const nextMin = history.length === 0 ? room.minBid : room.currentBid + 50;
  const numInput = document.getElementById('bid-number-bar');
  if (numInput && (!numInput.value || Number(numInput.value) <= room.currentBid)) {
    numInput.value = nextMin;
  }
}

// "If the current bid is more than the account balance of the user 2 during the auction, then the user 2 is made as a viewer (by which the user 2 can either view the auction or exit the room)."
function evaluateViewerMode(room, forceViewer) {
  if (!state.currentUser || state.currentUser.role !== 'bidder') return;

  const myBal = state.currentUser.balance;
  const isViewer = forceViewer || (room.currentBid > myBal);

  const viewerAlert = document.getElementById('viewer-mode-alert');
  const activeControls = document.getElementById('active-bidding-controls');
  const balLabel = document.getElementById('bidder-available-bal');

  balLabel.textContent = `Balance: $${Number(myBal).toLocaleString()}`;

  if (isViewer) {
    viewerAlert.style.display = 'flex';
    activeControls.style.display = 'none';
    document.getElementById('viewer-cur-bid').textContent = Number(room.currentBid).toLocaleString();
    document.getElementById('viewer-my-bal').textContent = Number(myBal).toLocaleString();
  } else {
    viewerAlert.style.display = 'none';
    activeControls.style.display = 'block';
  }
}

function addQuickIncrement(increment) {
  const bar = document.getElementById('bid-number-bar');
  const cur = Number(bar.value) || (state.currentRoom ? state.currentRoom.currentBid : 0);
  bar.value = cur + increment;
}

async function submitBid() {
  if (!state.currentRoom || !state.currentUser) return;
  const bar = document.getElementById('bid-number-bar');
  const amount = Number(bar.value);

  if (isNaN(amount) || amount <= 0) {
    showToast('Please enter a valid bid amount.', 'error');
    return;
  }

  if (amount > state.currentUser.balance) {
    showToast(`Insufficient balance: Bid ($${amount.toLocaleString()}) cannot exceed your balance ($${state.currentUser.balance.toLocaleString()}).`, 'error');
    playSound('alert');
    return;
  }

  try {
    const res = await fetch(`/api/rooms/${state.currentRoom.id}/bid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bidderId: state.currentUser.id,
        bidAmount: amount
      })
    });
    const data = await res.json();

    if (!res.ok) {
      showToast(`⚠️ ${data.error}`, 'error');
      playSound('alert');
      return;
    }

    showToast(`⚡ Bid of <strong>$${amount.toLocaleString()}</strong> placed successfully!`, 'success');
    playSound('bid');
  } catch (err) {
    showToast(`Error submitting bid: ${err.message}`, 'error');
  }
}

// User 1 (Auctioneer) Stage Hammers: Going once, Going twice, SOLD
async function triggerAuctionStage(action) {
  if (!state.currentRoom || !state.currentUser) return;

  try {
    const res = await fetch(`/api/rooms/${state.currentRoom.id}/stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auctionerId: state.currentUser.id,
        action
      })
    });
    const data = await res.json();

    if (!res.ok) {
      showToast(`⚠️ ${data.error}`, 'error');
      playSound('alert');
      return;
    }

    if (action === 'sold') {
      playSound('hammer');
      triggerConfetti();
      showToast(`🔨 <strong>SOLD!</strong> Deal closed. Waiting for winning bidder payment.`, 'success');
    } else {
      playSound('alert');
    }
  } catch (err) {
    showToast(`Stage command error: ${err.message}`, 'error');
  }
}

function updateAuctionerPaymentTracker(paymentStatus) {
  const pill = document.getElementById('auctioner-payment-status-pill');
  if (!pill) return;

  pill.className = `payment-status-pill ${paymentStatus.replace('_', '-')}`;
  if (paymentStatus === 'under_process') {
    pill.textContent = 'Payment Under Process...';
  } else if (paymentStatus === 'paid') {
    pill.textContent = 'Paid (Funds Transferred)';
  } else {
    pill.textContent = 'Not Paid';
  }
}

function exitRoom() {
  if (state.lockedInPayment) {
    showToast('⚠️ Payment mandatory: You cannot leave until payment is completed.', 'error');
    return;
  }
  state.currentRoom = null;
  document.getElementById('current-room-indicator').textContent = '';
  navigate(state.currentUser && state.currentUser.role === 'auctioner' ? 'account' : 'marketplace');
}

function updateRoomAudience(attendees) {
  document.getElementById('room-attendee-badge').textContent = `👥 ${attendees.length} in room`;
  const list = document.getElementById('room-audience-list');
  list.innerHTML = '';

  attendees.forEach(a => {
    const li = document.createElement('li');
    li.className = 'audience-item';
    li.innerHTML = `
      <div>
        <strong style="color: #fff;">${a.name}</strong> 
        <span style="font-family: var(--font-mono); font-size: 11px; color: #94a3b8;">(${a.userId})</span>
      </div>
      <div>
        ${
          a.role === 'auctioner' 
            ? `<span class="badge-viewer" style="background: #4f46e5; color: #fff;">Host</span>`
            : a.isViewer
            ? `<span class="badge-viewer">Viewer</span>`
            : `<span class="badge-bidder">Active Bidder</span>`
        }
      </div>
    `;
    list.appendChild(li);
  });
}

function switchLogTab(tab) {
  document.getElementById('tab-log-bids').classList.toggle('active', tab === 'bids');
  document.getElementById('tab-log-audience').classList.toggle('active', tab === 'audience');
  document.getElementById('room-bids-list').style.display = tab === 'bids' ? 'block' : 'none';
  document.getElementById('room-audience-list').style.display = tab === 'audience' ? 'block' : 'none';
}

// --- Screen 7: Mandatory Locked Payment Page ---
// "If the user 2 bids the highest and the deal closes then they must be directed to the payment page where the user 2 cannot exit the page until they pay."
function launchLockedPaymentPage(room) {
  state.lockedInPayment = true;
  state.currentRoom = room;

  // Fill in order details
  document.getElementById('pay-item-img').src = (room.images && room.images[0]) || '';
  document.getElementById('pay-item-cat').textContent = room.category;
  document.getElementById('pay-item-title').textContent = room.title;
  document.getElementById('pay-room-id').textContent = room.id;
  document.getElementById('pay-seller-id').textContent = `${room.auctionerName} (${room.auctionerId})`;

  const amount = Number(room.currentBid);
  document.getElementById('pay-bid-amount').textContent = `$${amount.toLocaleString()}`;
  document.getElementById('pay-total-amount').textContent = `$${amount.toLocaleString()}`;
  document.getElementById('pay-escrow-amount').textContent = amount.toLocaleString();

  // Reset payment buttons
  document.getElementById('pay-now-btn').style.display = 'flex';
  document.getElementById('payment-processing-spinner').style.display = 'none';

  // Navigate to locked payment view
  navigate('payment');
  playSound('success');
  triggerConfetti();

  showToast(`🎉 You won the auction! Please finalize payment to claim item.`, 'success');
}

async function executeWinningPayment() {
  if (!state.currentRoom || !state.currentUser) return;
  const payBtn = document.getElementById('pay-now-btn');
  const spinner = document.getElementById('payment-processing-spinner');

  payBtn.style.display = 'none';
  spinner.style.display = 'block';

  // Step 1: Notify server that payment is "under_process"
  // "There must be an indication to the auctioner on the payment by the highest bidder (paid, not paid or payment under process)."
  try {
    await fetch(`/api/rooms/${state.currentRoom.id}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bidderId: state.currentUser.id,
        status: 'under_process'
      })
    });
  } catch (e) {
    console.warn('Could not broadcast under_process status', e);
  }

  // Artificial short delay so Auctioneer clearly sees "Payment under process" before finalizing
  setTimeout(async () => {
    try {
      const res = await fetch(`/api/rooms/${state.currentRoom.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bidderId: state.currentUser.id,
          status: 'paid'
        })
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(`Payment failed: ${data.error}`, 'error');
        payBtn.style.display = 'flex';
        spinner.style.display = 'none';
        playSound('alert');
        return;
      }

      // Payment successful!
      state.lockedInPayment = false;
      state.currentUser.balance = data.newBalance;
      if (data.wonItem) {
        state.currentUser.wonItems = state.currentUser.wonItems || [];
        state.currentUser.wonItems.unshift(data.wonItem);
      }
      saveSessionUser(state.currentUser);

      playSound('success');
      triggerConfetti();
      showToast(`🏆 <strong>Payment Completed!</strong> $${Number(state.currentRoom.currentBid).toLocaleString()} paid. Item transferred to your inventory!`, 'success');

      // Redirect smoothly to account details view
      setTimeout(() => {
        state.currentRoom = null;
        navigate('account');
      }, 1500);

    } catch (err) {
      showToast(`Payment error: ${err.message}`, 'error');
      payBtn.style.display = 'flex';
      spinner.style.display = 'none';
    }
  }, 2000);
}

// Window unload lock for payment screen
window.addEventListener('beforeunload', (e) => {
  if (state.lockedInPayment) {
    e.preventDefault();
    e.returnValue = 'You cannot leave until payment is completed.';
    return e.returnValue;
  }
});

// --- Real-time Server-Sent Events (SSE) Listener ---
function initSSE() {
  const eventSource = new EventSource('/api/events');

  eventSource.onmessage = (e) => {
    try {
      const packet = JSON.parse(e.data);
      handleServerEvent(packet.type, packet.data);
    } catch (err) {
      console.error('Error handling SSE packet:', err);
    }
  };

  eventSource.onerror = (err) => {
    console.warn('SSE connection interrupted, retrying...', err);
  };
}

function handleServerEvent(type, payload) {
  // 1. New bid placed
  if (type === 'BID_PLACED') {
    if (state.currentRoom && state.currentRoom.id === payload.roomId) {
      state.currentRoom.currentBid = payload.currentBid;
      state.currentRoom.highestBidderId = payload.highestBidderId;
      state.currentRoom.highestBidderName = payload.highestBidderName;
      state.currentRoom.stageMessage = payload.stageMessage;
      state.currentRoom.bidHistory = state.currentRoom.bidHistory || [];
      state.currentRoom.bidHistory.unshift(payload.bid);
      state.currentRoom.connectedUsers = payload.connectedUsers || state.currentRoom.connectedUsers;

      updateRoomTicker(state.currentRoom);
      updateRoomAudience(state.currentRoom.connectedUsers);

      // Re-evaluate viewer mode dynamically:
      // "If the current bid is more than the account balance of the user 2 during the auction, then the user 2 is made as a viewer"
      evaluateViewerMode(state.currentRoom);
      playSound('bid');

      showToast(`⚡ New leading bid: <strong>$${payload.currentBid.toLocaleString()}</strong> by ${payload.highestBidderName}!`, 'info');
    }

    // Also refresh active marketplace if open
    if (state.activeView === 'marketplace') {
      loadRoomsCatalog();
    }
  }

  // 2. Auction Stage Updated: Going Once, Going Twice, SOLD
  if (type === 'AUCTION_STAGE_UPDATED') {
    if (state.currentRoom && state.currentRoom.id === payload.roomId) {
      state.currentRoom.status = payload.status;
      state.currentRoom.stageMessage = payload.stageMessage;
      state.currentRoom.paymentStatus = payload.paymentStatus;

      updateRoomTicker(state.currentRoom);

      if (payload.status === 'sold') {
        playSound('hammer');
        showToast(payload.stageMessage, 'success');

        // Check if current user is the winning highest bidder!
        if (state.currentUser && state.currentUser.id === payload.winnerId) {
          launchLockedPaymentPage(state.currentRoom);
        }
      } else {
        playSound('alert');
        showToast(payload.stageMessage, 'info');
      }
    }
  }

  // 3. Payment Status Updated (Live sync between Bidder and Auctioneer)
  // "There must be an indication to the auctioner on the payment by the highest bidder (paid, not paid or payment under process)."
  if (type === 'PAYMENT_STATUS_UPDATED') {
    if (state.currentRoom && state.currentRoom.id === payload.roomId) {
      state.currentRoom.paymentStatus = payload.paymentStatus;
      updateAuctionerPaymentTracker(payload.paymentStatus);

      if (payload.paymentStatus === 'under_process') {
        showToast(`💳 Payment under process by bidder <strong>${payload.bidderId}</strong>...`, 'info');
      } else if (payload.paymentStatus === 'paid') {
        showToast(`✅ Payment received! <strong>$${Number(payload.amount).toLocaleString()}</strong> transferred.`, 'success');
        playSound('success');
      }
    }
  }

  // 4. Room Deleted (Deal finalized, amount credited, room deleted)
  // "Once the amount is payed the item is sold and the room deletes."
  if (type === 'ROOM_DELETED') {
    if (state.currentRoom && state.currentRoom.id === payload.roomId) {
      if (state.currentUser && state.currentUser.id === payload.sellerId) {
        showToast(`🎉 Item SOLD and amount credited! Room has closed.`, 'success');
        setTimeout(() => navigate('account'), 2000);
      }
    }
    if (state.activeView === 'marketplace') {
      loadRoomsCatalog();
    }
  }

  // 5. Balance Updated
  if (type === 'USER_BALANCE_UPDATED') {
    if (state.currentUser && state.currentUser.id === payload.userId) {
      state.currentUser.balance = payload.balance;
      if (payload.txn) {
        state.currentUser.transactions = state.currentUser.transactions || [];
        state.currentUser.transactions.unshift(payload.txn);
      }
      saveSessionUser(state.currentUser);
      updateHeaderNav();
      if (state.activeView === 'account') {
        loadAccountDetails();
      }
    }
  }

  // 6. Audience Updated
  if (type === 'ROOM_AUDIENCE_UPDATED') {
    if (state.currentRoom && state.currentRoom.id === payload.roomId) {
      state.currentRoom.connectedUsers = payload.connectedUsers;
      updateRoomAudience(payload.connectedUsers);
    }
  }

  // 7. System capacity tracker
  if (type === 'SYSTEM_USERS_UPDATED') {
    fetchSystemStats();
  }
}

// --- System Capacity Tracker (Max 10 users constraint) ---
async function fetchSystemStats() {
  try {
    const res = await fetch('/api/system/stats');
    if (res.ok) {
      const data = await res.json();
      state.systemStats = data;
      document.getElementById('counter-text').textContent = `Users: ${data.userCount}/10`;
      updateSystemLimitWarning();
    }
  } catch (e) {
    console.warn('System stats fetch error', e);
  }
}

function updateSystemLimitWarning() {
  const banner = document.getElementById('auth-limit-banner');
  const slotsText = document.getElementById('slots-left-text');
  if (!banner) return;

  const count = state.systemStats.userCount || 4;
  const max = 10;
  slotsText.textContent = `${max - count} registration slot(s) remaining.`;

  if (count >= max) {
    banner.style.display = 'block';
    banner.innerHTML = `⚠️ <strong>Maximum limit reached:</strong> 10/10 users registered. Please select an existing demo account above.`;
  } else {
    banner.style.display = 'block';
  }
}

function focusSearchBar() {
  const searchInput = document.getElementById('nav-search-input');
  if (searchInput) {
    searchInput.focus();
    searchInput.scrollIntoView({ behavior: 'smooth' });
    showToast('🔍 Type a product name or category in the search bar above!', 'info');
  }
}

// --- Session Persistence Helpers ---
function saveSessionUser(user) {
  sessionStorage.setItem('liveauction_user', JSON.stringify(user));
  localStorage.setItem('liveauction_last_user_email', user.email);
}

function restoreSessionUser() {
  try {
    const saved = sessionStorage.getItem('liveauction_user');
    if (saved) {
      state.currentUser = JSON.parse(saved);
      state.selectedRole = state.currentUser.role;
      updateHeaderNav();
    }
  } catch (e) {
    console.warn('Session restore error', e);
  }
}

// --- Initialization ---
window.addEventListener('DOMContentLoaded', () => {
  restoreSessionUser();
  initSSE();
  fetchSystemStats();

  if (state.currentUser) {
    navigate('account');
  } else {
    navigate('role-select');
  }
});
