/**
 * Campus Booking Hub – Frontend Controller & API Integration
 * Vanilla JS Single Page Application (ES6+)
 */

// ============================================================================
// Application State
// ============================================================================
const state = {
  currentUser: {
    id: 1,
    name: 'Alice Student',
    role: 'STUDENT',
    email: 'alice@campus.edu'
  },
  resources: [],
  userBookings: [],
  userWaitlists: [],
  adminBookings: [],
  activeTab: 'browse',
  filterType: 'ALL',
  filterOnlyAvailable: false,
  searchQuery: '',
  adminBookingFilter: 'ALL',
  selectedResourceForBooking: null,
  selectedResourceForQueue: null,
};

// ============================================================================
// DOM Element Cache
// ============================================================================
const elements = {
  // Navigation & User
  navTabs: document.getElementById('navTabs'),
  tabAdminBtn: document.getElementById('tabAdminBtn'),
  userSelect: document.getElementById('userSelect'),
  currentUserAvatar: document.getElementById('currentUserAvatar'),
  myBookingsCount: document.getElementById('myBookingsCount'),
  adminPendingCount: document.getElementById('adminPendingCount'),

  // Tabs
  tabBrowse: document.getElementById('tab-browse'),
  tabMyBookings: document.getElementById('tab-my-bookings'),
  tabAdmin: document.getElementById('tab-admin'),

  // Browse Tab
  resourcesGrid: document.getElementById('resourcesGrid'),
  resourceSearchInput: document.getElementById('resourceSearchInput'),
  typeFilters: document.getElementById('typeFilters'),
  onlyAvailableToggle: document.getElementById('onlyAvailableToggle'),
  metricTotal: document.getElementById('metricTotal'),
  metricAvailable: document.getElementById('metricAvailable'),

  // My Bookings Tab
  myBookingsList: document.getElementById('myBookingsList'),
  myWaitlistList: document.getElementById('myWaitlistList'),
  bookingsCountBadge: document.getElementById('bookingsCountBadge'),
  waitlistCountBadge: document.getElementById('waitlistCountBadge'),
  refreshMyBookingsBtn: document.getElementById('refreshMyBookingsBtn'),

  // Admin Tab
  statPendingBookings: document.getElementById('statPendingBookings'),
  statApprovedBookings: document.getElementById('statApprovedBookings'),
  statTotalResources: document.getElementById('statTotalResources'),
  statMaintenanceResources: document.getElementById('statMaintenanceResources'),
  adminBookingsTbody: document.getElementById('adminBookingsTbody'),
  adminResourcesTbody: document.getElementById('adminResourcesTbody'),
  countAllAdminBookings: document.getElementById('countAllAdminBookings'),
  countPendingAdminBookings: document.getElementById('countPendingAdminBookings'),
  countApprovedAdminBookings: document.getElementById('countApprovedAdminBookings'),
  openAddResourceModalBtn: document.getElementById('openAddResourceModalBtn'),

  // Booking Modal
  bookingModalBackdrop: document.getElementById('bookingModalBackdrop'),
  closeBookingModalBtn: document.getElementById('closeBookingModalBtn'),
  cancelBookingModalBtn: document.getElementById('cancelBookingModalBtn'),
  bookingForm: document.getElementById('bookingForm'),
  bookingResourceId: document.getElementById('bookingResourceId'),
  bookingStartTime: document.getElementById('bookingStartTime'),
  bookingEndTime: document.getElementById('bookingEndTime'),
  modalBookingTitle: document.getElementById('modalBookingTitle'),
  modalResourceSubtitle: document.getElementById('modalResourceSubtitle'),
  modalResourceIcon: document.getElementById('modalResourceIcon'),
  modalUserName: document.getElementById('modalUserName'),
  modalDurationPreview: document.getElementById('modalDurationPreview'),
  conflictBanner: document.getElementById('conflictBanner'),
  conflictMessage: document.getElementById('conflictMessage'),
  joinWaitlistFromConflictBtn: document.getElementById('joinWaitlistFromConflictBtn'),

  // Presets
  presetTomorrowMorning: document.getElementById('presetTomorrowMorning'),
  presetTomorrowAfternoon: document.getElementById('presetTomorrowAfternoon'),
  presetNextDay: document.getElementById('presetNextDay'),

  // Add Resource Modal
  addResourceModalBackdrop: document.getElementById('addResourceModalBackdrop'),
  closeAddResourceModalBtn: document.getElementById('closeAddResourceModalBtn'),
  cancelAddResourceModalBtn: document.getElementById('cancelAddResourceModalBtn'),
  addResourceForm: document.getElementById('addResourceForm'),
  newResourceName: document.getElementById('newResourceName'),
  newResourceType: document.getElementById('newResourceType'),
  newResourceStatus: document.getElementById('newResourceStatus'),
  newResourceDescription: document.getElementById('newResourceDescription'),

  // Queue Modal
  waitlistQueueModalBackdrop: document.getElementById('waitlistQueueModalBackdrop'),
  closeQueueModalBtn: document.getElementById('closeQueueModalBtn'),
  closeQueueModalBottomBtn: document.getElementById('closeQueueModalBottomBtn'),
  joinWaitlistDirectBtn: document.getElementById('joinWaitlistDirectBtn'),
  resourceQueueList: document.getElementById('resourceQueueList'),
  modalQueueTitle: document.getElementById('modalQueueTitle'),
  modalQueueSubtitle: document.getElementById('modalQueueSubtitle'),

  // Toast Container
  toastContainer: document.getElementById('toastContainer'),
  quickStatsFooter: document.getElementById('quickStatsFooter')
};

// ============================================================================
// API Service Layer
// ============================================================================
const api = {
  // Resources
  async getResources() {
    const res = await fetch('/api/resources');
    if (!res.ok) throw new Error('Failed to fetch resources');
    return res.json();
  },

  async createResource(data) {
    const res = await fetch('/api/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text() || 'Failed to create resource');
    return res.json();
  },

  async patchResourceStatus(id, status) {
    const res = await fetch(`/api/resources/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update resource status');
    return res.json();
  },

  async deleteResource(id) {
    const res = await fetch(`/api/resources/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete resource');
    return true;
  },

  // Bookings
  async getUserBookings(userId) {
    const res = await fetch(`/api/bookings/user/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch user bookings');
    return res.json();
  },

  async getAllBookings() {
    const res = await fetch('/api/bookings');
    if (!res.ok) throw new Error('Failed to fetch all bookings');
    return res.json();
  },

  async createBooking(data) {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.status === 409) {
      const errorText = await res.text();
      let msg = 'Time-slot conflict! This resource is already booked for the selected period.';
      try {
        const json = JSON.parse(errorText);
        if (json.message) msg = json.message;
      } catch (e) {
        if (errorText) msg = errorText;
      }
      const error = new Error(msg);
      error.status = 409;
      throw error;
    }
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || 'Failed to create booking');
    }
    return res.json();
  },

  async cancelBooking(id) {
    const res = await fetch(`/api/bookings/${id}/cancel`, {
      method: 'PUT'
    });
    if (!res.ok) throw new Error('Failed to cancel booking');
    return res.json();
  },

  async approveBooking(id) {
    const res = await fetch(`/api/bookings/${id}/approve`, {
      method: 'PUT'
    });
    if (!res.ok) throw new Error('Failed to approve booking');
    return res.json();
  },

  async rejectBooking(id) {
    const res = await fetch(`/api/bookings/${id}/reject`, {
      method: 'PUT'
    });
    if (!res.ok) throw new Error('Failed to reject booking');
    return res.json();
  },

  // Waitlist
  async joinWaitlist(userId, resourceId) {
    const res = await fetch('/api/waitlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, resourceId })
    });
    if (res.status === 409) {
      const error = new Error('You are already on the waitlist for this resource.');
      error.status = 409;
      throw error;
    }
    if (!res.ok) throw new Error('Failed to join waitlist');
    return res.json();
  },

  async getResourceWaitlist(resourceId) {
    const res = await fetch(`/api/waitlists/resource/${resourceId}`);
    if (!res.ok) throw new Error('Failed to fetch waitlist queue');
    return res.json();
  },

  async getUserWaitlist(userId) {
    try {
      const res = await fetch(`/api/waitlists/user/${userId}`);
      if (res.ok) return await res.json();
    } catch (e) {
      // Endpoint fallback
    }
    return [];
  }
};

// ============================================================================
// Toast Notification Utility
// ============================================================================
function showToast(title, message, type = 'info', duration = 4500) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || 'ℹ️'}</div>
    <div class="toast-body">
      <div class="toast-title">${escapeHtml(title)}</div>
      <div class="toast-message">${escapeHtml(message)}</div>
    </div>
    <button class="toast-close" aria-label="Close">&times;</button>
  `;

  elements.toastContainer.appendChild(toast);

  const closeBtn = toast.querySelector('.toast-close');
  const removeToast = () => {
    toast.classList.add('removing');
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 250);
  };

  closeBtn.addEventListener('click', removeToast);
  setTimeout(removeToast, duration);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============================================================================
// Date Formatting Helpers
// ============================================================================
function formatDateTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  const options = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };
  return date.toLocaleString('en-US', options);
}

function formatDuration(startIso, endIso) {
  if (!startIso || !endIso) return '';
  const start = new Date(startIso);
  const end = new Date(endIso);
  const diffMs = end - start;
  if (diffMs <= 0) return 'Invalid time window';

  const diffMins = Math.round(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  if (hours > 0 && mins > 0) return `${hours} hr ${mins} min`;
  if (hours > 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
  return `${mins} min`;
}

function getLocalIsoString(date) {
  const pad = (n) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// ============================================================================
// Role-Based UI & Tab Management
// ============================================================================
function updateRoleBasedVisibility() {
  const isAdmin = state.currentUser.role === 'ADMIN';

  if (elements.tabAdminBtn) {
    elements.tabAdminBtn.style.display = isAdmin ? 'inline-flex' : 'none';
  }

  // If a student is currently looking at the admin tab, switch back to browse
  if (!isAdmin && state.activeTab === 'admin') {
    switchTab('browse');
  }
}

function switchTab(tabId) {
  // Role Access Guard
  if (tabId === 'admin' && state.currentUser.role !== 'ADMIN') {
    showToast(
      'Access Denied',
      'Administrator privileges required to access the Admin Panel.',
      'warning'
    );
    return;
  }

  state.activeTab = tabId;

  document.querySelectorAll('.nav-tab').forEach((tab) => {
    const isActive = tab.dataset.tab === tabId;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  elements.tabBrowse.classList.toggle('active', tabId === 'browse');
  elements.tabMyBookings.classList.toggle('active', tabId === 'my-bookings');
  elements.tabAdmin.classList.toggle('active', tabId === 'admin');

  if (tabId === 'browse') renderResources();
  if (tabId === 'my-bookings') loadUserData();
  if (tabId === 'admin') loadAdminData();
}

// ============================================================================
// User Switching
// ============================================================================
function handleUserChange() {
  const selectedOption = elements.userSelect.selectedOptions[0];
  state.currentUser = {
    id: Number(elements.userSelect.value),
    role: selectedOption.dataset.role,
    name: selectedOption.dataset.name,
    email: selectedOption.dataset.email
  };

  elements.currentUserAvatar.textContent = state.currentUser.name.charAt(0);
  elements.modalUserName.textContent = `${state.currentUser.name} (ID: ${state.currentUser.id})`;

  updateRoleBasedVisibility();

  showToast(
    'User Switched',
    `Active Profile: ${state.currentUser.name} (${state.currentUser.role})`,
    'info',
    2500
  );

  loadUserData();
  if (state.currentUser.role === 'ADMIN') {
    loadAdminData();
  }
}

// ============================================================================
// Data Loading & Syncing
// ============================================================================
async function loadAllData() {
  await Promise.all([
    loadResources(),
    loadUserData(),
    loadAdminData()
  ]);
}

async function loadResources() {
  try {
    const data = await api.getResources();
    state.resources = data;
    renderResources();
    updateMetrics();
  } catch (err) {
    showToast('Error', 'Unable to fetch campus resources from server.', 'error');
  }
}

async function loadUserData() {
  try {
    const [bookings, waitlists] = await Promise.all([
      api.getUserBookings(state.currentUser.id),
      api.getUserWaitlist(state.currentUser.id)
    ]);
    state.userBookings = bookings;
    state.userWaitlists = waitlists;
    renderMyBookings();
    renderMyWaitlists();
    updateMetrics();
  } catch (err) {
    console.error('Error loading user bookings:', err);
  }
}

async function loadAdminData() {
  try {
    const allBookings = await api.getAllBookings();
    state.adminBookings = allBookings;
    renderAdminDashboard();
    updateMetrics();
  } catch (err) {
    console.error('Error loading admin bookings:', err);
  }
}

function updateMetrics() {
  const total = state.resources.length;
  const available = state.resources.filter((r) => r.status === 'AVAILABLE').length;

  elements.metricTotal.textContent = total;
  elements.metricAvailable.textContent = available;

  const myActive = state.userBookings.filter(
    (b) => b.status === 'CONFIRMED' || b.status === 'PENDING' || b.status === 'APPROVED'
  ).length;
  elements.myBookingsCount.textContent = myActive;

  const adminPending = state.adminBookings.filter((b) => b.status === 'PENDING').length;
  elements.adminPendingCount.textContent = adminPending;

  elements.quickStatsFooter.textContent = `${total} resources loaded • ${adminPending} pending approval`;
}

// ============================================================================
// Render: Tab 1 (Browse Resources)
// ============================================================================
function renderResources() {
  const grid = elements.resourcesGrid;
  grid.innerHTML = '';

  let filtered = state.resources;

  if (state.filterType !== 'ALL') {
    filtered = filtered.filter((r) => r.type === state.filterType);
  }

  if (state.filterOnlyAvailable) {
    filtered = filtered.filter((r) => r.status === 'AVAILABLE');
  }

  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q))
    );
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <p style="font-size: 1.1rem; font-weight: 600; color: var(--slate-700);">No matching resources found</p>
        <p style="font-size: 0.875rem; margin-top: 0.25rem;">Try adjusting your filter chips or search keywords.</p>
      </div>
    `;
    return;
  }

  const typeIcons = {
    ROOM: '🏢',
    LAB: '💻',
    EQUIPMENT: '📽️'
  };

  filtered.forEach((resource) => {
    const card = document.createElement('div');
    card.className = 'resource-card';

    const isAvailable = resource.status === 'AVAILABLE';

    let actionBtnHtml = '';
    if (isAvailable) {
      actionBtnHtml = `
        <button class="btn btn-primary btn-sm book-btn" data-id="${resource.id}">
          <span>⚡ Book Now</span>
        </button>
      `;
    } else {
      actionBtnHtml = `
        <button class="btn btn-warning btn-sm waitlist-btn" data-id="${resource.id}">
          <span>⏳ Join Waitlist</span>
        </button>
      `;
    }

    card.innerHTML = `
      <div>
        <div class="resource-card-header">
          <div class="resource-icon-wrap ${resource.type.toLowerCase()}">
            ${typeIcons[resource.type] || '📦'}
          </div>
          <div class="resource-badge-group">
            <span class="type-badge ${resource.type}">${escapeHtml(resource.type)}</span>
            <span class="status-badge ${resource.status}">
              <span class="dot"></span>
              <span>${escapeHtml(resource.status)}</span>
            </span>
          </div>
        </div>

        <h3 class="resource-name">${escapeHtml(resource.name)}</h3>
        <p class="resource-desc">${escapeHtml(resource.description || 'No detailed specifications provided.')}</p>
      </div>

      <div class="resource-card-actions">
        ${actionBtnHtml}
        <button class="btn btn-ghost btn-sm queue-peek-btn" data-id="${resource.id}" title="View current waitlist queue">
          <span>👀 View Queue</span>
        </button>
      </div>
    `;

    // Event listeners
    const bookBtn = card.querySelector('.book-btn');
    if (bookBtn) {
      bookBtn.addEventListener('click', () => openBookingModal(resource));
    }

    const waitlistBtn = card.querySelector('.waitlist-btn');
    if (waitlistBtn) {
      waitlistBtn.addEventListener('click', () => handleDirectJoinWaitlist(resource));
    }

    const queuePeekBtn = card.querySelector('.queue-peek-btn');
    if (queuePeekBtn) {
      queuePeekBtn.addEventListener('click', () => openQueueModal(resource));
    }

    grid.appendChild(card);
  });
}

// ============================================================================
// Render: Tab 2 (My Bookings & Waitlist)
// ============================================================================
function renderMyBookings() {
  const container = elements.myBookingsList;
  container.innerHTML = '';

  elements.bookingsCountBadge.textContent = `${state.userBookings.length} Bookings`;

  if (state.userBookings.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p style="font-weight: 600;">No reservations found for ${escapeHtml(state.currentUser.name)}.</p>
        <p style="font-size: 0.85rem; margin-top: 0.25rem;">Browse available rooms and labs to make your first booking!</p>
      </div>
    `;
    return;
  }

  const typeIcons = {
    ROOM: '🏢',
    LAB: '💻',
    EQUIPMENT: '📽️'
  };

  state.userBookings.forEach((booking) => {
    const card = document.createElement('div');
    card.className = 'booking-item-card';

    const canCancel =
      booking.status === 'PENDING' ||
      booking.status === 'CONFIRMED' ||
      booking.status === 'APPROVED';

    const duration = formatDuration(booking.startTime, booking.endTime);

    card.innerHTML = `
      <div class="booking-info-group">
        <div class="booking-resource-icon">
          ${typeIcons[booking.resourceType] || '📦'}
        </div>
        <div class="booking-main-details">
          <div class="booking-resource-title">
            <span>${escapeHtml(booking.resourceName)}</span>
            <span class="type-badge ${booking.resourceType}">${escapeHtml(booking.resourceType)}</span>
          </div>
          <div class="booking-time-line">
            <span>🗓️ ${formatDateTime(booking.startTime)} &rarr; ${formatDateTime(booking.endTime)}</span>
            <span>•</span>
            <span>⏳ ${duration}</span>
          </div>
        </div>
      </div>

      <div class="booking-actions-group">
        <span class="status-pill ${booking.status}">${escapeHtml(booking.status)}</span>
        ${
          canCancel
            ? `<button class="btn btn-danger btn-sm cancel-booking-btn" data-id="${booking.bookingId}">
                 <span>Cancel Booking</span>
               </button>`
            : ''
        }
      </div>
    `;

    const cancelBtn = card.querySelector('.cancel-booking-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => handleCancelBooking(booking.bookingId, booking.resourceName));
    }

    container.appendChild(card);
  });
}

function renderMyWaitlists() {
  const container = elements.myWaitlistList;
  container.innerHTML = '';

  elements.waitlistCountBadge.textContent = `${state.userWaitlists.length} Waitlisted`;

  if (state.userWaitlists.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 1.5rem 1rem;">
        <p style="color: var(--slate-500); font-size: 0.875rem;">You are not currently in any waitlist queues.</p>
      </div>
    `;
    return;
  }

  state.userWaitlists.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'waitlist-card';

    card.innerHTML = `
      <div>
        <strong style="color: var(--slate-900); font-size: 0.95rem;">${escapeHtml(item.resourceName)}</strong>
        <div style="font-size: 0.75rem; color: var(--slate-500); margin-top: 0.2rem;">
          Requested: ${formatDateTime(item.requestTime)}
        </div>
      </div>
      <div>
        <span class="status-pill ${item.status}">${escapeHtml(item.status)}</span>
      </div>
    `;

    container.appendChild(card);
  });
}

// ============================================================================
// Render: Tab 3 (Admin Panel)
// ============================================================================
function renderAdminDashboard() {
  // Stats
  const total = state.resources.length;
  const maintenance = state.resources.filter((r) => r.status === 'MAINTENANCE').length;
  const pending = state.adminBookings.filter((b) => b.status === 'PENDING').length;
  const approved = state.adminBookings.filter(
    (b) => b.status === 'APPROVED' || b.status === 'CONFIRMED'
  ).length;

  elements.statTotalResources.textContent = total;
  elements.statMaintenanceResources.textContent = maintenance;
  elements.statPendingBookings.textContent = pending;
  elements.statApprovedBookings.textContent = approved;

  elements.countAllAdminBookings.textContent = state.adminBookings.length;
  elements.countPendingAdminBookings.textContent = pending;
  elements.countApprovedAdminBookings.textContent = approved;

  // Render Bookings Table
  renderAdminBookingsTable();

  // Render Resources Table
  renderAdminResourcesTable();
}

function renderAdminBookingsTable() {
  const tbody = elements.adminBookingsTbody;
  tbody.innerHTML = '';

  let filtered = state.adminBookings;
  if (state.adminBookingFilter === 'PENDING') {
    filtered = filtered.filter((b) => b.status === 'PENDING');
  } else if (state.adminBookingFilter === 'APPROVED') {
    filtered = filtered.filter((b) => b.status === 'APPROVED' || b.status === 'CONFIRMED');
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--slate-500); padding: 2rem;">
          No bookings found matching filter "${state.adminBookingFilter}".
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach((booking) => {
    const tr = document.createElement('tr');

    const isPending = booking.status === 'PENDING';

    tr.innerHTML = `
      <td><strong>#${booking.bookingId}</strong></td>
      <td>
        <span style="font-weight: 600;">${escapeHtml(booking.username)}</span>
        <span style="color: var(--slate-400); font-size: 0.75rem;">(ID: ${booking.userId})</span>
      </td>
      <td>
        <span>${escapeHtml(booking.resourceName)}</span>
        <span class="type-badge ${booking.resourceType}" style="font-size: 0.65rem; margin-left: 0.25rem;">${escapeHtml(booking.resourceType)}</span>
      </td>
      <td style="font-size: 0.8rem; color: var(--slate-600);">
        ${formatDateTime(booking.startTime)} &rarr; ${formatDateTime(booking.endTime)}
      </td>
      <td>
        <span class="status-pill ${booking.status}">${escapeHtml(booking.status)}</span>
      </td>
      <td style="text-align: right;">
        <div style="display: inline-flex; gap: 0.4rem;">
          <button class="btn btn-success btn-sm admin-approve-btn" data-id="${booking.bookingId}" ${!isPending ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''}>
            <span>✅ Approve</span>
          </button>
          <button class="btn btn-danger btn-sm admin-reject-btn" data-id="${booking.bookingId}" ${!isPending ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''}>
            <span>❌ Reject</span>
          </button>
        </div>
      </td>
    `;

    if (isPending) {
      tr.querySelector('.admin-approve-btn').addEventListener('click', () =>
        handleAdminApprove(booking.bookingId)
      );
      tr.querySelector('.admin-reject-btn').addEventListener('click', () =>
        handleAdminReject(booking.bookingId)
      );
    }

    tbody.appendChild(tr);
  });
}

function renderAdminResourcesTable() {
  const tbody = elements.adminResourcesTbody;
  tbody.innerHTML = '';

  state.resources.forEach((resource) => {
    const tr = document.createElement('tr');

    const isAvailable = resource.status === 'AVAILABLE';

    tr.innerHTML = `
      <td><strong>#${resource.id}</strong></td>
      <td><span style="font-weight: 700; color: var(--slate-900);">${escapeHtml(resource.name)}</span></td>
      <td><span class="type-badge ${resource.type}">${escapeHtml(resource.type)}</span></td>
      <td style="max-width: 320px; color: var(--slate-600); font-size: 0.825rem;">${escapeHtml(resource.description || '—')}</td>
      <td>
        <span class="status-badge ${resource.status}">
          <span class="dot"></span>
          <span>${escapeHtml(resource.status)}</span>
        </span>
      </td>
      <td style="text-align: right;">
        <div style="display: inline-flex; gap: 0.5rem;">
          <button class="btn btn-secondary btn-sm toggle-status-btn" data-id="${resource.id}" data-status="${resource.status}">
            <span>${isAvailable ? '🔧 Set Maintenance' : '🟢 Set Available'}</span>
          </button>
          <button class="btn btn-danger btn-sm delete-resource-btn" data-id="${resource.id}" data-name="${escapeHtml(resource.name)}">
            <span>🗑️ Delete</span>
          </button>
        </div>
      </td>
    `;

    tr.querySelector('.toggle-status-btn').addEventListener('click', () => {
      const nextStatus = isAvailable ? 'MAINTENANCE' : 'AVAILABLE';
      handleToggleResourceStatus(resource.id, nextStatus);
    });

    tr.querySelector('.delete-resource-btn').addEventListener('click', () => {
      handleDeleteResource(resource.id, resource.name);
    });

    tbody.appendChild(tr);
  });
}

// ============================================================================
// Actions & Handlers
// ============================================================================

// Booking Modal Open & Presets
function openBookingModal(resource) {
  state.selectedResourceForBooking = resource;

  elements.bookingResourceId.value = resource.id;
  elements.modalBookingTitle.textContent = `Reserve ${resource.name}`;
  elements.modalResourceSubtitle.textContent = `${resource.name} • ${resource.type}`;
  elements.modalUserName.textContent = `${state.currentUser.name} (ID: ${state.currentUser.id})`;

  const typeIcons = { ROOM: '🏢', LAB: '💻', EQUIPMENT: '📽️' };
  elements.modalResourceIcon.textContent = typeIcons[resource.type] || '🏛️';

  // Hide conflict banner from any previous attempt
  elements.conflictBanner.style.display = 'none';

  // Set min constraint to current local time
  const now = new Date();
  const minNowIso = getLocalIsoString(now);
  elements.bookingStartTime.min = minNowIso;

  // Default times: Tomorrow 09:00 to 11:00
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(11, 0, 0, 0);

  const startVal = getLocalIsoString(tomorrow);
  const endVal = getLocalIsoString(tomorrowEnd);

  elements.bookingStartTime.value = startVal;
  elements.bookingEndTime.min = startVal;
  elements.bookingEndTime.value = endVal;

  updateDurationPreview();

  elements.bookingModalBackdrop.classList.add('open');
  elements.bookingStartTime.focus();
}

function closeBookingModal() {
  elements.bookingModalBackdrop.classList.remove('open');
  state.selectedResourceForBooking = null;
}

function handleStartTimeChange() {
  // Always enforce min time is now
  const now = new Date();
  elements.bookingStartTime.min = getLocalIsoString(now);

  const startVal = elements.bookingStartTime.value;
  if (!startVal) return;

  // Set the min attribute of End Time to the chosen Start Time
  elements.bookingEndTime.min = startVal;

  const startDate = new Date(startVal);
  const endDate = new Date(elements.bookingEndTime.value);

  // If End Time is empty or before/equal to Start Time, auto-adjust End Time to Start Time + 2 hours
  if (!elements.bookingEndTime.value || isNaN(endDate.getTime()) || endDate <= startDate) {
    const autoEnd = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    elements.bookingEndTime.value = getLocalIsoString(autoEnd);
  }

  updateDurationPreview();
}

function handleEndTimeChange() {
  const startVal = elements.bookingStartTime.value;
  const endVal = elements.bookingEndTime.value;

  if (startVal && endVal) {
    if (new Date(endVal) <= new Date(startVal)) {
      showToast('Validation Error', 'End time must be strictly after start time.', 'warning', 2500);
    }
  }
  updateDurationPreview();
}

function updateDurationPreview() {
  const start = elements.bookingStartTime.value;
  const end = elements.bookingEndTime.value;
  elements.modalDurationPreview.textContent = formatDuration(start, end) || '—';
}

// Quick Presets
function setPreset(daysAhead, startHour, durationHours) {
  const target = new Date();
  target.setDate(target.getDate() + daysAhead);
  target.setHours(startHour, 0, 0, 0);

  const end = new Date(target);
  end.setHours(startHour + durationHours, 0, 0, 0);

  const startIso = getLocalIsoString(target);
  const endIso = getLocalIsoString(end);

  const now = new Date();
  elements.bookingStartTime.min = getLocalIsoString(now);
  elements.bookingStartTime.value = startIso;
  elements.bookingEndTime.min = startIso;
  elements.bookingEndTime.value = endIso;

  updateDurationPreview();
}

// Booking Submission & Smart Conflict Handling
async function handleBookingSubmit(e) {
  e.preventDefault();

  const resourceId = Number(elements.bookingResourceId.value);
  const startTime = elements.bookingStartTime.value;
  const endTime = elements.bookingEndTime.value;

  if (!startTime || !endTime) {
    showToast('Validation Error', 'Please specify both start and end times.', 'warning');
    return;
  }

  const now = new Date();
  if (new Date(startTime) <= now) {
    showToast('Validation Error', 'Start time must be in the future.', 'warning');
    return;
  }

  if (new Date(endTime) <= new Date(startTime)) {
    showToast('Validation Error', 'End time must be strictly after start time.', 'warning');
    return;
  }

  const payload = {
    userId: state.currentUser.id,
    resourceId: resourceId,
    startTime: startTime,
    endTime: endTime
  };

  const submitBtn = document.getElementById('submitBookingBtn');
  const btnText = submitBtn.querySelector('.btn-text');

  try {
    submitBtn.disabled = true;
    if (btnText) btnText.textContent = 'Verifying Slot...';

    await api.createBooking(payload);

    closeBookingModal();
    showToast(
      'Reservation Confirmed!',
      `Successfully reserved ${state.selectedResourceForBooking?.name || 'Resource'} (Status: PENDING Approval).`,
      'success'
    );

    await loadAllData();
  } catch (err) {
    if (err.status === 409) {
      // Smart Conflict Display
      elements.conflictBanner.style.display = 'flex';
      elements.conflictMessage.textContent = err.message;
      showToast('Conflict Detected', err.message, 'error');
    } else {
      showToast('Booking Failed', err.message || 'Server error occurred.', 'error');
    }
  } finally {
    submitBtn.disabled = false;
    if (btnText) btnText.textContent = 'Confirm Booking';
  }
}

// Direct Waitlist Join from Conflict Banner
async function handleJoinWaitlistFromConflict() {
  if (!state.selectedResourceForBooking) return;

  try {
    const resource = state.selectedResourceForBooking;
    await api.joinWaitlist(state.currentUser.id, resource.id);

    closeBookingModal();
    showToast(
      'Waitlist Joined!',
      `You are now in the waitlist queue for ${resource.name}. You'll be auto-promoted when a slot frees up!`,
      'success'
    );

    await loadAllData();
  } catch (err) {
    showToast('Waitlist Notice', err.message, err.status === 409 ? 'warning' : 'error');
  }
}

async function handleDirectJoinWaitlist(resource) {
  try {
    await api.joinWaitlist(state.currentUser.id, resource.id);
    showToast(
      'Waitlist Joined!',
      `You are in the queue for ${resource.name}. Status: WAITING.`,
      'success'
    );
    await loadAllData();
  } catch (err) {
    showToast('Waitlist Notice', err.message, err.status === 409 ? 'warning' : 'error');
  }
}

// Cancel Booking Flow
async function handleCancelBooking(bookingId, resourceName) {
  if (!confirm(`Are you sure you want to cancel your booking for ${resourceName}?`)) {
    return;
  }

  try {
    await api.cancelBooking(bookingId);

    showToast(
      'Booking Cancelled',
      `Booking #${bookingId} was cancelled. Waitlist auto-trigger inspected the queue and promoted the next student!`,
      'info',
      6000
    );

    await loadAllData();
  } catch (err) {
    showToast('Cancellation Error', err.message, 'error');
  }
}

// Admin Approvals
async function handleAdminApprove(bookingId) {
  try {
    await api.approveBooking(bookingId);
    showToast('Approved', `Booking #${bookingId} has been APPROVED!`, 'success');
    await loadAllData();
  } catch (err) {
    showToast('Error', err.message, 'error');
  }
}

async function handleAdminReject(bookingId) {
  try {
    await api.rejectBooking(bookingId);
    showToast('Rejected', `Booking #${bookingId} has been REJECTED.`, 'warning');
    await loadAllData();
  } catch (err) {
    showToast('Error', err.message, 'error');
  }
}

// Admin Resource Management
function openAddResourceModal() {
  elements.addResourceForm.reset();
  elements.addResourceModalBackdrop.classList.add('open');
  elements.newResourceName.focus();
}

function closeAddResourceModal() {
  elements.addResourceModalBackdrop.classList.remove('open');
}

async function handleAddResourceSubmit(e) {
  e.preventDefault();

  const name = elements.newResourceName.value.trim();
  const type = elements.newResourceType.value;
  const status = elements.newResourceStatus.value;
  const description = elements.newResourceDescription.value.trim();

  if (!name) {
    showToast('Validation Error', 'Resource name is required.', 'warning');
    return;
  }

  const payload = { name, type, status, description };

  try {
    await api.createResource(payload);
    closeAddResourceModal();
    showToast('Resource Created', `Added new ${type}: "${name}"`, 'success');
    await loadResources();
    await loadAdminData();
  } catch (err) {
    showToast('Creation Failed', err.message, 'error');
  }
}

async function handleToggleResourceStatus(resourceId, newStatus) {
  try {
    await api.patchResourceStatus(resourceId, newStatus);
    showToast('Status Updated', `Resource #${resourceId} is now ${newStatus}.`, 'info');
    await loadResources();
    await loadAdminData();
  } catch (err) {
    showToast('Update Failed', err.message, 'error');
  }
}

async function handleDeleteResource(resourceId, resourceName) {
  if (!confirm(`Are you sure you want to permanently delete "${resourceName}"?`)) {
    return;
  }

  try {
    await api.deleteResource(resourceId);
    showToast('Deleted', `Resource "${resourceName}" was removed.`, 'warning');
    await loadResources();
    await loadAdminData();
  } catch (err) {
    showToast('Delete Failed', err.message, 'error');
  }
}

// Waitlist Queue Modal
async function openQueueModal(resource) {
  state.selectedResourceForQueue = resource;
  elements.modalQueueTitle.textContent = `${resource.name} — Waitlist Queue`;
  elements.modalQueueSubtitle.textContent = `Type: ${resource.type} • Status: ${resource.status}`;

  const list = elements.resourceQueueList;
  list.innerHTML = '<div class="spinner"></div>';
  elements.waitlistQueueModalBackdrop.classList.add('open');

  try {
    const queue = await api.getResourceWaitlist(resource.id);
    renderQueueList(queue);
  } catch (err) {
    list.innerHTML = '<p style="color:var(--rose-500);">Failed to load waitlist queue.</p>';
  }
}

function renderQueueList(queue) {
  const list = elements.resourceQueueList;
  list.innerHTML = '';

  if (!queue || queue.length === 0) {
    list.innerHTML = `
      <div class="empty-state" style="padding: 1.5rem 0;">
        <p style="font-weight: 600; color: var(--slate-700);">Queue is currently empty!</p>
        <p style="font-size: 0.85rem; margin-top: 0.25rem;">No students are waiting for this resource.</p>
      </div>
    `;
    return;
  }

  queue.forEach((entry, index) => {
    const item = document.createElement('div');
    item.className = 'queue-item';

    item.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.85rem;">
        <div class="queue-pos">#${index + 1}</div>
        <div>
          <strong style="color: var(--slate-900); font-size: 0.9rem;">${escapeHtml(entry.username)}</strong>
          <div style="font-size: 0.75rem; color: var(--slate-500);">Requested: ${formatDateTime(entry.requestTime)}</div>
        </div>
      </div>
      <div>
        <span class="status-pill ${entry.status}">${escapeHtml(entry.status)}</span>
      </div>
    `;

    list.appendChild(item);
  });
}

function closeQueueModal() {
  elements.waitlistQueueModalBackdrop.classList.remove('open');
  state.selectedResourceForQueue = null;
}

// ============================================================================
// Event Listeners Binding
// ============================================================================
function setupEventListeners() {
  // Tab Switching
  elements.navTabs.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('.nav-tab');
    if (tabBtn && tabBtn.dataset.tab) {
      switchTab(tabBtn.dataset.tab);
    }
  });

  // User Select
  elements.userSelect.addEventListener('change', handleUserChange);

  // Search & Filters
  elements.resourceSearchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderResources();
  });

  elements.typeFilters.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (chip && chip.dataset.filter) {
      document.querySelectorAll('.filter-chips .chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      state.filterType = chip.dataset.filter;
      renderResources();
    }
  });

  elements.onlyAvailableToggle.addEventListener('click', () => {
    state.filterOnlyAvailable = !state.filterOnlyAvailable;
    elements.onlyAvailableToggle.classList.toggle('active', state.filterOnlyAvailable);
    renderResources();
  });

  // My Bookings Refresh
  elements.refreshMyBookingsBtn.addEventListener('click', () => {
    loadUserData();
    showToast('Refreshed', 'Schedule and queue updated.', 'info', 1800);
  });

  // Admin Filter Pills
  document.querySelectorAll('.admin-filter-pills .pill-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-filter-pills .pill-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.adminBookingFilter = btn.dataset.adminFilter;
      renderAdminBookingsTable();
    });
  });

  // Booking Modal & DateTime Inputs
  elements.closeBookingModalBtn.addEventListener('click', closeBookingModal);
  elements.cancelBookingModalBtn.addEventListener('click', closeBookingModal);

  elements.bookingStartTime.addEventListener('change', handleStartTimeChange);
  elements.bookingStartTime.addEventListener('input', handleStartTimeChange);
  elements.bookingEndTime.addEventListener('change', handleEndTimeChange);
  elements.bookingEndTime.addEventListener('input', handleEndTimeChange);

  elements.bookingForm.addEventListener('submit', handleBookingSubmit);
  elements.joinWaitlistFromConflictBtn.addEventListener('click', handleJoinWaitlistFromConflict);

  // Presets
  elements.presetTomorrowMorning.addEventListener('click', () => setPreset(1, 9, 2));
  elements.presetTomorrowAfternoon.addEventListener('click', () => setPreset(1, 14, 2));
  elements.presetNextDay.addEventListener('click', () => setPreset(2, 10, 2));

  // Add Resource Modal
  elements.openAddResourceModalBtn.addEventListener('click', openAddResourceModal);
  elements.closeAddResourceModalBtn.addEventListener('click', closeAddResourceModal);
  elements.cancelAddResourceModalBtn.addEventListener('click', closeAddResourceModal);
  elements.addResourceForm.addEventListener('submit', handleAddResourceSubmit);

  // Queue Modal
  elements.closeQueueModalBtn.addEventListener('click', closeQueueModal);
  elements.closeQueueModalBottomBtn.addEventListener('click', closeQueueModal);
  elements.joinWaitlistDirectBtn.addEventListener('click', () => {
    if (state.selectedResourceForQueue) {
      handleDirectJoinWaitlist(state.selectedResourceForQueue);
      closeQueueModal();
    }
  });

  // Close modals on backdrop click or ESC key
  window.addEventListener('click', (e) => {
    if (e.target === elements.bookingModalBackdrop) closeBookingModal();
    if (e.target === elements.addResourceModalBackdrop) closeAddResourceModal();
    if (e.target === elements.waitlistQueueModalBackdrop) closeQueueModal();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeBookingModal();
      closeAddResourceModal();
      closeQueueModal();
    }
  });
}

// ============================================================================
// Initialization
// ============================================================================
async function initApp() {
  setupEventListeners();
  updateRoleBasedVisibility();
  await loadAllData();
  console.log('Campus Booking Hub Frontend Initialized.');
}

document.addEventListener('DOMContentLoaded', initApp);
