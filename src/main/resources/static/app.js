/**
 * Campus Booking Hub – Frontend Controller & API Integration
 * Vanilla JS Single Page Application (ES6+)
 */

// ============================================================================
// Application State
// ============================================================================
const state = {
  currentUser: null,
  resources: [],
  kits: [],
  userBookings: [],
  userBookingHistory: [],
  userKitBookings: [],
  userKitBookingHistory: [],
  userWaitlists: [],
  adminBookings: [],
  adminBookingHistory: [],
  adminKitBookings: [],
  adminIssues: [],
  adminWaitlistOverview: [],
  activeTab: 'home',
  activeNavKey: 'home',
  contextRoute: null,
  filterType: 'ALL',
  filterOnlyAvailable: false,
  searchQuery: '',
  bookingView: 'UPCOMING',
  selectedResourceForBooking: null,
  selectedKitForBooking: null,
  selectedResourceForIssue: null,
  selectedGroupMembers: [],
  availability: null,
  availabilityWeekStart: null,
  selectedScheduleStart: null,
  selectedScheduleEnd: null,
  selectedMobileDay: 0,
  timeFirstResults: [],
  timeFirstSearch: null,
  timeFirstSearchError: null,
  timeFirstSearching: false,
  timeFirstSelection: null,
  timeFirstSuccess: null,
  timeFirstConflict: false,
  timeFirstSubmitting: false,
  resourceLoadError: null,
  kitLoadError: null,
  resourcesLoaded: false,
  kitsLoaded: false,
  adminLoadError: null,
  adminHistoryLoadError: null,
  adminDataLoaded: false,
  userDataLoaded: false,
};

// Local catalogue artwork is mapped by the seeded resource/kit identity.
// Equipment intentionally uses the shared icon treatment instead of photos.
const RESOURCE_IMAGE_BY_NAME = Object.freeze({
  'Study Room A': '/images/resources/study-room-a.webp',
  'Group Study Room B': '/images/resources/group-study-room-b.webp',
  'Quiet Study Room 2.14': '/images/resources/quiet-study-room-214.webp',
  'Accessible Study Room 1.05': '/images/resources/accessible-study-room-105.webp',
  'Project Team Room 3.12': '/images/resources/project-team-room-312.webp',
  'Postgraduate Study Room 2.21': '/images/resources/postgraduate-study-room-221.webp',
  'Computer Lab 101': '/images/resources/computer-lab-101.webp',
  'Computer Lab 203': '/images/resources/computer-lab-203.webp',
  'GPU Computing Lab': '/images/resources/gpu-computing-lab.webp',
  'Electronics Prototyping Lab': '/images/resources/electronics-prototyping-lab.webp'
});

const KIT_IMAGE_BY_NAME = Object.freeze({
  'Media Production Kit': '/images/kits/kit-media-production.webp',
  'Podcast Recording Kit': '/images/kits/kit-podcast-recording.webp',
  'Hybrid Teaching Kit': '/images/kits/kit-hybrid-teaching.webp',
  'Field Interview Kit': '/images/kits/kit-field-interview.webp'
});

const PROJECTOR_ICON_PATH = '<rect x="3" y="5" width="18" height="12" rx="2"/><circle cx="16.5" cy="11" r="2.5"/><path d="M8 21h8m-4-4v4"/>';
const GENERAL_EQUIPMENT_ICON_PATH = '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/>';

const EQUIPMENT_ICON_PATHS = Object.freeze({
  'Projector Unit #3': PROJECTOR_ICON_PATH,
  'DSLR 4K Camera': '<path d="M4 8h4l1.5-2h5L16 8h4a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.5"/>',
  'Heavy-Duty Tripod': '<path d="M5 4h14v4H5zM12 8v3m0-1L6 21m6-11 6 11m-6-11v11"/>',
  'Shotgun Mic Kit': '<path d="M3 11h13a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H3v7Zm0-4h-1m18-2 1.5-1m-1.5 5 1.5 1M8 11v4a4 4 0 0 0 4 4h1"/>',
  'Studio Podcast Mic': '<rect x="8" y="3" width="8" height="12" rx="4"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4m-4 0h8M9 7h6m-6 3h6"/>',
  'Audio Interface Mixer': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 8v2m0 4v2m5-8v4m0 2v2m5-8v2m0 4v2"/><circle cx="7" cy="12" r="1"/><circle cx="12" cy="13" r="1"/><circle cx="17" cy="12" r="1"/>',
  'Studio Monitor Headphones': '<path d="M4 13v-1a8 8 0 0 1 16 0v1"/><rect x="3" y="12" width="4" height="8" rx="2"/><rect x="17" y="12" width="4" height="8" rx="2"/>',
  'Wireless Presentation Kit': '<rect x="9" y="2.5" width="6" height="19" rx="3"/><circle cx="12" cy="8" r="1.2"/><path d="M10 13h4m-3 4h2"/>',
  'Portable LCD Projector': PROJECTOR_ICON_PATH,
  'Portable Field Recorder': '<rect x="4" y="3" width="16" height="18" rx="2"/><rect x="7" y="6" width="10" height="7" rx="1"/><path d="M8 10h1l1-2 2 4 1.5-3 1 1H16M8 16h8m-8 2h.01m4-.01h.01m4 0h.01"/>',
  'LED Light Panel Kit': '<rect x="4" y="3" width="16" height="11" rx="1.5"/><path d="M8 6h8m-8 4h8m-4 4v3m0 0-4 4m4-4 4 4m-4-4v4"/>'
});

function catalogueSvgIcon(path) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

function catalogueIconSvg(type) {
  const paths = {
    ROOM: '<path d="M4 20V5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5V20M2.5 20h19M8 8h3v3H8zM13.5 8H16M13.5 11H16M8 14h3v6"/>',
    LAB: '<rect x="3" y="4" width="18" height="13" rx="1.5"/><path d="M8 21h8M12 17v4M7 8h10M7 11h7"/>',
    KIT: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>'
  };
  return catalogueSvgIcon(paths[type] || GENERAL_EQUIPMENT_ICON_PATH);
}

function equipmentIconSvg(resourceName) {
  return catalogueSvgIcon(EQUIPMENT_ICON_PATHS[resourceName] || GENERAL_EQUIPMENT_ICON_PATH);
}

function catalogueImageMarkup(imagePath, altText, fallbackType) {
  const fallback = `<span class="catalogue-image-fallback" hidden>${catalogueIconSvg(fallbackType)}</span>`;
  if (!imagePath) {
    return `<div class="catalogue-image-frame catalogue-image-frame-fallback" aria-label="Image unavailable for ${escapeHtml(altText)}">${fallback.replace(' hidden', '')}</div>`;
  }
  return `<div class="catalogue-image-frame"><img class="catalogue-card-image" src="${imagePath}" alt="${escapeHtml(altText)}" loading="lazy">${fallback}</div>`;
}

function bindCatalogueImageFallbacks(container) {
  container.querySelectorAll('.catalogue-card-image').forEach((image) => {
    image.addEventListener('error', () => {
      image.hidden = true;
      const fallback = image.nextElementSibling;
      if (fallback) fallback.hidden = false;
    }, { once: true });
  });
}

const STUDENT_ROUTES = Object.freeze({
  home: { tabId: 'home', title: 'Home' },
  'find-availability': { tabId: 'find-availability', title: 'Find availability' },
  resources: { tabId: 'browse', title: 'Resources' },
  bookings: { tabId: 'my-bookings', title: 'My bookings' },
  waitlist: { tabId: 'waitlist', title: 'Waitlist' }
});

const ADMIN_ROUTES = Object.freeze({
  'admin-overview': {
    view: 'overview',
    title: 'Overview',
    description: 'A summary of booking activity, inventory, and work that needs attention.'
  },
  'admin-requests': {
    view: 'requests',
    title: 'Booking requests',
    description: 'Review reservations that are waiting for an approval decision.'
  },
  'admin-reservations': {
    view: 'reservations',
    title: 'Reservations',
    description: 'Review approved and current reservations alongside relevant booking history.'
  },
  'admin-resources': {
    view: 'resources',
    title: 'Resources',
    description: 'Manage campus rooms, labs, equipment, and their operational status.'
  },
  'admin-kits': {
    view: 'kits',
    title: 'Project Kits',
    description: 'Review Project Kit configurations, included resources, and readiness.'
  },
  'admin-issues': {
    view: 'issues',
    title: 'Issues & maintenance',
    description: 'Review reported problems and track maintenance work.'
  }
});

// ============================================================================
// DOM Element Cache
// ============================================================================
const elements = {
  // Authentication
  authScreen: document.getElementById('authScreen'),
  authNotice: document.getElementById('authNotice'),
  authPanelTitle: document.getElementById('authPanelTitle'),
  authPanelDescription: document.getElementById('authPanelDescription'),
  signInModeBtn: document.getElementById('signInModeBtn'),
  registerModeBtn: document.getElementById('registerModeBtn'),
  loginForm: document.getElementById('loginForm'),
  registerForm: document.getElementById('registerForm'),
  authLoginUsername: document.getElementById('authLoginUsername'),
  authLoginPassword: document.getElementById('authLoginPassword'),
  authRegisterUsername: document.getElementById('authRegisterUsername'),
  authRegisterEmail: document.getElementById('authRegisterEmail'),
  authRegisterPassword: document.getElementById('authRegisterPassword'),
  authRegisterConfirmPassword: document.getElementById('authRegisterConfirmPassword'),
  loginSubmitBtn: document.getElementById('loginSubmitBtn'),
  registerSubmitBtn: document.getElementById('registerSubmitBtn'),
  demoFillBtns: document.querySelectorAll('.demo-fill-btn'),

  app: document.getElementById('app'),
  // Navigation & User
  navTabs: document.getElementById('navTabs'),
  tabAdminBtn: document.getElementById('tabAdminBtn'),
  studentNavGroup: document.getElementById('studentNavGroup'),
  adminNavGroup: document.getElementById('adminNavGroup'),
  mobileMenuBtn: document.getElementById('mobileMenuBtn'),
  mobileWorkspaceTitle: document.getElementById('mobileWorkspaceTitle'),
  mobileUserAvatar: document.getElementById('mobileUserAvatar'),
  appSidebar: document.getElementById('appSidebar'),
  sidebarBackdrop: document.getElementById('sidebarBackdrop'),
  logoutBtn: document.getElementById('logoutBtn'),
  currentUserAvatar: document.getElementById('currentUserAvatar'),
  currentUserName: document.getElementById('currentUserName'),
  currentUserRole: document.getElementById('currentUserRole'),
  sidebarWorkspaceLabel: document.getElementById('sidebarWorkspaceLabel'),
  myBookingsCount: document.getElementById('myBookingsCount'),
  waitlistNavCount: document.getElementById('waitlistNavCount'),
  adminPendingCount: document.getElementById('adminPendingCount'),
  adminIssuesCount: document.getElementById('adminIssuesCount'),

  // Tabs
  tabHome: document.getElementById('tab-home'),
  tabFindAvailability: document.getElementById('tab-find-availability'),
  tabBrowse: document.getElementById('tab-browse'),
  tabMyBookings: document.getElementById('tab-my-bookings'),
  tabWaitlist: document.getElementById('tab-waitlist'),
  tabAdmin: document.getElementById('tab-admin'),
  homeUserName: document.getElementById('homeUserName'),
  homeFindAvailabilityBtn: document.getElementById('homeFindAvailabilityBtn'),
  homeQuickLinks: document.querySelectorAll('.home-quick-link'),
  homeUpcomingList: document.getElementById('homeUpcomingList'),
  homeViewAllBookingsBtn: document.getElementById('homeViewAllBookingsBtn'),
  homeWaitlistOffer: document.getElementById('homeWaitlistOffer'),
  homeWaitlistOfferTitle: document.getElementById('homeWaitlistOfferTitle'),
  homeWaitlistOfferTime: document.getElementById('homeWaitlistOfferTime'),
  homeWaitlistOfferBtn: document.getElementById('homeWaitlistOfferBtn'),

  // Time-first availability search
  timeFirstSearchForm: document.getElementById('timeFirstSearchForm'),
  timeFirstDate: document.getElementById('timeFirstDate'),
  timeFirstStart: document.getElementById('timeFirstStart'),
  timeFirstDuration: document.getElementById('timeFirstDuration'),
  timeFirstCategory: document.getElementById('timeFirstCategory'),
  timeFirstCapacityGroup: document.getElementById('timeFirstCapacityGroup'),
  timeFirstCapacity: document.getElementById('timeFirstCapacity'),
  timeFirstKeyword: document.getElementById('timeFirstKeyword'),
  timeFirstSearchNotice: document.getElementById('timeFirstSearchNotice'),
  timeFirstSearchBtn: document.getElementById('timeFirstSearchBtn'),
  timeFirstResultsSection: document.getElementById('timeFirstResultsSection'),
  timeFirstInterval: document.getElementById('timeFirstInterval'),
  timeFirstResultsGrid: document.getElementById('timeFirstResultsGrid'),
  timeFirstRefreshBtn: document.getElementById('timeFirstRefreshBtn'),
  timeFirstReviewSection: document.getElementById('timeFirstReviewSection'),
  timeFirstBackBtn: document.getElementById('timeFirstBackBtn'),
  timeFirstReviewDetails: document.getElementById('timeFirstReviewDetails'),
  timeFirstConflictNotice: document.getElementById('timeFirstConflictNotice'),
  timeFirstConflictRefreshBtn: document.getElementById('timeFirstConflictRefreshBtn'),
  timeFirstGroupMemberInput: document.getElementById('timeFirstGroupMemberInput'),
  timeFirstAddMemberBtn: document.getElementById('timeFirstAddMemberBtn'),
  timeFirstGroupMembersTags: document.getElementById('timeFirstGroupMembersTags'),
  timeFirstSubmitBtn: document.getElementById('timeFirstSubmitBtn'),
  timeFirstSuccessSection: document.getElementById('timeFirstSuccessSection'),
  timeFirstSuccessResource: document.getElementById('timeFirstSuccessResource'),
  timeFirstSuccessTime: document.getElementById('timeFirstSuccessTime'),
  timeFirstViewBookingsBtn: document.getElementById('timeFirstViewBookingsBtn'),
  timeFirstAnotherBtn: document.getElementById('timeFirstAnotherBtn'),

  // Browse Tab
  resourcesGrid: document.getElementById('resourcesGrid'),
  resourcesCatalogueView: document.getElementById('resourcesCatalogueView'),
  resourceDetailPage: document.getElementById('resourceDetailPage'),
  resourceDetailContent: document.getElementById('resourceDetailContent'),
  resourceDetailBackBtn: document.getElementById('resourceDetailBackBtn'),
  resourceSearchInput: document.getElementById('resourceSearchInput'),
  typeFilters: document.getElementById('typeFilters'),
  onlyAvailableToggle: document.getElementById('onlyAvailableToggle'),
  metricTotal: document.getElementById('metricTotal'),
  metricAvailable: document.getElementById('metricAvailable'),
  studentSnapshot: document.getElementById('studentSnapshot'),
  studentSnapshotGrid: document.getElementById('studentSnapshotGrid'),

  // My Bookings Tab
  myBookingsList: document.getElementById('myBookingsList'),
  myWaitlistList: document.getElementById('myWaitlistList'),
  bookingsCountBadge: document.getElementById('bookingsCountBadge'),
  bookingViewTabs: document.querySelector('.booking-view-tabs'),
  bookingViewTitle: document.getElementById('bookingViewTitle'),
  bookingViewDescription: document.getElementById('bookingViewDescription'),
  upcomingBookingsCount: document.getElementById('upcomingBookingsCount'),
  historyBookingsCount: document.getElementById('historyBookingsCount'),
  waitlistCountBadge: document.getElementById('waitlistCountBadge'),
  refreshMyBookingsBtn: document.getElementById('refreshMyBookingsBtn'),

  // Admin Tab
  statPendingBookings: document.getElementById('statPendingBookings'),
  statApprovedBookings: document.getElementById('statApprovedBookings'),
  statTotalResources: document.getElementById('statTotalResources'),
  statMaintenanceResources: document.getElementById('statMaintenanceResources'),
  statOpenIssues: document.getElementById('statOpenIssues'),
  adminBookingsTbody: document.getElementById('adminBookingsTbody'),
  adminReservationsTbody: document.getElementById('adminReservationsTbody'),
  adminReservationsCountBadge: document.getElementById('adminReservationsCountBadge'),
  adminKitCatalogue: document.getElementById('adminKitCatalogue'),
  adminKitCountBadge: document.getElementById('adminKitCountBadge'),
  adminKitRequestsLink: document.getElementById('adminKitRequestsLink'),
  adminPageTitle: document.getElementById('adminPageTitle'),
  adminPageDescription: document.getElementById('adminPageDescription'),
  adminNeedsAttentionList: document.getElementById('adminNeedsAttentionList'),
  adminUpcomingReservationsList: document.getElementById('adminUpcomingReservationsList'),
  adminAddResourceAction: document.getElementById('adminAddResourceAction'),
  adminResourcesTbody: document.getElementById('adminResourcesTbody'),
  countPendingAdminBookings: document.getElementById('countPendingAdminBookings'),
  openAddResourceModalBtn: document.getElementById('openAddResourceModalBtn'),
  adminIssuesTbody: document.getElementById('adminIssuesTbody'),
  issuesCountBadge: document.getElementById('issuesCountBadge'),
  adminWaitlistTbody: document.getElementById('adminWaitlistTbody'),
  adminWaitlistCountBadge: document.getElementById('adminWaitlistCountBadge'),

  // Booking Modal
  weeklyAvailabilityPage: document.getElementById('weeklyAvailabilityPage'),
  availabilityPageBackBtn: document.getElementById('availabilityPageBackBtn'),
  cancelBookingModalBtn: document.getElementById('cancelBookingModalBtn'),
  bookingForm: document.getElementById('bookingForm'),
  bookingResourceId: document.getElementById('bookingResourceId'),
  bookingIsKit: document.getElementById('bookingIsKit'),
  bookingKitId: document.getElementById('bookingKitId'),
  groupMemberInput: document.getElementById('groupMemberInput'),
  addGroupMemberBtn: document.getElementById('addGroupMemberBtn'),
  groupMembersTagsContainer: document.getElementById('groupMembersTagsContainer'),
  bookingStartTime: document.getElementById('bookingStartTime'),
  bookingEndTime: document.getElementById('bookingEndTime'),
  modalBookingTitle: document.getElementById('modalBookingTitle'),
  modalResourceSubtitle: document.getElementById('modalResourceSubtitle'),
  modalUserName: document.getElementById('modalUserName'),
  modalDurationPreview: document.getElementById('modalDurationPreview'),
  modalSelectedDate: document.getElementById('modalSelectedDate'),
  modalSelectedTime: document.getElementById('modalSelectedTime'),
  selectionValidation: document.getElementById('selectionValidation'),
  modalOperationalStatus: document.getElementById('modalOperationalStatus'),
  availabilitySummaryName: document.getElementById('availabilitySummaryName'),
  availabilitySummaryLocationRow: document.getElementById('availabilitySummaryLocationRow'),
  availabilitySummaryLocationLabel: document.getElementById('availabilitySummaryLocationLabel'),
  availabilitySummaryLocation: document.getElementById('availabilitySummaryLocation'),
  availabilitySummaryCapacityRow: document.getElementById('availabilitySummaryCapacityRow'),
  availabilitySummaryCapacity: document.getElementById('availabilitySummaryCapacity'),
  scheduleWeekLabel: document.getElementById('scheduleWeekLabel'),
  scheduleState: document.getElementById('scheduleState'),
  scheduleDaysGrid: document.getElementById('scheduleDaysGrid'),
  mobileDaySelector: document.getElementById('mobileDaySelector'),
  previousWeekBtn: document.getElementById('previousWeekBtn'),
  currentWeekBtn: document.getElementById('currentWeekBtn'),
  nextWeekBtn: document.getElementById('nextWeekBtn'),
  clearSlotSelectionBtn: document.getElementById('clearSlotSelectionBtn'),
  conflictBanner: document.getElementById('conflictBanner'),
  conflictMessage: document.getElementById('conflictMessage'),
  joinWaitlistFromConflictBtn: document.getElementById('joinWaitlistFromConflictBtn'),
  bookingSuccessState: document.getElementById('bookingSuccessState'),
  bookingSuccessTitle: document.getElementById('bookingSuccessTitle'),
  bookingSuccessMessage: document.getElementById('bookingSuccessMessage'),
  bookingSuccessResource: document.getElementById('bookingSuccessResource'),
  bookingSuccessTime: document.getElementById('bookingSuccessTime'),
  closeBookingSuccessBtn: document.getElementById('closeBookingSuccessBtn'),
  viewBookingsFromSuccessBtn: document.getElementById('viewBookingsFromSuccessBtn'),

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
  newResourceLocation: document.getElementById('newResourceLocation'),
  newResourceCapacity: document.getElementById('newResourceCapacity'),

  // Issue Modal
  issueModalBackdrop: document.getElementById('issueModalBackdrop'),
  closeIssueModalBtn: document.getElementById('closeIssueModalBtn'),
  cancelIssueModalBtn: document.getElementById('cancelIssueModalBtn'),
  issueForm: document.getElementById('issueForm'),
  issueResourceId: document.getElementById('issueResourceId'),
  issueDescription: document.getElementById('issueDescription'),
  modalIssueResourceName: document.getElementById('modalIssueResourceName'),
  submitIssueBtn: document.getElementById('submitIssueBtn'),

  // Toast Container
  toastContainer: document.getElementById('toastContainer'),
  quickStatsFooter: document.getElementById('quickStatsFooter'),

  // Confirmation Dialog
  confirmModalBackdrop: document.getElementById('confirmModalBackdrop'),
  confirmModalTitle: document.getElementById('confirmModalTitle'),
  confirmModalMessage: document.getElementById('confirmModalMessage'),
  confirmModalIcon: document.getElementById('confirmModalIcon'),
  confirmModalCancelBtn: document.getElementById('confirmModalCancelBtn'),
  confirmModalConfirmBtn: document.getElementById('confirmModalConfirmBtn')
};

const STATUS_LABELS = Object.freeze({
  AVAILABLE: 'Available',
  MAINTENANCE: 'Maintenance',
  UNAVAILABLE: 'Unavailable',
  PENDING: 'Awaiting approval',
  APPROVED: 'Confirmed',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  WAITING: 'Waiting',
  OFFERED: 'Slot available',
  EXPIRED: 'Expired',
  OPEN: 'Under review',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  BOOKED: 'Booked',
  HELD: 'Temporarily held',
  PAST: 'Past'
});

const RESOURCE_TYPE_LABELS = Object.freeze({
  ROOM: 'Study room',
  LAB: 'Computer lab',
  EQUIPMENT: 'Equipment',
  KIT: 'Project Kit'
});

const RESOURCE_STATUS_LABELS = Object.freeze({
  AVAILABLE: 'Operational',
  MAINTENANCE: 'Maintenance',
  UNAVAILABLE: 'Unavailable'
});

function humanize(value) {
  if (!value) return '';
  return String(value)
    .toLowerCase()
    .replace(/(^|\s|_)([a-z])/g, (_, prefix, letter) => `${prefix === '_' ? ' ' : prefix}${letter.toUpperCase()}`);
}

function getStatusLabel(status, options = {}) {
  if (status === 'PENDING' && options.history) return 'Expired request';
  return STATUS_LABELS[status] || humanize(status);
}

function getResourceTypeLabel(type) {
  return RESOURCE_TYPE_LABELS[type] || humanize(type);
}

function getResourceStatusLabel(status) {
  return RESOURCE_STATUS_LABELS[status] || getStatusLabel(status);
}

function getRoleLabel(role) {
  return role === 'ADMIN' ? 'Administrator' : 'Student';
}

async function responseError(response, fallbackMessage) {
  const body = await response.json().catch(() => ({}));
  const error = new Error(body.message || body.error || fallbackMessage);
  error.status = response.status;
  return error;
}

// ============================================================================
// API Service Layer
// ============================================================================
const api = {
  async login(username, password) {
    const res = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw await responseError(res, 'We could not sign you in. Check your details and try again.');
    return res.json();
  },

  async register(data) {
    const res = await fetch('/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw await responseError(res, 'We could not create your account. Check the details and try again.');
    return res.json();
  },

  async getCurrentUser() {
    const res = await fetch('/api/users/me');
    if (!res.ok) throw await responseError(res, 'No active session.');
    return res.json();
  },

  async logout() {
    const res = await fetch('/api/users/logout', { method: 'POST' });
    if (!res.ok) throw await responseError(res, 'We could not sign you out. Please try again.');
  },

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

  async getResourceAvailability(id, start, end) {
    const query = new URLSearchParams({ start, end });
    const res = await fetch(`/api/resources/${id}/availability?${query}`);
    if (!res.ok) throw new Error(await res.text() || 'Failed to load resource availability');
    return res.json();
  },

  async searchAvailability(start, end, type, minCapacity, keyword) {
    const query = new URLSearchParams({ start, end, type });
    if (minCapacity) query.set('minCapacity', minCapacity);
    if (keyword) query.set('keyword', keyword);
    const res = await fetch(`/api/availability/search?${query}`);
    if (!res.ok) throw await responseError(res, 'Availability search failed. Please try again.');
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
    if (!res.ok) throw await responseError(res, 'Failed to fetch user bookings');
    return res.json();
  },

  async getUserBookingHistory(userId) {
    const res = await fetch(`/api/bookings/user/${userId}/history`);
    if (!res.ok) throw await responseError(res, 'Failed to fetch booking history');
    return res.json();
  },

  async getAllBookings() {
    const res = await fetch('/api/bookings');
    if (!res.ok) throw await responseError(res, 'Failed to fetch all bookings');
    return res.json();
  },

  async getAdminBookingHistory() {
    const res = await fetch('/api/bookings/history');
    if (!res.ok) throw await responseError(res, 'Failed to fetch reservation history');
    return res.json();
  },

  // Product-level Project Kit reservations
  async getUserKitBookings(userId) {
    const res = await fetch(`/api/kit-bookings/user/${userId}`);
    if (!res.ok) throw await responseError(res, 'Failed to fetch Project Kit reservations');
    return res.json();
  },

  async getUserKitBookingHistory(userId) {
    const res = await fetch(`/api/kit-bookings/user/${userId}/history`);
    if (!res.ok) throw await responseError(res, 'Failed to fetch Project Kit history');
    return res.json();
  },

  async getAllKitBookings() {
    const res = await fetch('/api/kit-bookings');
    if (!res.ok) throw await responseError(res, 'Failed to fetch Project Kit requests');
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
        else if (json.error) msg = json.error;
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

  // Kits (Resource Bundles)
  async getKits() {
    const res = await fetch('/api/kits');
    if (!res.ok) throw new Error('Failed to fetch project kits');
    return res.json();
  },

  async getKitAvailability(id, start, end) {
    const query = new URLSearchParams({ start, end });
    const res = await fetch(`/api/kits/${id}/availability?${query}`);
    if (!res.ok) throw new Error(await res.text() || 'Failed to load Project Kit availability');
    return res.json();
  },

  async bookKit(kitId, data) {
    const res = await fetch(`/api/kits/${kitId}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.status === 409) {
      const errorText = await res.text();
      let msg = 'Conflict detected! One or more bundled resources in this kit are unavailable or already booked.';
      try {
        const json = JSON.parse(errorText);
        if (json.message) msg = json.message;
        else if (json.error) msg = json.error;
      } catch (e) {
        if (errorText) msg = errorText;
      }
      const error = new Error(msg);
      error.status = 409;
      throw error;
    }
    if (!res.ok) {
      throw await responseError(res, 'Failed to book project kit');
    }
    return res.json();
  },


  async cancelBooking(id) {
    const res = await fetch(`/api/bookings/${id}/cancel`, {
      method: 'PUT'
    });
    if (!res.ok) throw await responseError(res, 'Failed to cancel booking');
    return res.json();
  },

  async cancelKitBooking(id) {
    const res = await fetch(`/api/kit-bookings/${id}/cancel`, {
      method: 'PUT'
    });
    if (!res.ok) throw await responseError(res, 'Failed to cancel Project Kit reservation');
    return res.json();
  },

  async approveBooking(id) {
    const res = await fetch(`/api/bookings/${id}/approve`, {
      method: 'PUT'
    });
    if (!res.ok) throw await responseError(res, 'Failed to approve booking');
    return res.json();
  },

  async rejectBooking(id) {
    const res = await fetch(`/api/bookings/${id}/reject`, {
      method: 'PUT'
    });
    if (!res.ok) throw await responseError(res, 'Failed to reject booking');
    return res.json();
  },

  async approveKitBooking(id) {
    const res = await fetch(`/api/kit-bookings/${id}/approve`, {
      method: 'PUT'
    });
    if (!res.ok) throw await responseError(res, 'Failed to approve Project Kit reservation');
    return res.json();
  },

  async rejectKitBooking(id) {
    const res = await fetch(`/api/kit-bookings/${id}/reject`, {
      method: 'PUT'
    });
    if (!res.ok) throw await responseError(res, 'Failed to reject Project Kit reservation');
    return res.json();
  },

  async downloadReceipt(id) {
    const res = await fetch(`/api/bookings/${id}/receipt`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || 'Failed to download booking receipt');
    }
    return {
      blob: await res.blob(),
      filename: getDownloadFilename(res.headers.get('Content-Disposition')) || `booking-${id}-receipt.pdf`
    };
  },

  async downloadKitReceipt(id) {
    const res = await fetch(`/api/kit-bookings/${id}/receipt`);
    if (!res.ok) throw await responseError(res, 'Failed to download Project Kit receipt');
    return {
      blob: await res.blob(),
      filename: getDownloadFilename(res.headers.get('Content-Disposition')) || `kit-${id}-receipt.pdf`
    };
  },

  // Waitlist
  async joinWaitlist(resourceId, startTime, endTime) {
    const res = await fetch('/api/waitlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resourceId, startTime, endTime })
    });
    if (!res.ok) throw await responseError(res, 'Failed to join waitlist');
    return res.json();
  },

  async getMyWaitlist() {
    const res = await fetch('/api/waitlists/mine');
    if (!res.ok) throw await responseError(res, 'Failed to fetch waitlist activity');
    return res.json();
  },

  async getAdminWaitlistOverview() {
    const res = await fetch('/api/waitlists/admin/overview');
    if (!res.ok) throw await responseError(res, 'Failed to fetch Admin waitlist overview');
    return res.json();
  },

  async acceptWaitlistOffer(id) {
    const res = await fetch(`/api/waitlists/${id}/accept`, { method: 'PUT' });
    if (!res.ok) throw await responseError(res, 'Failed to accept slot offer');
    return res.json();
  },

  async declineWaitlistOffer(id) {
    const res = await fetch(`/api/waitlists/${id}/decline`, { method: 'PUT' });
    if (!res.ok) throw await responseError(res, 'Failed to decline slot offer');
    return res.json();
  },

  async leaveWaitlist(id) {
    const res = await fetch(`/api/waitlists/${id}`, { method: 'DELETE' });
    if (!res.ok) throw await responseError(res, 'Failed to leave waitlist');
    return res.json();
  },

  // Resource Issues
  async getIssues() {
    const res = await fetch('/api/issues');
    if (!res.ok) throw new Error('Failed to fetch resource issues');
    return res.json();
  },

  async reportIssue(data) {
    const res = await fetch('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || 'Failed to report resource issue');
    }
    return res.json();
  },

  async approveIssue(id) {
    const res = await fetch(`/api/issues/${id}/approve`, { method: 'PUT' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || 'Failed to approve resource issue');
    }
    return res.json();
  },

  async rejectIssue(id) {
    const res = await fetch(`/api/issues/${id}/reject`, { method: 'PUT' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || 'Failed to reject resource issue');
    }
    return res.json();
  },

  async resolveIssue(id) {
    const res = await fetch(`/api/issues/${id}/resolve`, { method: 'PUT' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || 'Failed to resolve resource issue');
    }
    return res.json();
  }
};

function getDownloadFilename(contentDisposition) {
  if (!contentDisposition) return null;
  const match = contentDisposition.match(/filename="?([^";]+)"?/i);
  return match ? match[1] : null;
}

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
// Modal & Confirmation Dialog Utility
// ============================================================================
const modalState = {
  active: null,
  close: null,
  previousFocus: null
};

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

function getFocusableElements(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR))
    .filter((element) => element.offsetParent !== null || element === document.activeElement);
}

function openManagedModal(backdrop, initialFocus, closeHandler) {
  if (!backdrop) return;
  if (modalState.active && modalState.active !== backdrop) {
    modalState.close?.();
  }

  modalState.active = backdrop;
  modalState.close = closeHandler;
  modalState.previousFocus = document.activeElement instanceof HTMLElement
    ? document.activeElement
    : null;
  backdrop.classList.add('open');
  backdrop.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  elements.app?.setAttribute('inert', '');

  requestAnimationFrame(() => {
    const target = typeof initialFocus === 'function' ? initialFocus() : initialFocus;
    const firstFocusable = getFocusableElements(backdrop)[0];
    (target || firstFocusable || backdrop).focus?.();
  });
}

function closeManagedModal(backdrop, restoreFocus = true) {
  if (!backdrop) return;
  backdrop.classList.remove('open');
  backdrop.setAttribute('aria-hidden', 'true');

  if (modalState.active === backdrop) {
    const previousFocus = modalState.previousFocus;
    modalState.active = null;
    modalState.close = null;
    modalState.previousFocus = null;
    document.body.classList.remove('modal-open');
    elements.app?.removeAttribute('inert');
    if (restoreFocus && previousFocus?.focus) {
      requestAnimationFrame(() => previousFocus.focus());
    }
  }
}

function closeActiveModal() {
  modalState.close?.();
}

function showConfirmDialog({
  title,
  message,
  confirmLabel = 'Continue',
  cancelLabel = 'Cancel',
  tone = 'danger',
  icon = '!'
}) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (confirmed) => {
      if (settled) return;
      settled = true;
      closeManagedModal(elements.confirmModalBackdrop);
      resolve(confirmed);
    };

    elements.confirmModalTitle.textContent = title;
    elements.confirmModalMessage.textContent = message;
    elements.confirmModalIcon.textContent = icon;
    elements.confirmModalCancelBtn.textContent = cancelLabel;
    elements.confirmModalConfirmBtn.textContent = confirmLabel;
    elements.confirmModalConfirmBtn.className = `btn ${tone === 'warning' ? 'btn-warning-action' : tone === 'primary' ? 'btn-primary' : 'btn-danger'}`;
    elements.confirmModalCancelBtn.onclick = () => finish(false);
    elements.confirmModalConfirmBtn.onclick = () => finish(true);

    openManagedModal(
      elements.confirmModalBackdrop,
      elements.confirmModalConfirmBtn,
      () => finish(false)
    );
  });
}

function handleModalKeydown(event) {
  if (!modalState.active) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    closeActiveModal();
    return;
  }
  if (event.key !== 'Tab') return;

  const focusables = getFocusableElements(modalState.active);
  if (focusables.length === 0) {
    event.preventDefault();
    modalState.active.focus();
    return;
  }

  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
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

function isCurrentDashboardBooking(booking) {
  return ['PENDING', 'APPROVED', 'CONFIRMED'].includes(booking.status)
    && new Date(booking.endTime).getTime() > Date.now();
}

function isCurrentDashboardKit(kitBooking) {
  return ['PENDING', 'APPROVED'].includes(kitBooking.status)
    && new Date(kitBooking.endTime).getTime() > Date.now();
}

function getStudentReservationItems(isHistory) {
  const bookings = (isHistory ? state.userBookingHistory : state.userBookings)
    .map((booking) => ({ kind: 'BOOKING', data: booking }));
  const kitBookings = (isHistory ? state.userKitBookingHistory : state.userKitBookings)
    .map((kitBooking) => ({ kind: 'KIT', data: kitBooking }));

  return [...bookings, ...kitBookings].sort((a, b) => {
    const aTime = new Date(a.data.startTime).getTime();
    const bTime = new Date(b.data.startTime).getTime();
    return (isHistory ? bTime - aTime : aTime - bTime)
      || a.kind.localeCompare(b.kind);
  });
}

function getAdminReservationItems() {
  const bookings = state.adminBookings
    .filter(isCurrentDashboardBooking)
    .map((booking) => ({ kind: 'BOOKING', data: booking }));
  const kitBookings = state.adminKitBookings
    .filter(isCurrentDashboardKit)
    .map((kitBooking) => ({ kind: 'KIT', data: kitBooking }));

  return [...bookings, ...kitBookings].sort((a, b) =>
    new Date(a.data.startTime).getTime() - new Date(b.data.startTime).getTime()
  );
}

function isActionableAdminIssue(issue) {
  return issue.status === 'PENDING' || issue.status === 'OPEN';
}

function getBookingDisplayStatus(booking, isHistory = false) {
  return getStatusLabel(booking.status, { history: isHistory });
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
function getDisplayName(username) {
  return String(username || 'Campus user')
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normaliseCurrentUser(identity) {
  return {
    id: identity.userId ?? identity.id,
    username: identity.username,
    name: getDisplayName(identity.username),
    email: identity.email,
    role: identity.role
  };
}

function applyCurrentUser(identity) {
  state.currentUser = normaliseCurrentUser(identity);
  const initial = state.currentUser.name.charAt(0).toUpperCase() || '?';
  elements.currentUserAvatar.textContent = initial;
  elements.mobileUserAvatar.textContent = initial;
  elements.currentUserName.textContent = state.currentUser.name;
  elements.currentUserRole.textContent = getRoleLabel(state.currentUser.role === 'ADMIN' ? 'ADMIN' : 'STUDENT');
  elements.modalUserName.textContent = state.currentUser.name;
  elements.homeUserName.textContent = state.currentUser.name;
  elements.sidebarWorkspaceLabel.textContent = state.currentUser.role === 'ADMIN'
    ? 'Administrator workspace'
    : 'Student workspace';
}

function setAuthNotice(message, type = 'error') {
  elements.authNotice.textContent = message;
  elements.authNotice.className = `auth-notice ${type}`;
  elements.authNotice.hidden = !message;
}

function clearAuthNotice() {
  setAuthNotice('');
}

function setAuthMode(mode, options = {}) {
  const register = mode === 'register';
  elements.loginForm.hidden = register;
  elements.registerForm.hidden = !register;
  elements.signInModeBtn.classList.toggle('active', !register);
  elements.registerModeBtn.classList.toggle('active', register);
  elements.signInModeBtn.setAttribute('aria-selected', register ? 'false' : 'true');
  elements.registerModeBtn.setAttribute('aria-selected', register ? 'true' : 'false');
  elements.authPanelTitle.textContent = register ? 'Create your student account' : 'Sign in to continue';
  elements.authPanelDescription.textContent = register
    ? 'Register once, then use your account to manage campus reservations.'
    : 'Use your campus account to access your booking workspace.';
  if (!options.keepNotice) clearAuthNotice();
}

function setAuthBusy(button, busy, busyLabel) {
  if (!button) return;
  button.disabled = busy;
  const text = button.querySelector('.btn-text');
  const spinner = button.querySelector('.btn-spinner');
  if (text) {
    if (busy) {
      button.dataset.idleLabel = text.textContent;
      text.textContent = busyLabel;
    } else {
      text.textContent = button.dataset.idleLabel || text.textContent;
    }
  }
  if (spinner) spinner.hidden = !busy;
}

function closeMobileNavigation() {
  elements.appSidebar.classList.remove('open');
  elements.sidebarBackdrop.hidden = true;
  elements.mobileMenuBtn.setAttribute('aria-expanded', 'false');
  elements.mobileMenuBtn.setAttribute('aria-label', 'Open navigation');
}

function resetPrivateState() {
  state.currentUser = null;
  state.resources = [];
  state.kits = [];
  state.userBookings = [];
  state.userBookingHistory = [];
  state.userKitBookings = [];
  state.userKitBookingHistory = [];
  state.userWaitlists = [];
  state.adminBookings = [];
  state.adminBookingHistory = [];
  state.adminKitBookings = [];
  state.adminIssues = [];
  state.adminWaitlistOverview = [];
  state.activeTab = 'home';
  state.activeNavKey = 'home';
  state.bookingView = 'UPCOMING';
  state.timeFirstResults = [];
  state.timeFirstSearch = null;
  state.timeFirstSearchError = null;
  state.timeFirstSearching = false;
  state.timeFirstSelection = null;
  state.timeFirstSuccess = null;
  state.timeFirstConflict = false;
  state.timeFirstSubmitting = false;
  state.selectedGroupMembers = [];
  state.resourcesLoaded = false;
  state.kitsLoaded = false;
  state.resourceLoadError = null;
  state.kitLoadError = null;
  state.adminLoadError = null;
  state.adminHistoryLoadError = null;
  state.adminDataLoaded = false;
  state.userDataLoaded = false;
}

function showAuthScreen(message = '', type = 'error') {
  closeActiveModal();
  resetPrivateState();
  closeMobileNavigation();
  elements.app.hidden = true;
  elements.app.setAttribute('aria-hidden', 'true');
  elements.authScreen.hidden = false;
  setAuthMode('signin', { keepNotice: Boolean(message) });
  setAuthNotice(message, type);
  elements.authLoginPassword.value = '';
}

async function showAuthenticatedShell(identity) {
  applyCurrentUser(identity);
  elements.authScreen.hidden = true;
  elements.app.hidden = false;
  elements.app.setAttribute('aria-hidden', 'false');
  updateRoleBasedVisibility();
  const contextualRoute = state.currentUser.role === 'STUDENT'
    ? parseContextualRoute(window.location.hash.slice(1))
    : null;
  const route = contextualRoute
    ? { tabId: 'browse', navKey: 'resources' }
    : getRouteForRole(state.currentUser.role, window.location.hash.slice(1));
  switchTab(route.tabId, {
    navKey: route.navKey,
    history: contextualRoute ? 'none' : 'replace',
    skipLoad: true
  });
  await loadAllData();
  if (contextualRoute) renderContextualRoute(contextualRoute, { focus: false, refreshAvailability: true });
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const username = elements.authLoginUsername.value.trim();
  const password = elements.authLoginPassword.value;
  if (!username || !password) {
    setAuthNotice('Enter your username and password to sign in.', 'error');
    return;
  }

  clearAuthNotice();
  setAuthBusy(elements.loginSubmitBtn, true, 'Signing in…');
  try {
    const identity = await api.login(username, password);
    await showAuthenticatedShell(identity);
  } catch (error) {
    setAuthNotice(error.message || 'We could not sign you in. Check your details and try again.', 'error');
  } finally {
    setAuthBusy(elements.loginSubmitBtn, false);
  }
}

async function handleRegisterSubmit(event) {
  event.preventDefault();
  const username = elements.authRegisterUsername.value.trim();
  const email = elements.authRegisterEmail.value.trim();
  const password = elements.authRegisterPassword.value;
  const confirmation = elements.authRegisterConfirmPassword.value;

  if (!username || !email || !password || !confirmation) {
    setAuthNotice('Complete every field before creating your account.', 'error');
    return;
  }
  if (!elements.authRegisterEmail.validity.valid) {
    setAuthNotice('Enter a valid email address.', 'error');
    elements.authRegisterEmail.focus();
    return;
  }
  if (password.length < 8) {
    setAuthNotice('Your password must be at least 8 characters.', 'error');
    elements.authRegisterPassword.focus();
    return;
  }
  if (password !== confirmation) {
    setAuthNotice('The passwords do not match.', 'error');
    elements.authRegisterConfirmPassword.focus();
    return;
  }

  clearAuthNotice();
  setAuthBusy(elements.registerSubmitBtn, true, 'Creating account…');
  try {
    await api.register({ username, email, password });
    elements.authLoginUsername.value = username;
    elements.authLoginPassword.value = '';
    setAuthMode('signin', { keepNotice: true });
    setAuthNotice('Your Student account is ready. Sign in to continue.', 'success');
    elements.authLoginPassword.focus();
  } catch (error) {
    setAuthNotice(error.message || 'We could not create your account. Check the details and try again.', 'error');
  } finally {
    setAuthBusy(elements.registerSubmitBtn, false);
  }
}

async function handleLogout() {
  elements.logoutBtn.disabled = true;
  try {
    await api.logout();
    showAuthScreen('You have been signed out.', 'success');
    window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}`);
    elements.authLoginUsername.focus();
  } catch (error) {
    showToast('Sign out failed', error.message || 'Please try again.', 'error');
  } finally {
    elements.logoutBtn.disabled = false;
  }
}

function updateRoleBasedVisibility() {
  if (!state.currentUser) return;
  const isAdmin = state.currentUser.role === 'ADMIN';

  elements.studentNavGroup.hidden = isAdmin;
  elements.adminNavGroup.hidden = !isAdmin;
  if (elements.studentSnapshot) {
    elements.studentSnapshot.hidden = isAdmin;
  }

  // If a student is currently looking at the admin tab, switch back to Home.
  if (!isAdmin && state.activeTab === 'admin') {
    switchTab('home', { history: 'replace' });
  }
}

function getRouteForRole(role, routeKey) {
  if (role === 'ADMIN') {
    return ADMIN_ROUTES[routeKey]
      ? { tabId: 'admin', navKey: routeKey }
      : { tabId: 'admin', navKey: 'admin-overview' };
  }
  return STUDENT_ROUTES[routeKey]
    ? { ...STUDENT_ROUTES[routeKey], navKey: routeKey }
    : { ...STUDENT_ROUTES.home, navKey: 'home' };
}

function parseContextualRoute(routeKey) {
  const match = /^(resource-detail|weekly-availability)\/(resource|kit)\/(\d+)$/.exec(routeKey || '');
  if (!match) return null;
  return {
    page: match[1] === 'resource-detail' ? 'detail' : 'availability',
    entityType: match[2],
    id: Number(match[3])
  };
}

function contextualRouteKey(route) {
  const page = route.page === 'detail' ? 'resource-detail' : 'weekly-availability';
  return `${page}/${route.entityType}/${route.id}`;
}

function setBrowseContextView(view) {
  elements.resourcesCatalogueView.hidden = view !== 'catalogue';
  elements.resourceDetailPage.hidden = view !== 'detail';
  elements.weeklyAvailabilityPage.hidden = view !== 'availability';
  state.contextRoute = view === 'catalogue' ? null : state.contextRoute;
}

function navigateToContextRoute(route, options = {}) {
  if (!state.currentUser || state.currentUser.role !== 'STUDENT') return;
  const historyMode = options.history || 'push';
  if (historyMode !== 'none') {
    const method = historyMode === 'replace' ? 'replaceState' : 'pushState';
    const routeKey = contextualRouteKey(route);
    window.history[method]({
      appView: 'resources',
      contextualRoute: route,
      previousContextRoute: state.contextRoute
    }, '',
      `${window.location.pathname}${window.location.search}#${routeKey}`);
  }
  switchTab('browse', { navKey: 'resources', history: 'none', skipLoad: true });
  renderContextualRoute(route, {
    focus: options.focus !== false,
    forceReset: Boolean(options.forceReset),
    refreshAvailability: options.refreshAvailability
  });
}

function switchTab(tabId, options = {}) {
  if (!state.currentUser) return;
  const isAdmin = state.currentUser.role === 'ADMIN';
  const defaultStudentRoutes = {
    home: 'home',
    'find-availability': 'find-availability',
    browse: 'resources',
    'my-bookings': 'bookings',
    waitlist: 'waitlist'
  };
  let navKey = options.navKey;

  if (isAdmin) {
    navKey = ADMIN_ROUTES[navKey] ? navKey : 'admin-overview';
    tabId = 'admin';
  } else {
    if (tabId === 'admin' || String(navKey || '').startsWith('admin-')) {
      showToast('Access denied', 'Only administrator accounts can open this workspace.', 'warning');
      return;
    }
    navKey = STUDENT_ROUTES[navKey] ? navKey : (defaultStudentRoutes[tabId] || 'home');
    tabId = STUDENT_ROUTES[navKey].tabId;
  }

  const routeTitle = isAdmin ? ADMIN_ROUTES[navKey].title : STUDENT_ROUTES[navKey].title;
  state.activeTab = tabId;
  state.activeNavKey = navKey;
  elements.mobileWorkspaceTitle.textContent = routeTitle;
  if (options.bookingView) state.bookingView = options.bookingView;

  if (options.history !== 'none') {
    const method = options.history === 'replace' ? 'replaceState' : 'pushState';
    if (window.location.hash.slice(1) !== navKey || options.history === 'replace') {
      window.history[method]({ appView: navKey }, '', `${window.location.pathname}${window.location.search}#${navKey}`);
    }
  }

  let activeNavButton = null;
  document.querySelectorAll('.nav-tab').forEach((tab) => {
    const isActive = tab.dataset.navKey === navKey;
    tab.classList.toggle('active', isActive);
    if (isActive) {
      tab.setAttribute('aria-current', 'page');
      activeNavButton = tab;
    } else {
      tab.removeAttribute('aria-current');
    }
  });

  const panels = [elements.tabHome, elements.tabFindAvailability, elements.tabBrowse,
    elements.tabMyBookings, elements.tabWaitlist, elements.tabAdmin];
  panels.forEach((panel) => {
    const active = panel.id === `tab-${tabId}`;
    panel.classList.toggle('active', active);
    panel.setAttribute('aria-hidden', active ? 'false' : 'true');
  });

  if (tabId === 'browse' && options.history !== 'none') setBrowseContextView('catalogue');

  if (isAdmin) {
    const route = ADMIN_ROUTES[navKey];
    document.querySelectorAll('[data-admin-view]').forEach((view) => {
      view.hidden = view.dataset.adminView !== route.view;
    });
    elements.adminPageTitle.textContent = route.title;
    elements.adminPageDescription.textContent = route.description;
    elements.adminAddResourceAction.hidden = navKey !== 'admin-resources';
    if (activeNavButton) elements.tabAdmin.setAttribute('aria-labelledby', activeNavButton.id);
  } else {
    elements.tabAdmin.setAttribute('aria-labelledby', 'tabAdminBtn');
  }

  if (!options.skipLoad && tabId === 'browse') renderResources();
  if (!options.skipLoad && tabId === 'my-bookings') loadUserData();
  if (!options.skipLoad && tabId === 'waitlist') loadMyWaitlists();
  if (!options.skipLoad && tabId === 'admin') loadAdminData();
  if (tabId === 'browse' && options.focus === 'resources') {
    window.setTimeout(() => elements.resourceSearchInput?.focus(), 0);
  }
  closeMobileNavigation();
}

function restoreNavigationFromHistory() {
  if (!state.currentUser) return;
  const routeKey = window.location.hash.slice(1);
  const contextualRoute = state.currentUser.role === 'STUDENT'
    ? parseContextualRoute(routeKey)
    : null;
  if (contextualRoute) {
    switchTab('browse', { navKey: 'resources', history: 'none', skipLoad: true });
    renderContextualRoute(contextualRoute, { focus: false, refreshAvailability: true });
    return;
  }
  const route = getRouteForRole(state.currentUser.role, routeKey);
  const validRoute = state.currentUser.role === 'ADMIN'
    ? Boolean(ADMIN_ROUTES[routeKey])
    : Boolean(STUDENT_ROUTES[routeKey]);
  if (state.currentUser.role === 'STUDENT' && route.navKey === 'resources') {
    state.contextRoute = null;
    setBrowseContextView('catalogue');
  }
  switchTab(route.tabId, { navKey: route.navKey, history: validRoute ? 'none' : 'replace' });
}

async function restoreSession() {
  try {
    const identity = await api.getCurrentUser();
    await showAuthenticatedShell(identity);
  } catch (error) {
    // A 401 here is the normal first-visit path; do not expose API details.
    showAuthScreen();
  }
}

// ============================================================================
// Data Loading & Syncing
// ============================================================================
async function loadAllData() {
  const loaders = [
    loadResources(),
    loadKits(),
    loadUserData()
  ];
  if (state.currentUser.role === 'ADMIN') {
    loaders.push(loadAdminData());
  }
  await Promise.all(loaders);
}

function initialiseTimeFirstSearchForm() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  elements.timeFirstDate.min = getLocalIsoString(today).slice(0, 10);
  elements.timeFirstDate.value = getLocalIsoString(tomorrow).slice(0, 10);
  elements.timeFirstStart.value = '09:00';
  updateTimeFirstCapacityVisibility();
}

function updateTimeFirstCapacityVisibility() {
  const category = elements.timeFirstCategory.value;
  elements.timeFirstCapacityGroup.hidden = category === 'EQUIPMENT' || category === 'KIT';
  if (elements.timeFirstCapacityGroup.hidden) elements.timeFirstCapacity.value = '';
}

function invalidateTimeFirstResultsOnCriteriaChange(event) {
  if (state.timeFirstSelection || state.timeFirstSuccess || !state.timeFirstSearch) return;
  if (!['timeFirstDate', 'timeFirstStart', 'timeFirstDuration', 'timeFirstCategory',
    'timeFirstCapacity', 'timeFirstKeyword'].includes(event.target.id)) return;
  state.timeFirstSearch = null;
  state.timeFirstResults = [];
  state.timeFirstSearchError = null;
  renderTimeFirstWorkflow();
}

function setTimeFirstNotice(message = '') {
  elements.timeFirstSearchNotice.hidden = !message;
  elements.timeFirstSearchNotice.textContent = message;
}

function getTimeFirstCriteria() {
  const date = elements.timeFirstDate.value;
  const time = elements.timeFirstStart.value;
  const durationHours = Number(elements.timeFirstDuration.value);
  if (!date || !time || !Number.isFinite(durationHours) || durationHours <= 0) {
    throw new Error('Choose a date, start time, and positive duration.');
  }

  const start = new Date(`${date}T${time}:00`);
  if (Number.isNaN(start.getTime())) throw new Error('Enter a valid date and start time.');
  if (start <= new Date()) throw new Error('Choose a start time in the future.');
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
  if (!(end > start)) throw new Error('Duration must be greater than zero.');

  return {
    startTime: getLocalIsoString(start),
    endTime: getLocalIsoString(end),
    type: elements.timeFirstCategory.value,
    minCapacity: elements.timeFirstCapacityGroup.hidden ? '' : elements.timeFirstCapacity.value,
    keyword: elements.timeFirstKeyword.value.trim()
  };
}

async function handleTimeFirstSearchSubmit(event) {
  event.preventDefault();
  setTimeFirstNotice('');
  let criteria;
  try {
    criteria = getTimeFirstCriteria();
  } catch (error) {
    setTimeFirstNotice(error.message);
    if (!elements.timeFirstDate.value) elements.timeFirstDate.focus();
    else if (!elements.timeFirstStart.value) elements.timeFirstStart.focus();
    else elements.timeFirstDuration.focus();
    return;
  }

  state.timeFirstSearch = criteria;
  state.timeFirstResults = [];
  state.timeFirstSearchError = null;
  state.timeFirstSelection = null;
  state.timeFirstSuccess = null;
  state.timeFirstConflict = false;
  state.timeFirstSearching = true;
  renderTimeFirstWorkflow();
  elements.timeFirstSearchBtn.disabled = true;
  elements.timeFirstSearchBtn.textContent = 'Searching…';
  try {
    const response = await api.searchAvailability(
      criteria.startTime, criteria.endTime, criteria.type, criteria.minCapacity, criteria.keyword
    );
    state.timeFirstResults = response.results || [];
  } catch (error) {
    state.timeFirstSearchError = error.message || 'Availability search failed. Please try again.';
  } finally {
    state.timeFirstSearching = false;
    elements.timeFirstSearchBtn.disabled = false;
    elements.timeFirstSearchBtn.textContent = 'Search availability';
    renderTimeFirstWorkflow();
  }
}

function formatTimeFirstInterval(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return `${startTime} – ${endTime}`;
  const date = start.toLocaleDateString('en-NZ', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });
  const startLabel = start.toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit' });
  const endLabel = end.toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit' });
  const endDate = start.toDateString() === end.toDateString()
    ? ''
    : ` ${end.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}`;
  return `${date} · ${startLabel}–${endDate ? `${endLabel}${endDate}` : endLabel}`;
}

function renderTimeFirstWorkflow() {
  const hasSelection = Boolean(state.timeFirstSelection);
  const hasSuccess = Boolean(state.timeFirstSuccess);
  document.getElementById('timeFirstWhenSection').hidden = hasSelection || hasSuccess;
  elements.timeFirstResultsSection.hidden = !state.timeFirstSearch || hasSelection || hasSuccess;
  elements.timeFirstReviewSection.hidden = !hasSelection || hasSuccess;
  elements.timeFirstSuccessSection.hidden = !hasSuccess;

  if (!state.timeFirstSearch) return;
  if (hasSuccess) {
    renderTimeFirstSuccess();
  } else if (hasSelection) {
    renderTimeFirstReview();
  } else {
    renderTimeFirstResults();
  }
}

function renderTimeFirstResults() {
  const search = state.timeFirstSearch;
  elements.timeFirstInterval.textContent = formatTimeFirstInterval(search.startTime, search.endTime);
  elements.timeFirstRefreshBtn.disabled = Boolean(state.timeFirstSearching);
  const grid = elements.timeFirstResultsGrid;
  grid.innerHTML = '';

  if (state.timeFirstSearching) {
    grid.innerHTML = '<div class="empty-state" role="status"><div class="spinner spinner-sm"></div><p>Checking resources for this interval…</p></div>';
    return;
  }

  if (state.timeFirstSearchError) {
    grid.innerHTML = `
      <div class="availability-empty-state" role="alert">
        <h3>Availability could not be loaded</h3>
        <p>${escapeHtml(state.timeFirstSearchError)}</p>
        <div class="availability-empty-actions"><button type="button" class="btn btn-secondary" data-time-first-action="retry">Try again</button></div>
      </div>`;
    grid.querySelector('[data-time-first-action="retry"]')?.addEventListener('click', () => elements.timeFirstSearchForm.requestSubmit());
    return;
  }

  if (state.timeFirstResults.length === 0) {
    grid.innerHTML = `
      <div class="availability-empty-state">
        <h3>No resources are available for this time.</h3>
        <p>Try another interval or broaden your search to find a suitable option.</p>
        <div class="availability-empty-actions">
          <button type="button" class="btn btn-secondary" data-time-first-action="date">Change date or time</button>
          <button type="button" class="btn btn-secondary" data-time-first-action="capacity">Reduce capacity</button>
          <button type="button" class="btn btn-secondary" data-time-first-action="category">Choose another category</button>
          <button type="button" class="btn btn-ghost" data-time-first-action="resources">Browse Resources</button>
        </div>
      </div>`;
    grid.querySelector('[data-time-first-action="date"]')?.addEventListener('click', () => elements.timeFirstDate.focus());
    grid.querySelector('[data-time-first-action="capacity"]')?.addEventListener('click', () => {
      elements.timeFirstCapacity.value = '';
      elements.timeFirstCapacity.focus();
      elements.timeFirstSearchForm.requestSubmit();
    });
    grid.querySelector('[data-time-first-action="category"]')?.addEventListener('click', () => elements.timeFirstCategory.focus());
    grid.querySelector('[data-time-first-action="resources"]')?.addEventListener('click', () =>
      switchTab('browse', { navKey: 'resources', focus: 'resources' })
    );
    return;
  }

  state.timeFirstResults.forEach((result) => grid.appendChild(createAvailabilityResultCard(result)));
}

function createAvailabilityResultCard(result) {
  const isKit = result.targetType === 'KIT';
  const isRoomOrLab = result.type === 'ROOM' || result.type === 'LAB';
  const card = document.createElement('article');
  card.className = 'availability-result-card';
  const image = isKit
    ? catalogueImageMarkup(KIT_IMAGE_BY_NAME[result.name], result.name, 'KIT')
    : isRoomOrLab
      ? catalogueImageMarkup(RESOURCE_IMAGE_BY_NAME[result.name], result.name, result.type)
      : '';
  const metadata = [
    result.location
      ? `<div class="catalogue-meta-item"><span>${isRoomOrLab ? 'Location' : 'Pickup'}</span><strong>${escapeHtml(result.location)}</strong></div>`
      : '',
    result.capacity != null
      ? `<div class="catalogue-meta-item"><span>Capacity</span><strong>${escapeHtml(result.capacity)} people</strong></div>`
      : ''
  ].filter(Boolean).join('');
  const count = Number(result.includedResourceCount || 0);
  card.innerHTML = `
    ${image}
    <div class="availability-result-card-content">
      ${!isRoomOrLab && !isKit ? `<div class="catalogue-equipment-icon" aria-hidden="true">${equipmentIconSvg(result.name)}</div>` : ''}
      <span class="availability-result-status">Available for this time</span>
      <h3>${escapeHtml(result.name)}</h3>
      ${metadata ? `<div class="catalogue-resource-meta">${metadata}</div>` : ''}
      <p>${escapeHtml(result.description || (isKit ? 'Pre-configured Project Kit for student work.' : 'No detailed specifications provided.'))}</p>
      ${isKit ? `<p class="catalogue-kit-count">${count} included ${count === 1 ? 'resource' : 'resources'} · ${escapeHtml(result.readiness || 'READY')}</p>` : ''}
    </div>
    <div class="availability-result-actions"><button class="btn btn-primary btn-sm" type="button">Select</button></div>`;
  card.querySelector('button').addEventListener('click', () => selectTimeFirstResult(result));
  bindCatalogueImageFallbacks(card);
  return card;
}

function selectTimeFirstResult(result) {
  state.timeFirstSelection = {
    result,
    startTime: state.timeFirstSearch.startTime,
    endTime: state.timeFirstSearch.endTime
  };
  state.timeFirstConflict = false;
  state.selectedGroupMembers = [];
  renderTimeFirstGroupMembers();
  renderTimeFirstWorkflow();
  elements.timeFirstReviewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderTimeFirstReview() {
  const { result, startTime, endTime } = state.timeFirstSelection;
  const isKit = result.targetType === 'KIT';
  const date = new Date(startTime).toLocaleDateString('en-NZ', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  const start = new Date(startTime).toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit' });
  const end = new Date(endTime).toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit' });
  const details = [
    ['Resource', `${isKit ? 'Project Kit · ' : ''}${result.name}`],
    ['Date', date],
    ['Start time', start],
    ['End time', end],
    ['Duration', formatDuration(startTime, endTime)],
    result.location ? [isKit ? 'Included-resource information' : (isRoomOrLabType(result.type) ? 'Location' : 'Pickup location'), result.location] : null,
    result.capacity != null && !isKit ? ['Capacity', `${result.capacity} people`] : null,
    isKit ? ['Included resources', String(result.includedResourceCount || 0)] : null
  ].filter(Boolean);
  elements.timeFirstReviewDetails.innerHTML = details.map(([label, value]) => `
    <div class="time-first-review-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>
  `).join('');
  elements.timeFirstConflictNotice.hidden = !state.timeFirstConflict;
  elements.timeFirstSubmitBtn.disabled = Boolean(state.timeFirstSubmitting);
  elements.timeFirstSubmitBtn.textContent = state.timeFirstSubmitting ? 'Sending request…' : 'Send booking request';
  renderTimeFirstGroupMembers();
}

function isRoomOrLabType(type) {
  return type === 'ROOM' || type === 'LAB';
}

function addTimeFirstGroupMember() {
  const raw = elements.timeFirstGroupMemberInput.value.trim();
  if (!raw) return;
  const isId = /^\d+$/.test(raw);
  const member = isId
    ? { id: Number(raw), display: `Peer ID: ${raw}` }
    : { username: raw, display: `@${raw}` };
  if ((isId && member.id === Number(state.currentUser.id))
      || (!isId && raw.toLowerCase() === String(state.currentUser.username).toLowerCase())) {
    showToast('Notice', 'You are automatically included as the reservation owner.', 'info', 2500);
    elements.timeFirstGroupMemberInput.value = '';
    return;
  }
  const duplicate = state.selectedGroupMembers.some((existing) => isId
    ? existing.id === member.id
    : existing.username && existing.username.toLowerCase() === member.username.toLowerCase());
  if (duplicate) {
    showToast('Notice', 'This member is already added to the group list.', 'warning', 2000);
    elements.timeFirstGroupMemberInput.value = '';
    return;
  }
  state.selectedGroupMembers.push(member);
  elements.timeFirstGroupMemberInput.value = '';
  renderTimeFirstGroupMembers();
}

function renderTimeFirstGroupMembers() {
  const container = elements.timeFirstGroupMembersTags;
  if (!container) return;
  container.innerHTML = '';
  if (state.selectedGroupMembers.length === 0) {
    container.innerHTML = '<span class="time-first-optional">No group members added.</span>';
    return;
  }
  state.selectedGroupMembers.forEach((member, index) => {
    const tag = document.createElement('span');
    tag.className = 'time-first-member-tag';
    tag.innerHTML = `<span>${escapeHtml(member.display)}</span><button type="button" aria-label="Remove ${escapeHtml(member.display)}">×</button>`;
    tag.querySelector('button').addEventListener('click', () => {
      state.selectedGroupMembers.splice(index, 1);
      renderTimeFirstGroupMembers();
    });
    container.appendChild(tag);
  });
}

async function submitTimeFirstBooking() {
  const selection = state.timeFirstSelection;
  if (!selection || state.timeFirstSubmitting) return;
  const { result, startTime, endTime } = selection;
  const isKit = result.targetType === 'KIT';
  const memberUserIds = state.selectedGroupMembers.filter((member) => member.id !== undefined).map((member) => member.id);
  const memberUsernames = state.selectedGroupMembers.filter((member) => member.username !== undefined).map((member) => member.username);
  const payload = {
    userId: state.currentUser.id,
    startTime,
    endTime,
    memberUserIds: memberUserIds.length ? memberUserIds : undefined,
    memberUsernames: memberUsernames.length ? memberUsernames : undefined
  };

  state.timeFirstSubmitting = true;
  renderTimeFirstReview();
  try {
    const created = isKit
      ? await api.bookKit(result.id, payload)
      : await api.createBooking({ ...payload, resourceId: result.id });
    state.timeFirstSuccess = {
      isKit,
      name: isKit ? (created.kitName || result.name) : result.name,
      startTime,
      endTime
    };
    state.timeFirstSelection = null;
    state.timeFirstConflict = false;
    state.selectedGroupMembers = [];
    renderTimeFirstWorkflow();
    await loadUserData();
  } catch (error) {
    if (error.status === 409) {
      state.timeFirstConflict = true;
      renderTimeFirstWorkflow();
      return;
    }
    showToast('Booking request failed', error.message || 'Please check your details and try again.', 'error', 5000);
  } finally {
    state.timeFirstSubmitting = false;
    if (state.timeFirstSelection) renderTimeFirstReview();
  }
}

function renderTimeFirstSuccess() {
  const success = state.timeFirstSuccess;
  if (!success) return;
  elements.timeFirstSuccessResource.textContent = `${success.isKit ? 'Project Kit · ' : ''}${success.name}`;
  elements.timeFirstSuccessTime.textContent = formatTimeFirstInterval(success.startTime, success.endTime);
}

function resetTimeFirstWorkflow() {
  state.timeFirstSearch = null;
  state.timeFirstResults = [];
  state.timeFirstSearchError = null;
  state.timeFirstSelection = null;
  state.timeFirstSuccess = null;
  state.timeFirstConflict = false;
  state.selectedGroupMembers = [];
  renderTimeFirstWorkflow();
  elements.timeFirstDate.focus();
}

async function loadResources() {
  try {
    const data = await api.getResources();
    state.resources = data;
    state.resourceLoadError = null;
    state.resourcesLoaded = true;
    renderResources();
    if (state.currentUser?.role === 'ADMIN' && state.adminDataLoaded) renderAdminDashboard();
    updateMetrics();
  } catch (err) {
    state.resourceLoadError = err;
    state.resourcesLoaded = true;
    renderResources();
    if (state.currentUser?.role === 'ADMIN' && state.adminDataLoaded) renderAdminDashboard();
    showToast('Resources unavailable', 'We could not load the campus resources.', 'error');
  }
}

async function loadKits() {
  try {
    const data = await api.getKits();
    state.kits = data;
    state.kitLoadError = null;
    state.kitsLoaded = true;
    renderResources();
    if (state.currentUser?.role === 'ADMIN' && state.adminDataLoaded) renderAdminDashboard();
  } catch (err) {
    state.kitLoadError = err;
    state.kitsLoaded = true;
    renderResources();
    if (state.currentUser?.role === 'ADMIN' && state.adminDataLoaded) renderAdminDashboard();
    showToast('Project Kits unavailable', 'Project Kits could not be loaded right now.', 'warning');
  }
}


async function loadUserData() {
  state.userDataLoaded = false;
  if (elements.studentSnapshotGrid && state.currentUser.role !== 'ADMIN') {
    elements.studentSnapshotGrid.innerHTML = '<div class="snapshot-loading"><div class="spinner spinner-sm"></div><span>Loading your overview…</span></div>';
  }
  if (elements.homeUpcomingList && state.currentUser.role !== 'ADMIN') {
    elements.homeUpcomingList.innerHTML = '<div class="snapshot-loading"><div class="spinner spinner-sm"></div><span>Loading upcoming reservations…</span></div>';
    elements.homeWaitlistOffer.hidden = true;
  }
  elements.myBookingsList.innerHTML = '<div class="empty-state"><div class="spinner"></div><p>Loading your reservations...</p></div>';
  elements.myWaitlistList.innerHTML = '<div class="empty-state"><div class="spinner"></div><p>Loading your waitlist activity...</p></div>';
  const waitlistPromise = loadMyWaitlists();

  const [upcomingResult, historyResult, kitUpcomingResult, kitHistoryResult] = await Promise.all([
    api.getUserBookings(state.currentUser.id)
      .then((data) => ({ ok: true, data }))
      .catch((error) => ({ ok: false, error })),
    api.getUserBookingHistory(state.currentUser.id)
      .then((data) => ({ ok: true, data }))
      .catch((error) => ({ ok: false, error })),
    api.getUserKitBookings(state.currentUser.id)
      .then((data) => ({ ok: true, data }))
      .catch((error) => ({ ok: false, error })),
    api.getUserKitBookingHistory(state.currentUser.id)
      .then((data) => ({ ok: true, data }))
      .catch((error) => ({ ok: false, error }))
  ]);

  if (upcomingResult.ok) state.userBookings = upcomingResult.data;
  if (historyResult.ok) state.userBookingHistory = historyResult.data;
  if (kitUpcomingResult.ok) state.userKitBookings = kitUpcomingResult.data;
  if (kitHistoryResult.ok) state.userKitBookingHistory = kitHistoryResult.data;
  const activeBookingResult = state.bookingView === 'HISTORY' ? historyResult : upcomingResult;
  const activeKitResult = state.bookingView === 'HISTORY' ? kitHistoryResult : kitUpcomingResult;
  if (activeBookingResult.ok) {
    renderMyBookings();
  } else {
    const err = activeBookingResult.error;
    renderErrorState(
      elements.myBookingsList,
      'We could not load your reservations.',
      err.message,
      () => loadUserData()
    );
  }

  if (!activeKitResult.ok) {
    console.error('Error loading Project Kit reservations:', activeKitResult.error);
    showToast('Project Kit Notice', activeKitResult.error.message || 'Project Kit reservations could not be loaded.', 'warning');
  }

  await waitlistPromise;
  state.userDataLoaded = true;
  renderStudentSnapshot();
  renderStudentHomeDashboard();
  updateMetrics();
}

async function loadMyWaitlists() {
  elements.myWaitlistList.innerHTML = '<div class="empty-state"><div class="spinner"></div><p>Loading your waitlist activity...</p></div>';
  try {
    state.userWaitlists = await api.getMyWaitlist();
    renderMyWaitlists();
    updateMetrics();
    return true;
  } catch (err) {
    renderErrorState(
      elements.myWaitlistList,
      'We could not load your waitlist activity.',
      err.message,
      () => loadMyWaitlists(),
      { compact: true }
    );
    return false;
  }
}

async function loadAdminData() {
  const waitlistPromise = loadAdminWaitlistOverview();
  try {
    const [allBookings, allKitBookings, allIssues, historyResult] = await Promise.all([
      api.getAllBookings(),
      api.getAllKitBookings(),
      api.getIssues(),
      api.getAdminBookingHistory()
        .then((data) => ({ ok: true, data }))
        .catch((error) => ({ ok: false, error }))
    ]);
    state.adminBookings = allBookings;
    state.adminKitBookings = allKitBookings;
    state.adminIssues = allIssues;
    state.adminBookingHistory = historyResult.ok ? historyResult.data : [];
    state.adminHistoryLoadError = historyResult.ok ? null : historyResult.error;
    state.adminLoadError = null;
    state.adminDataLoaded = true;
    renderAdminDashboard();
    updateMetrics();
  } catch (err) {
    state.adminLoadError = err;
    state.adminDataLoaded = true;
    renderAdminDashboard();
    showToast('Admin workspace unavailable', 'Some management data could not be loaded.', 'error');
  }
  await waitlistPromise;
}

async function loadAdminWaitlistOverview() {
  if (!elements.adminWaitlistTbody) return;
  elements.adminWaitlistTbody.innerHTML = `
    <tr><td colspan="5" style="text-align: center; padding: 1.5rem;">Loading waitlist updates…</td></tr>`;
  try {
    state.adminWaitlistOverview = await api.getAdminWaitlistOverview();
    renderAdminWaitlistOverview();
  } catch (err) {
    renderTableState(
      elements.adminWaitlistTbody,
      5,
      'Waitlist activity is unavailable.',
      err.message,
      () => loadAdminWaitlistOverview()
    );
  }
}

function updateMetrics() {
  const total = state.resources.length;
  const available = state.resources.filter((r) => r.status === 'AVAILABLE').length;

  elements.metricTotal.textContent = total;
  elements.metricAvailable.textContent = available;

  const myActive = state.userBookings.length + state.userKitBookings.length;
  elements.myBookingsCount.textContent = myActive;

  const pendingItems = state.currentUser?.role === 'ADMIN' && !state.adminLoadError
    ? getAdminReservationItems().filter((item) => item.data.status === 'PENDING')
    : [];
  updateActionBadge(elements.adminPendingCount, pendingItems.length);
  const actionableIssues = state.currentUser?.role === 'ADMIN' && !state.adminLoadError
    ? state.adminIssues.filter(isActionableAdminIssue).length
    : 0;
  updateActionBadge(elements.adminIssuesCount, actionableIssues);
  elements.waitlistNavCount.textContent = state.userWaitlists.filter((item) =>
    ['WAITING', 'OFFERED'].includes(item.status)).length;

  elements.quickStatsFooter.textContent = total
    ? `${total} resources available to browse.`
    : 'Choose a resource to get started.';
}

function updateActionBadge(element, count) {
  if (!element) return;
  element.textContent = String(count);
  element.hidden = count < 1;
}

function renderStudentSnapshot() {
  if (!elements.studentSnapshotGrid || state.currentUser.role === 'ADMIN') return;
  if (!state.userDataLoaded) return;

  const upcoming = getStudentReservationItems(false)
    .filter((item) => new Date(item.data.endTime).getTime() > Date.now());
  const next = upcoming[0];
  const pendingCount = upcoming.filter((item) => item.data.status === 'PENDING').length;
  const offeredCount = state.userWaitlists.filter((item) => item.status === 'OFFERED').length;
  const waitingCount = state.userWaitlists.filter((item) => item.status === 'WAITING').length;
  const waitlistTotal = offeredCount + waitingCount;

  const nextTitle = next
    ? escapeHtml(next.kind === 'KIT' ? (next.data.kitName || 'Project Kit') : next.data.resourceName)
    : 'No upcoming booking';
  const nextMeta = next
    ? `${formatDateTime(next.data.startTime)} · ${escapeHtml(getStatusLabel(next.data.status))}`
    : 'Browse resources to reserve a time.';
  const approvalMeta = pendingCount === 0
    ? 'Nothing is waiting for a decision.'
    : `${pendingCount} ${pendingCount === 1 ? 'reservation is' : 'reservations are'} awaiting review.`;
  const waitlistTitle = offeredCount > 0
    ? `${offeredCount} slot ${offeredCount === 1 ? 'offer' : 'offers'} ready`
    : waitlistTotal > 0
      ? `${waitingCount} ${waitingCount === 1 ? 'request' : 'requests'} waiting`
      : 'No active waitlists';
  const waitlistMeta = offeredCount > 0
    ? 'Review the offer before it expires.'
    : waitlistTotal > 0
      ? 'We will show an exact-slot offer here if it opens.'
      : 'Join an exact-slot waitlist from a busy time.';

  elements.studentSnapshotGrid.innerHTML = `
    <article class="snapshot-card snapshot-card-primary">
      <span class="snapshot-icon" aria-hidden="true">🗓️</span>
      <div>
        <span class="snapshot-label">Next booking</span>
        <strong>${nextTitle}</strong>
        <span>${nextMeta}</span>
      </div>
    </article>
    <article class="snapshot-card">
      <span class="snapshot-icon" aria-hidden="true">⏳</span>
      <div>
        <span class="snapshot-label">Awaiting approval</span>
        <strong>${pendingCount}</strong>
        <span>${approvalMeta}</span>
      </div>
    </article>
    <article class="snapshot-card ${offeredCount > 0 ? 'snapshot-card-offer' : ''}">
      <span class="snapshot-icon" aria-hidden="true">${offeredCount > 0 ? '✨' : '↔️'}</span>
      <div>
        <span class="snapshot-label">Waitlist activity</span>
        <strong>${waitlistTitle}</strong>
        <span>${waitlistMeta}</span>
      </div>
    </article>
  `;
}

function renderStudentHomeDashboard() {
  if (!elements.homeUpcomingList || state.currentUser?.role === 'ADMIN' || !state.userDataLoaded) return;

  const upcoming = getStudentReservationItems(false)
    .filter((item) => item.kind === 'KIT'
      ? isCurrentDashboardKit(item.data)
      : isCurrentDashboardBooking(item.data))
    .slice(0, 4);

  if (upcoming.length === 0) {
    elements.homeUpcomingList.innerHTML = `
      <div class="home-upcoming-empty">
        <strong>No upcoming reservations</strong>
        <span>Your active room, lab, equipment, and Kit reservations will appear here.</span>
      </div>`;
  } else {
    elements.homeUpcomingList.innerHTML = upcoming.map((item) => {
      const booking = item.data;
      const name = item.kind === 'KIT'
        ? (booking.kitName || 'Project Kit')
        : (booking.resourceName || 'Resource reservation');
      const kindLabel = item.kind === 'KIT' ? 'Project Kit' : 'Reservation';
      return `
        <article class="home-reservation-row">
          <div class="home-reservation-copy">
            <strong>${escapeHtml(name)}</strong>
            <span>${escapeHtml(formatTimeFirstInterval(booking.startTime, booking.endTime))}</span>
            <span class="status-pill ${escapeHtml(booking.status)}">${escapeHtml(getBookingDisplayStatus(booking))}</span>
          </div>
          <button class="btn btn-ghost btn-sm home-reservation-view" type="button" aria-label="View ${escapeHtml(kindLabel.toLowerCase())} details">View</button>
        </article>`;
    }).join('');
  }

  const activeOffer = state.userWaitlists
    .filter((item) => item.status === 'OFFERED')
    .filter((item) => !item.offerExpiresAt || new Date(item.offerExpiresAt).getTime() > Date.now())
    .sort((a, b) => new Date(a.offerExpiresAt || 0).getTime() - new Date(b.offerExpiresAt || 0).getTime())[0];
  elements.homeWaitlistOffer.hidden = !activeOffer;
  if (activeOffer) {
    elements.homeWaitlistOfferTitle.textContent = activeOffer.resourceName || 'Waitlist offer';
    elements.homeWaitlistOfferTime.textContent = formatTimeFirstInterval(
      activeOffer.requestedStart,
      activeOffer.requestedEnd
    );
  }
}

function renderErrorState(container, title, message, onRetry, options = {}) {
  if (!container) return;
  const compact = options.compact ? ' compact' : '';
  container.innerHTML = `
    <div class="empty-state error-state${compact}">
      <div class="state-icon" aria-hidden="true">!</div>
      <p class="state-title">${escapeHtml(title)}</p>
      <p>${escapeHtml(message || 'Please try again.')}</p>
      ${onRetry ? '<button type="button" class="btn btn-secondary btn-sm state-retry-btn">Try again</button>' : ''}
    </div>
  `;
  container.querySelector('.state-retry-btn')?.addEventListener('click', onRetry);
}

function renderTableState(tbody, colspan, title, message, onRetry) {
  if (!tbody) return;
  tbody.innerHTML = `
    <tr>
      <td colspan="${colspan}" class="table-state ${onRetry ? 'table-state-error' : ''}">
        <strong>${escapeHtml(title)}</strong>
        ${message ? `<span>${escapeHtml(message)}</span>` : ''}
        ${onRetry ? '<button type="button" class="btn btn-secondary btn-sm state-retry-btn">Try again</button>' : ''}
      </td>
    </tr>
  `;
  tbody.querySelector('.state-retry-btn')?.addEventListener('click', onRetry);
}

// ============================================================================
// Render: Tab 1 (Browse Resources)
// ============================================================================
function renderResources() {
  const grid = elements.resourcesGrid;
  grid.innerHTML = '';

  if (state.resourceLoadError && state.resources.length === 0 && state.kits.length === 0) {
    renderErrorState(
      grid,
      'Resources are temporarily unavailable.',
      'Check your connection and try loading the catalogue again.',
      () => Promise.all([loadResources(), loadKits()])
    );
    return;
  }

  const isKitFilter = state.filterType === 'KIT';
  const showKits = state.filterType === 'ALL' || isKitFilter;
  const query = state.searchQuery.trim().toLowerCase();

  let filteredResources = isKitFilter
    ? []
    : state.resources.filter((resource) =>
        state.filterType === 'ALL' || resource.type === state.filterType
      );
  let filteredKits = showKits ? [...state.kits] : [];

  if (state.filterOnlyAvailable) {
    filteredResources = filteredResources.filter((resource) => resource.status === 'AVAILABLE');
    filteredKits = filteredKits.filter(kitIsReady);
  }

  if (query) {
    filteredResources = filteredResources.filter((resource) =>
      [resource.name, resource.type, resource.description, resource.location, resource.capacity]
        .some((value) => String(value ?? '').toLowerCase().includes(query))
    );
    filteredKits = filteredKits.filter((kit) =>
      [kit.name, kit.description].some((value) => String(value ?? '').toLowerCase().includes(query)) ||
      (kit.items || []).some((item) =>
        [item.name, item.description, item.location, item.capacity]
          .some((value) => String(value ?? '').toLowerCase().includes(query))
      )
    );
  }

  if (state.kitLoadError && isKitFilter && state.kits.length === 0) {
    renderErrorState(
      grid,
      'Project Kits are temporarily unavailable.',
      'Try again to reload the kit catalogue.',
      () => loadKits()
    );
    return;
  }

  const sections = [
    {
      title: 'Project Kits',
      description: 'Ready-made equipment bundles for student projects.',
      items: filteredKits,
      renderCard: renderKitCard,
      className: 'catalogue-kits'
    },
    {
      title: 'Study rooms',
      description: 'Quiet spaces and team rooms for individual and group study.',
      items: filteredResources.filter((resource) => resource.type === 'ROOM'),
      renderCard: renderResourceCard,
      className: 'catalogue-rooms'
    },
    {
      title: 'Computer & specialist labs',
      description: 'Teaching and project spaces with specialist computing or bench equipment.',
      items: filteredResources.filter((resource) => resource.type === 'LAB'),
      renderCard: renderResourceCard,
      className: 'catalogue-labs'
    },
    {
      title: 'Equipment',
      description: 'Borrowable equipment with pickup locations listed on each item.',
      items: filteredResources.filter((resource) => resource.type !== 'ROOM' && resource.type !== 'LAB'),
      renderCard: renderResourceCard,
      className: 'catalogue-equipment'
    }
  ].filter((section) => section.items.length > 0);

  if (sections.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="state-icon" aria-hidden="true">${catalogueIconSvg('ROOM')}</div>
        <p class="state-title">No matching resources found</p>
        <p>Try another search or choose a different category.</p>
      </div>
    `;
    return;
  }

  sections.forEach((sectionData) => {
    const section = document.createElement('section');
    section.className = `catalogue-section ${sectionData.className}`;
    section.innerHTML = `
      <div class="catalogue-section-heading">
        <div>
          <h2>${escapeHtml(sectionData.title)}</h2>
          <p>${escapeHtml(sectionData.description)}</p>
        </div>
        <span class="catalogue-section-count">${sectionData.items.length}</span>
      </div>
      <div class="catalogue-card-grid"></div>
    `;
    const cardGrid = section.querySelector('.catalogue-card-grid');
    sectionData.items.forEach((item) => cardGrid.appendChild(sectionData.renderCard(item)));
    grid.appendChild(section);
  });

  bindCatalogueImageFallbacks(grid);
}

function kitIsReady(kit) {
  return Array.isArray(kit.items) && kit.items.length > 0 &&
    kit.items.every((item) => item.status === 'AVAILABLE');
}

function renderResourceCard(resource) {
  const card = document.createElement('article');
  const isRoomOrLab = resource.type === 'ROOM' || resource.type === 'LAB';
  const typeClass = resource.type === 'ROOM' ? 'room' : resource.type === 'LAB' ? 'lab' : 'equipment';
  const imagePath = isRoomOrLab ? RESOURCE_IMAGE_BY_NAME[resource.name] : null;
  const image = isRoomOrLab
    ? catalogueImageMarkup(imagePath, resource.name, resource.type)
    : '';
  const metadata = [
    resource.location
      ? `<div class="catalogue-meta-item"><span>${typeClass === 'equipment' ? 'Pickup' : 'Location'}</span><strong>${escapeHtml(resource.location)}</strong></div>`
      : '',
    resource.capacity != null
      ? `<div class="catalogue-meta-item"><span>Capacity</span><strong>${escapeHtml(resource.capacity)} people</strong></div>`
      : ''
  ].filter(Boolean).join('');
  const actions = `<button class="btn btn-primary btn-sm view-details-btn" type="button" aria-label="View details for ${escapeHtml(resource.name)}">View details</button>`;
  const reportIssue = state.currentUser.role !== 'ADMIN'
    ? `<button class="btn btn-ghost btn-sm report-issue-btn" type="button" aria-label="Report an issue with ${escapeHtml(resource.name)}"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0ZM12 9v4m0 3h.01"/></svg><span>Report issue</span></button>`
    : '';

  card.className = `resource-card catalogue-resource-card ${typeClass}`;
  card.innerHTML = `
    ${image}
    <div class="catalogue-card-content">
      ${!isRoomOrLab ? `<div class="catalogue-equipment-icon" aria-hidden="true">${equipmentIconSvg(resource.name)}</div>` : ''}
      <div class="catalogue-card-status-row">
        <span class="type-badge ${escapeHtml(resource.type)}">${escapeHtml(getResourceTypeLabel(resource.type))}</span>
        <span class="status-badge ${escapeHtml(resource.status)}"><span class="dot"></span><span>${escapeHtml(getResourceStatusLabel(resource.status))}</span></span>
      </div>
      <h3 class="resource-name">${escapeHtml(resource.name)}</h3>
      ${metadata ? `<div class="catalogue-resource-meta">${metadata}</div>` : ''}
      <p class="catalogue-resource-description">${escapeHtml(resource.description || 'No detailed specifications provided.')}</p>
    </div>
    <div class="resource-card-actions catalogue-card-actions">${actions}${reportIssue}</div>
  `;

  card.querySelector('.view-details-btn').addEventListener('click', () =>
    navigateToContextRoute({ page: 'detail', entityType: 'resource', id: resource.id })
  );
  const issueButton = card.querySelector('.report-issue-btn');
  if (issueButton) issueButton.addEventListener('click', () => openIssueModal(resource));
  return card;
}

function renderKitCard(kit) {
  const card = document.createElement('article');
  const ready = kitIsReady(kit);
  const count = Number(kit.itemCount ?? (kit.items || []).length);
  card.className = 'resource-card catalogue-kit-card';
  card.innerHTML = `
    ${catalogueImageMarkup(KIT_IMAGE_BY_NAME[kit.name], kit.name, 'KIT')}
    <div class="catalogue-card-content">
      <div class="catalogue-card-status-row">
        <span class="type-badge KIT">Project Kit</span>
        <span class="status-badge ${ready ? 'AVAILABLE' : 'UNAVAILABLE'}"><span class="dot"></span><span>${ready ? 'Ready' : 'Not operational'}</span></span>
      </div>
      <h3 class="resource-name">${escapeHtml(kit.name)}</h3>
      <p class="catalogue-resource-description">${escapeHtml(kit.description || 'Pre-configured project equipment bundle.')}</p>
      <p class="catalogue-kit-count">${count} included ${count === 1 ? 'resource' : 'resources'}</p>
    </div>
    <div class="resource-card-actions catalogue-card-actions">
      <button class="btn btn-primary btn-sm view-kit-btn" type="button" aria-label="View ${escapeHtml(kit.name)}">View kit</button>
    </div>
  `;
  card.querySelector('.view-kit-btn').addEventListener('click', () =>
    navigateToContextRoute({ page: 'detail', entityType: 'kit', id: kit.id })
  );
  return card;
}

function renderContextualRoute(route, options = {}) {
  if (!route || state.currentUser?.role !== 'STUDENT') return;
  const collection = route.entityType === 'kit' ? state.kits : state.resources;
  const item = collection.find((candidate) => Number(candidate.id) === Number(route.id));
  if (!item) {
    if (route.page === 'availability') {
      switchTab('browse', { navKey: 'resources', history: 'replace', skipLoad: true });
      showToast('Item unavailable', 'This resource or Project Kit is no longer in the catalogue.', 'warning');
      return;
    }
    state.contextRoute = route;
    setBrowseContextView('detail');
    elements.resourceDetailContent.innerHTML = `
      <div class="empty-state context-not-found" role="status">
        <h1 class="page-title" id="resourceDetailPageHeading" tabindex="-1">Item not found</h1>
        <p>This resource or Project Kit is no longer in the catalogue.</p>
      </div>
    `;
    elements.mobileWorkspaceTitle.textContent = 'Resource details';
    if (options.focus !== false) elements.resourceDetailContent.querySelector('h1')?.focus();
    return;
  }

  state.contextRoute = route;
  if (route.page === 'detail') {
    setBrowseContextView('detail');
    elements.mobileWorkspaceTitle.textContent = route.entityType === 'kit' ? 'Project Kit details' : 'Resource details';
    if (route.entityType === 'kit') renderKitDetailPage(item);
    else renderResourceDetailPage(item);
    if (options.focus !== false) elements.resourceDetailContent.querySelector('h1')?.focus();
    return;
  }

  setBrowseContextView('availability');
  prepareAvailabilityTarget(route, item, options.forceReset);
  if (options.refreshAvailability) loadAvailability();
  if (options.focus !== false) elements.modalBookingTitle.focus();
}

function renderResourceDetailPage(resource) {
  const isRoomOrLab = resource.type === 'ROOM' || resource.type === 'LAB';
  const image = isRoomOrLab
    ? catalogueImageMarkup(RESOURCE_IMAGE_BY_NAME[resource.name], `${resource.name} image`, resource.type)
    : `<div class="resource-detail-equipment-icon" role="img" aria-label="Equipment icon for ${escapeHtml(resource.name)}">${equipmentIconSvg(resource.name)}</div>`;
  const metadata = [
    resource.location
      ? `<div class="resource-detail-meta-item"><dt>${resource.type === 'EQUIPMENT' ? 'Pickup location' : 'Location'}</dt><dd>${escapeHtml(resource.location)}</dd></div>`
      : '',
    resource.capacity != null
      ? `<div class="resource-detail-meta-item"><dt>Capacity</dt><dd>${escapeHtml(resource.capacity)} people</dd></div>`
      : ''
  ].filter(Boolean).join('');

  elements.resourceDetailContent.innerHTML = `
    <article class="resource-detail-content">
      <header class="resource-detail-hero">
        <div class="resource-detail-artwork ${isRoomOrLab ? '' : 'equipment-artwork'}">${image}</div>
        <div class="resource-detail-heading">
          <div class="resource-detail-status-row">
            <span class="type-badge ${escapeHtml(resource.type)}">${escapeHtml(getResourceTypeLabel(resource.type))}</span>
            <span class="status-badge ${escapeHtml(resource.status)}"><span class="dot"></span><span>${escapeHtml(getResourceStatusLabel(resource.status))}</span></span>
          </div>
          <h1 class="page-title" id="resourceDetailPageHeading" tabindex="-1">${escapeHtml(resource.name)}</h1>
          <dl class="resource-detail-metadata">${metadata}</dl>
          <div class="resource-detail-actions">
            <button class="btn btn-primary" type="button" id="resourceDetailAvailabilityBtn">Check availability</button>
            <button class="btn btn-secondary resource-detail-report-btn" type="button" id="resourceDetailReportIssueBtn">Report issue</button>
          </div>
        </div>
      </header>
      <section class="resource-detail-description" aria-labelledby="resourceAboutHeading">
        <h2 id="resourceAboutHeading">About this ${resource.type === 'EQUIPMENT' ? 'equipment' : 'resource'}</h2>
        <p>${escapeHtml(resource.description || 'No detailed description is available for this resource.')}</p>
      </section>
    </article>
  `;

  bindCatalogueImageFallbacks(elements.resourceDetailContent);
  elements.resourceDetailContent.querySelector('#resourceDetailAvailabilityBtn')?.addEventListener('click', () =>
    navigateToContextRoute({ page: 'availability', entityType: 'resource', id: resource.id }, {
      forceReset: true,
      refreshAvailability: true
    })
  );
  elements.resourceDetailContent.querySelector('#resourceDetailReportIssueBtn')?.addEventListener('click', () =>
    openIssueModal(resource)
  );
}

function renderKitDetailPage(kit) {
  const items = Array.isArray(kit.items) ? kit.items : [];
  const ready = kitIsReady(kit);
  const itemCount = Number(kit.itemCount ?? items.length);
  const itemMarkup = items.length
    ? items.map((item) => `
        <li class="kit-detail-resource-item">
          <div>
            <strong>${escapeHtml(item.name)}</strong>
            <span>${escapeHtml(getResourceTypeLabel(item.type))}</span>
          </div>
          <span class="status-badge ${escapeHtml(item.status)}"><span class="dot"></span><span>${escapeHtml(getResourceStatusLabel(item.status))}</span></span>
        </li>
      `).join('')
    : '<li class="kit-detail-empty">No included resources are listed for this Project Kit.</li>';

  elements.resourceDetailContent.innerHTML = `
    <article class="kit-detail-content">
      <header class="resource-detail-hero kit-detail-hero">
        <div class="resource-detail-artwork kit-detail-artwork">${catalogueImageMarkup(KIT_IMAGE_BY_NAME[kit.name], `${kit.name} image`, 'KIT')}</div>
        <div class="resource-detail-heading">
          <div class="resource-detail-status-row">
            <span class="type-badge KIT">Project Kit</span>
            <span class="status-badge ${ready ? 'AVAILABLE' : 'UNAVAILABLE'}"><span class="dot"></span><span>${ready ? 'Ready' : 'Limited readiness'}</span></span>
          </div>
          <h1 class="page-title" id="resourceDetailPageHeading" tabindex="-1">${escapeHtml(kit.name)}</h1>
          <p class="kit-detail-purpose">${escapeHtml(kit.description || 'Pre-configured equipment bundle for a student project.')}</p>
          <div class="kit-detail-count">${itemCount} included ${itemCount === 1 ? 'resource' : 'resources'}</div>
          ${ready ? '' : '<p class="kit-readiness-note" role="status">One or more included resources are not operational. This limits when the complete Kit can be reserved.</p>'}
          <div class="resource-detail-actions">
            <button class="btn btn-primary" type="button" id="kitDetailAvailabilityBtn">Reserve this kit</button>
          </div>
        </div>
      </header>
      <section class="kit-detail-resources" aria-labelledby="kitResourcesHeading">
        <div class="kit-detail-section-heading">
          <div><h2 id="kitResourcesHeading">Included resources</h2><p>Each listed item must be operational for the Kit to be ready.</p></div>
          <span class="kit-detail-count-badge">${itemCount}</span>
        </div>
        <ul class="kit-detail-resource-list">${itemMarkup}</ul>
      </section>
    </article>
  `;

  bindCatalogueImageFallbacks(elements.resourceDetailContent);
  elements.resourceDetailContent.querySelector('#kitDetailAvailabilityBtn')?.addEventListener('click', () =>
    navigateToContextRoute({ page: 'availability', entityType: 'kit', id: kit.id }, {
      forceReset: true,
      refreshAvailability: true
    })
  );
}


// ============================================================================
// Render: Tab 2 (My Bookings & Waitlist)
// ============================================================================
function renderMyBookings() {
  const container = elements.myBookingsList;
  container.innerHTML = '';
  const isHistory = state.bookingView === 'HISTORY';
  const visibleItems = getStudentReservationItems(isHistory);
  const upcomingCount = state.userBookings.length + state.userKitBookings.length;
  const historyCount = state.userBookingHistory.length + state.userKitBookingHistory.length;

  elements.upcomingBookingsCount.textContent = upcomingCount;
  elements.historyBookingsCount.textContent = historyCount;
  elements.bookingsCountBadge.textContent = isHistory
    ? `${historyCount} Historical`
    : `${upcomingCount} Upcoming`;
  elements.bookingViewTitle.textContent = isHistory ? 'Booking History' : 'Upcoming Reservations';
  elements.bookingViewDescription.textContent = isHistory
    ? 'Completed, cancelled, rejected, and expired reservations are kept here for reference.'
    : 'Bookings that still need approval or are confirmed for a future time.';

  if (visibleItems.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p style="font-weight: 600;">${isHistory ? 'You have no booking history yet.' : 'You have no upcoming reservations.'}</p>
        <p style="font-size: 0.85rem; margin-top: 0.25rem;">${isHistory ? 'Closed reservations will appear here.' : 'Browse available resources to make a booking.'}</p>
      </div>
    `;
    return;
  }

  visibleItems.forEach((item) => {
    if (item.kind === 'KIT') {
      container.appendChild(renderKitBookingCard(item.data, isHistory));
    } else {
      container.appendChild(renderStandardBookingCard(item.data, isHistory));
    }
  });
}

function renderKitBookingCard(kitBooking, isHistory) {
  const card = document.createElement('div');
  card.className = 'booking-item-card kit-booking-card';

  const typeIcons = {
    ROOM: '🏢',
    LAB: '💻',
    EQUIPMENT: '📽️'
  };

  const isOwner = Number(kitBooking.ownerId) === Number(state.currentUser.id);
  const isGroup = Boolean(kitBooking.groupBooking)
    || (kitBooking.groupMemberNames && kitBooking.groupMemberNames.length > 0);
  const canCancel = !isHistory
    && isOwner
    && ['PENDING', 'APPROVED'].includes(kitBooking.status)
    && new Date(kitBooking.startTime).getTime() > Date.now();
  const canReceipt = ['APPROVED', 'COMPLETED'].includes(kitBooking.status);
  const displayStatus = getBookingDisplayStatus(kitBooking, isHistory);
  const resources = Array.isArray(kitBooking.includedResources)
    ? kitBooking.includedResources
    : [];
  const resourceCount = Number(kitBooking.resourceCount) || resources.length;
  const memberNames = Array.isArray(kitBooking.groupMemberNames)
    ? kitBooking.groupMemberNames
    : [];

  const memberListHtml = isGroup && memberNames.length > 0
    ? `
        <span>•</span>
        <span><strong>Group members:</strong></span>
        <div class="co-members-list">
          ${memberNames.map((name) => `<span class="co-member-pill">👤 ${escapeHtml(name)}</span>`).join('')}
        </div>
      `
    : '';
  const participationHtml = !isOwner && isGroup
    ? '<span>•</span><span><strong>Your Role:</strong> Invited co-member</span>'
    : '';
  const resourceListHtml = resources.length > 0
    ? resources.map((resource) => `
        <li>
          <span>${typeIcons[resource.type] || '📦'} ${escapeHtml(resource.name)}</span>
          <span class="type-badge ${escapeHtml(resource.type || 'KIT')}">${escapeHtml(getResourceTypeLabel(resource.type || 'RESOURCE'))}</span>
        </li>
      `).join('')
    : '<li><span>Resource details unavailable</span></li>';

  card.innerHTML = `
    <div class="booking-info-group" style="flex: 1;">
      <div class="booking-resource-icon kit-booking-icon">📦</div>
      <div class="booking-main-details" style="flex: 1;">
        <div class="booking-resource-title">
          <span>${escapeHtml(kitBooking.kitName || 'Project Kit')}</span>
          <span class="type-badge KIT">Project Kit</span>
          <span class="group-booking-badge">📦 Kit reservation</span>
        </div>
        <div class="kit-booking-reference">${escapeHtml(kitBooking.bookingReference || 'Kit reference pending')}</div>
        <div class="booking-time-line">
          <span>🗓️ ${formatDateTime(kitBooking.startTime)} &rarr; ${formatDateTime(kitBooking.endTime)}</span>
          <span>•</span>
          <span>⏳ ${formatDuration(kitBooking.startTime, kitBooking.endTime)}</span>
        </div>
        <div class="kit-booking-resources">
          <details>
            <summary>Included resources (${resourceCount})</summary>
            <ul class="kit-booking-resource-list">${resourceListHtml}</ul>
          </details>
        </div>
        <div class="co-members-banner">
          <span><strong>Organizer:</strong> ${isOwner ? 'You (Owner)' : escapeHtml(kitBooking.ownerName || 'Kit owner')}</span>
          ${memberListHtml}
          ${participationHtml}
        </div>
      </div>
    </div>

    <div class="booking-actions-group">
      <span class="status-pill ${escapeHtml(kitBooking.status)}">${escapeHtml(displayStatus)}</span>
      ${canReceipt
        ? `<button class="btn btn-secondary btn-sm kit-receipt-download-btn" type="button">
             <span>📄 Download Kit Receipt</span>
           </button>`
        : ''}
      ${canCancel
        ? `<button class="btn btn-danger btn-sm cancel-kit-btn" type="button">
             <span>Cancel Kit</span>
           </button>`
        : ''}
    </div>
  `;

  card.querySelector('.cancel-kit-btn')?.addEventListener('click', () => handleCancelKitBooking(kitBooking));
  card.querySelector('.kit-receipt-download-btn')?.addEventListener('click', () => handleKitReceiptDownload(kitBooking));
  return card;
}

function renderStandardBookingCard(booking, isHistory) {
  const card = document.createElement('div');
  card.className = 'booking-item-card';

  const typeIcons = {
    ROOM: '🏢',
    LAB: '💻',
    EQUIPMENT: '📽️'
  };

  const canCancel = !isHistory
    && ['PENDING', 'CONFIRMED', 'APPROVED'].includes(booking.status)
    && new Date(booking.startTime).getTime() > Date.now();

  const duration = formatDuration(booking.startTime, booking.endTime);
  const isOwner = booking.userId === state.currentUser.id;
  const isGroup = booking.groupBooking || (booking.groupMemberNames && booking.groupMemberNames.length > 0);
  const displayStatus = getBookingDisplayStatus(booking, isHistory);

  let groupBadgeHtml = '';
  let coMembersHtml = '';

  if (isGroup) {
    groupBadgeHtml = `
      <span class="group-booking-badge" title="Collaborative Group Booking">
        <span>👥 Group Booking</span>
      </span>
    `;
  }

  const memberListHtml = isGroup && booking.groupMemberNames && booking.groupMemberNames.length > 0
    ? `
        <span>•</span>
        <span><strong>Co-Members:</strong></span>
        <div class="co-members-list">
          ${booking.groupMemberNames.map((name) => `<span class="co-member-pill">👤 ${escapeHtml(name)}</span>`).join('')}
        </div>
      `
    : '';
  const participationHtml = !isOwner && isGroup
    ? '<span>•</span><span><strong>Your Role:</strong> Invited co-member</span>'
    : '';
  coMembersHtml = `
    <div class="co-members-banner">
      <span><strong>Organizer:</strong> ${isOwner ? 'You (Owner)' : escapeHtml(booking.username)}</span>
      ${memberListHtml}
      ${participationHtml}
    </div>
  `;

  card.innerHTML = `
      <div class="booking-info-group" style="flex: 1;">
        <div class="booking-resource-icon">
          ${typeIcons[booking.resourceType] || '📦'}
        </div>
        <div class="booking-main-details" style="flex: 1;">
          <div class="booking-resource-title" style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <span>${escapeHtml(booking.resourceName)}</span>
           <span class="type-badge ${booking.resourceType}">${escapeHtml(getResourceTypeLabel(booking.resourceType))}</span>
            ${groupBadgeHtml}
          </div>
          <div class="booking-time-line">
            <span>🗓️ ${formatDateTime(booking.startTime)} &rarr; ${formatDateTime(booking.endTime)}</span>
            <span>•</span>
            <span>⏳ ${duration}</span>
          </div>
          ${coMembersHtml}
        </div>
      </div>

      <div class="booking-actions-group">
        <span class="status-pill ${booking.status}">${escapeHtml(displayStatus)}</span>
        ${
          !isHistory && (booking.status === 'APPROVED' || booking.status === 'CONFIRMED')
            ? `<button class="btn btn-secondary btn-sm receipt-download-btn" data-id="${booking.bookingId}">
                 <span>📄 Download Receipt</span>
               </button>`
            : ''
        }
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

    const receiptBtn = card.querySelector('.receipt-download-btn');
    if (receiptBtn) {
      receiptBtn.addEventListener('click', () => handleReceiptDownload(booking.bookingId));
    }
  return card;
}

function renderMyWaitlists() {
  const container = elements.myWaitlistList;
  container.innerHTML = '';

  elements.waitlistCountBadge.textContent = `${state.userWaitlists.length} active`;

  if (state.userWaitlists.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 1.5rem 1rem;">
        <div class="state-icon" aria-hidden="true">↔️</div>
        <p class="state-title">No active waitlists</p>
        <p>Join an exact time from a resource schedule when a slot is busy.</p>
      </div>
    `;
    return;
  }

  state.userWaitlists.forEach((item) => {
    const card = document.createElement('div');
    const offered = item.status === 'OFFERED';
    card.className = `waitlist-card${offered ? ' offer-card' : ''}`;
    const queueDetail = offered
      ? `Respond by ${formatDateTime(item.offerExpiresAt)}`
      : `Queue position #${item.queuePosition}`;
    const actions = offered
      ? `<div class="waitlist-actions">
           <button type="button" class="btn btn-primary btn-sm accept-slot-btn">Accept Slot</button>
           <button type="button" class="btn btn-secondary btn-sm decline-slot-btn">Decline</button>
         </div>`
      : `<button type="button" class="btn btn-ghost btn-sm leave-waitlist-btn">Leave waitlist</button>`;

    card.innerHTML = `
      <div class="waitlist-card-copy">
        <span class="status-pill ${escapeHtml(item.status)}">${escapeHtml(getStatusLabel(item.status))}</span>
        <span class="waitlist-resource-name">${escapeHtml(item.resourceName)}</span>
        <span>${formatDateTime(item.requestedStart)} → ${formatDateTime(item.requestedEnd)}</span>
        <span>${escapeHtml(queueDetail)}</span>
      </div>
      ${actions}
    `;

    card.querySelector('.accept-slot-btn')?.addEventListener('click', () => handleAcceptSlot(item));
    card.querySelector('.decline-slot-btn')?.addEventListener('click', () => handleDeclineSlot(item));
    card.querySelector('.leave-waitlist-btn')?.addEventListener('click', () => handleLeaveWaitlist(item));

    container.appendChild(card);
  });
}

async function handleAcceptSlot(item) {
  try {
    await api.acceptWaitlistOffer(item.id);
    showToast('Slot accepted', 'Your booking request is now awaiting approval.', 'success');
    await loadAllData();
  } catch (err) {
    showToast('Unable to accept', err.message, err.status === 409 ? 'warning' : 'error');
    await loadUserData();
  }
}

async function handleDeclineSlot(item) {
  const confirmed = await showConfirmDialog({
    title: 'Decline this slot offer?',
    message: `This ${formatDateTime(item.requestedStart)} time will be released to the next eligible student.`,
    confirmLabel: 'Decline offer',
    cancelLabel: 'Keep offer',
    tone: 'danger'
  });
  if (!confirmed) return;

  try {
    await api.declineWaitlistOffer(item.id);
    showToast('Offer declined', 'The slot was released to the next eligible student.', 'info');
    await loadAllData();
  } catch (err) {
    showToast('Unable to decline', err.message, err.status === 409 ? 'warning' : 'error');
    await loadUserData();
  }
}

async function handleLeaveWaitlist(item) {
  const confirmed = await showConfirmDialog({
    title: 'Leave the waitlist?',
    message: `You will stop waiting for ${item.resourceName} at the selected time.`,
    confirmLabel: 'Leave waitlist',
    cancelLabel: 'Stay on waitlist',
    tone: 'danger'
  });
  if (!confirmed) return;

  try {
    await api.leaveWaitlist(item.id);
    showToast('Waitlist left', 'Your request no longer counts in this queue.', 'info');
    await loadAllData();
  } catch (err) {
    showToast('Unable to leave', err.message, err.status === 409 ? 'warning' : 'error');
  }
}

// ============================================================================
// Render: Tab 3 (Admin Panel)
// ============================================================================
function renderAdminDashboard() {
  if (state.adminLoadError) {
    const retry = () => loadAdminData();
    renderTableState(elements.adminBookingsTbody, 6, 'Booking data is unavailable.', 'Try again to refresh the approval queue.', retry);
    renderTableState(elements.adminReservationsTbody, 5, 'Reservation data is unavailable.', 'Try again to refresh current reservations.', retry);
    renderTableState(elements.adminResourcesTbody, 6, 'Resource data is unavailable.', 'Try again to refresh the inventory.', retry);
    renderTableState(elements.adminIssuesTbody, 7, 'Issue data is unavailable.', 'Try again to refresh maintenance work.', retry);
    renderErrorState(elements.adminKitCatalogue, 'Project Kit catalogue is unavailable.', 'Retry to refresh the catalogue.', retry, { compact: true });
    elements.adminKitRequestsLink.hidden = true;
    renderErrorState(elements.adminNeedsAttentionList, 'Overview data is unavailable.', 'Retry to refresh actionable work.', retry, { compact: true });
    renderErrorState(elements.adminUpcomingReservationsList, 'Reservations are unavailable.', 'Retry to refresh the reservation preview.', retry, { compact: true });
    updateActionBadge(elements.adminPendingCount, 0);
    updateActionBadge(elements.adminIssuesCount, 0);
    return;
  }

  // Stats
  const total = state.resources.length;
  const maintenance = state.resources.filter((r) => r.status === 'MAINTENANCE').length;
  const adminItems = getAdminReservationItems();
  const pending = adminItems.filter((item) => item.data.status === 'PENDING').length;
  const approved = adminItems.filter(
    (item) => item.data.status === 'APPROVED' || item.data.status === 'CONFIRMED'
  ).length;
  const openIssues = state.adminIssues.filter(isActionableAdminIssue).length;

  elements.statTotalResources.textContent = total;
  elements.statMaintenanceResources.textContent = maintenance;
  elements.statPendingBookings.textContent = pending;
  elements.statApprovedBookings.textContent = approved;
  elements.statOpenIssues.textContent = openIssues;

  elements.countPendingAdminBookings.textContent = pending;
  renderAdminOverview();

  // Each admin destination renders only its own view content.
  renderAdminBookingsTable();
  renderAdminReservationsTable();
  renderAdminResourcesTable();
  renderAdminIssuesTable();
  renderAdminKitManagement();
}

function renderAdminOverview() {
  const pendingItems = getAdminReservationItems().filter((item) => item.data.status === 'PENDING');
  const pendingBookings = pendingItems.filter((item) => item.kind === 'BOOKING').length;
  const pendingKits = pendingItems.filter((item) => item.kind === 'KIT').length;
  const maintenance = state.resourcesLoaded && !state.resourceLoadError
    ? state.resources.filter((resource) => resource.status === 'MAINTENANCE').length
    : null;
  const actionableIssues = state.adminIssues.filter(isActionableAdminIssue).length;
  const attentionItems = [
    {
      title: 'Resource booking requests',
      count: pendingBookings,
      detail: pendingBookings
        ? `${pendingBookings} request${pendingBookings === 1 ? '' : 's'} awaiting review.`
        : 'No resource booking requests awaiting review.',
      route: 'admin-requests'
    },
    {
      title: 'Project Kit requests',
      count: pendingKits,
      detail: pendingKits
        ? `${pendingKits} Project Kit request${pendingKits === 1 ? '' : 's'} awaiting review.`
        : 'No Project Kit requests awaiting review.',
      route: 'admin-requests'
    },
    {
      title: 'Resources in maintenance',
      count: maintenance,
      detail: maintenance === null
        ? 'Resource inventory is temporarily unavailable.'
        : maintenance
          ? `${maintenance} resource${maintenance === 1 ? '' : 's'} currently in maintenance.`
          : 'No resources are currently in maintenance.',
      route: 'admin-resources'
    },
    {
      title: 'Actionable issues',
      count: actionableIssues,
      detail: actionableIssues
        ? `${actionableIssues} issue${actionableIssues === 1 ? '' : 's'} awaiting review or resolution.`
        : 'No issues are awaiting review or resolution.',
      route: 'admin-issues'
    }
  ];

  elements.adminNeedsAttentionList.innerHTML = `
    <div class="admin-attention-list">
      ${attentionItems.map((item) => `
        <button type="button" class="admin-attention-link" data-nav-to-admin="${item.route}">
          <span class="admin-attention-copy">
            <strong>${escapeHtml(item.title)}</strong>
            <small>${escapeHtml(item.detail)}</small>
          </span>
          <span class="overview-attention-count${item.count > 0 ? ' has-work' : ''}">${item.count === null ? '—' : item.count}</span>
        </button>
      `).join('')}
    </div>`;

  const upcomingReservations = getAdminReservationItems()
    .filter((item) => ['APPROVED', 'CONFIRMED'].includes(item.data.status))
    .slice(0, 3);
  if (upcomingReservations.length === 0) {
    elements.adminUpcomingReservationsList.innerHTML = '<p class="admin-overview-empty">No upcoming or current approved reservations.</p>';
    return;
  }

  elements.adminUpcomingReservationsList.innerHTML = `
    <div class="admin-upcoming-list">
      ${upcomingReservations.map((item) => {
        const record = item.data;
        const isKit = item.kind === 'KIT';
        const title = isKit ? (record.kitName || 'Project Kit') : (record.resourceName || 'Resource reservation');
        const reference = isKit ? (record.bookingReference || `Kit #${record.id}`) : `Booking #${record.bookingId}`;
        const owner = isKit ? record.ownerName : record.username;
        const status = getBookingDisplayStatus(record);
        return `
          <button type="button" class="admin-upcoming-link" data-nav-to-admin="admin-reservations" aria-label="View reservation for ${escapeHtml(title)}">
            <span class="admin-upcoming-main">
              <strong>${escapeHtml(title)}</strong>
              <small>${escapeHtml(reference)}${owner ? ` · ${escapeHtml(owner)}` : ''}</small>
            </span>
            <span class="admin-upcoming-meta">
              <time>${escapeHtml(formatDateTime(record.startTime))}</time>
              <span class="status-pill ${escapeHtml(record.status)}">${escapeHtml(status)}</span>
            </span>
          </button>`;
      }).join('')}
    </div>`;
}

function renderAdminWaitlistOverview() {
  const tbody = elements.adminWaitlistTbody;
  if (!tbody) return;
  tbody.innerHTML = '';
  elements.adminWaitlistCountBadge.textContent = `${state.adminWaitlistOverview.length} active ${state.adminWaitlistOverview.length === 1 ? 'slot' : 'slots'}`;

  if (state.adminWaitlistOverview.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="5" style="text-align: center; color: var(--slate-500); padding: 2rem;">
        No active waitlist queues or slot offers.
      </td></tr>`;
    return;
  }

  state.adminWaitlistOverview.forEach((slot) => {
    const tr = document.createElement('tr');
    const offerText = slot.activeOffer
      ? `<span class="status-pill OFFERED">${getStatusLabel('OFFERED')}</span>`
      : '<span style="color: var(--slate-500); font-weight: 600;">No active offer</span>';
    tr.innerHTML = `
      <td><strong>${escapeHtml(slot.resourceName)}</strong></td>
      <td>${formatDateTime(slot.requestedStart)} &rarr; ${formatDateTime(slot.requestedEnd)}</td>
      <td>${slot.waitingCount}</td>
      <td>${offerText}</td>
      <td>${slot.activeOffer ? formatDateTime(slot.offerExpiresAt) : '—'}</td>`;
    tbody.appendChild(tr);
  });
}

function renderAdminBookingsTable() {
  const tbody = elements.adminBookingsTbody;
  tbody.innerHTML = '';

  const filtered = getAdminReservationItems().filter((item) => item.data.status === 'PENDING');

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--slate-500); padding: 2rem;">
          No bookings are awaiting a decision.
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach((item) => {
    if (item.kind === 'KIT') {
      renderAdminKitBookingRow(tbody, item.data);
      return;
    }

    const booking = item.data;
    const tr = document.createElement('tr');

    const isPending = booking.status === 'PENDING';
    const displayStatus = getBookingDisplayStatus(booking);

    tr.innerHTML = `
      <td><strong>#${booking.bookingId}</strong></td>
      <td>
        <span style="font-weight: 600;">${escapeHtml(booking.username)}</span>
        <span style="color: var(--slate-400); font-size: 0.75rem;">(ID: ${booking.userId})</span>
      </td>
      <td>
        <span>${escapeHtml(booking.resourceName)}</span>
        <span class="type-badge ${booking.resourceType}" style="font-size: 0.65rem; margin-left: 0.25rem;">${escapeHtml(getResourceTypeLabel(booking.resourceType))}</span>
      </td>
      <td style="font-size: 0.8rem; color: var(--slate-600);">
        ${formatDateTime(booking.startTime)} &rarr; ${formatDateTime(booking.endTime)}
      </td>
      <td>
        <span class="status-pill ${booking.status}">${escapeHtml(displayStatus)}</span>
      </td>
      <td style="text-align: right;">
        ${isPending
          ? `<div style="display: inline-flex; gap: 0.4rem;">
               <button class="btn btn-success btn-sm admin-approve-btn" data-id="${booking.bookingId}"><span>✅ Approve</span></button>
               <button class="btn btn-danger btn-sm admin-reject-btn" data-id="${booking.bookingId}"><span>❌ Reject</span></button>
             </div>`
          : '<span style="color: var(--slate-500); font-size: 0.8rem; font-weight: 600;">Decision complete</span>'}
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

function renderAdminReservationRow(tbody, item, isHistory = false) {
  const booking = item.data;
  const isKit = item.kind === 'KIT';
  const username = isKit ? booking.ownerName : booking.username;
  const reference = isKit
    ? (booking.bookingReference || `Kit #${booking.id}`)
    : `#${booking.bookingId}`;
  const name = isKit ? (booking.kitName || 'Project Kit') : booking.resourceName;
  const type = isKit ? 'Project Kit' : getResourceTypeLabel(booking.resourceType);
  const status = getBookingDisplayStatus(booking, isHistory);
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><strong>${escapeHtml(reference)}</strong></td>
    <td>${escapeHtml(username || 'Unknown user')}</td>
    <td><span>${escapeHtml(name || 'Reservation')}</span><span class="type-badge ${isKit ? 'KIT' : escapeHtml(booking.resourceType)}">${escapeHtml(type)}</span></td>
    <td>${formatDateTime(booking.startTime)} &rarr; ${formatDateTime(booking.endTime)}</td>
    <td><span class="status-pill ${escapeHtml(booking.status)}">${escapeHtml(status)}</span></td>`;
  tbody.appendChild(tr);
}

function renderAdminReservationsTable() {
  const tbody = elements.adminReservationsTbody;
  tbody.innerHTML = '';
  const current = getAdminReservationItems().filter((item) =>
    ['APPROVED', 'CONFIRMED'].includes(item.data.status)
  );
  const history = state.adminBookingHistory
    .map((booking) => ({ kind: 'BOOKING', data: booking }))
    .sort((a, b) => new Date(b.data.startTime).getTime() - new Date(a.data.startTime).getTime());
  elements.adminReservationsCountBadge.textContent = `${current.length + history.length} ${current.length + history.length === 1 ? 'reservation' : 'reservations'}`;

  if (current.length === 0 && history.length === 0 && !state.adminHistoryLoadError) {
    tbody.innerHTML = '<tr><td colspan="5" class="table-empty-state">No approved or current reservations, or booking history.</td></tr>';
    return;
  }

  if (current.length > 0) {
    const heading = document.createElement('tr');
    heading.className = 'table-section-row';
    heading.innerHTML = '<th colspan="5" scope="colgroup">Current reservations</th>';
    tbody.appendChild(heading);
    current.forEach((item) => renderAdminReservationRow(tbody, item));
  }

  if (history.length > 0) {
    const heading = document.createElement('tr');
    heading.className = 'table-section-row';
    heading.innerHTML = '<th colspan="5" scope="colgroup">Booking history</th>';
    tbody.appendChild(heading);
    history.forEach((item) => renderAdminReservationRow(tbody, item, true));
  }

  if (state.adminHistoryLoadError) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="5"><div class="table-inline-error"><span>Booking history could not be loaded.</span><button type="button" class="btn btn-secondary btn-sm">Retry</button></div></td>';
    row.querySelector('button').addEventListener('click', () => loadAdminData());
    tbody.appendChild(row);
  }
}

function renderAdminKitManagement() {
  const catalogue = elements.adminKitCatalogue;
  catalogue.innerHTML = '';
  elements.adminKitCountBadge.textContent = `${state.kits.length} ${state.kits.length === 1 ? 'kit' : 'kits'}`;
  const pendingKitRequests = getAdminReservationItems().filter((item) =>
    item.kind === 'KIT' && item.data.status === 'PENDING'
  ).length;
  elements.adminKitRequestsLink.hidden = pendingKitRequests === 0;
  if (pendingKitRequests > 0) {
    const label = `${pendingKitRequests} pending Project Kit request${pendingKitRequests === 1 ? '' : 's'} — View booking requests`;
    elements.adminKitRequestsLink.textContent = label;
    elements.adminKitRequestsLink.setAttribute('aria-label', label);
  }

  if (state.kitLoadError && state.kits.length === 0) {
    renderErrorState(catalogue, 'Project Kit inventory is unavailable.', 'Try again to reload the kit catalogue.', () => loadKits(), { compact: true });
  } else if (state.kits.length === 0) {
    catalogue.innerHTML = '<div class="empty-state"><p class="state-title">No Project Kits in the catalogue.</p><p>Kits will appear here when they are configured for booking.</p></div>';
  } else {
    state.kits.forEach((kit) => {
      const items = Array.isArray(kit.items) ? kit.items : [];
      const operational = items.length > 0 && items.every((item) => item.status === 'AVAILABLE');
      const includedResources = items.length > 0
        ? `<ul class="admin-kit-item-list">${items.map((item) => `
            <li>
              <span>${escapeHtml(item.name)}</span>
              <span class="status-pill ${escapeHtml(item.status)}">${escapeHtml(getResourceStatusLabel(item.status))}</span>
            </li>`).join('')}</ul>`
        : '<p class="admin-kit-no-items">Included resource details are unavailable.</p>';
      const card = document.createElement('article');
      card.className = 'admin-kit-inventory-card';
      card.innerHTML = `
        <div class="admin-kit-inventory-heading"><h3>${escapeHtml(kit.name)}</h3><span class="status-pill ${operational ? 'AVAILABLE' : 'UNAVAILABLE'}">${operational ? 'Ready to book' : 'Check availability'}</span></div>
        <p>${escapeHtml(kit.description || 'Project Kit bundle')}</p>
        <strong class="admin-kit-included-title">Included resources</strong>
        ${includedResources}`;
      catalogue.appendChild(card);
    });
  }
}

function renderAdminKitBookingRow(tbody, kitBooking) {
  const tr = document.createElement('tr');
  const isPending = kitBooking.status === 'PENDING';
  const resources = Array.isArray(kitBooking.includedResources)
    ? kitBooking.includedResources
    : [];
  const resourceCount = Number(kitBooking.resourceCount) || resources.length;
  const resourceListHtml = resources.length > 0
     ? resources.map((resource) => `<li>${escapeHtml(resource.name)} <span class="type-badge ${escapeHtml(resource.type || 'KIT')}">${escapeHtml(getResourceTypeLabel(resource.type || 'RESOURCE'))}</span></li>`).join('')
    : '<li>Resource details unavailable</li>';
  const members = Array.isArray(kitBooking.groupMemberNames) ? kitBooking.groupMemberNames : [];
  const groupHtml = members.length > 0
    ? `<div class="admin-kit-members">👥 ${members.map((name) => escapeHtml(name)).join(', ')}</div>`
    : '';

  tr.className = 'admin-kit-row';
  tr.innerHTML = `
    <td>
      <strong class="kit-booking-reference">${escapeHtml(kitBooking.bookingReference || `Kit #${kitBooking.id}`)}</strong>
      <span class="type-badge KIT admin-record-badge">Project Kit</span>
    </td>
    <td>
      <span style="font-weight: 600;">${escapeHtml(kitBooking.ownerName || 'Unknown owner')}</span>
      <span style="color: var(--slate-400); font-size: 0.75rem;">(ID: ${kitBooking.ownerId})</span>
      ${groupHtml}
    </td>
    <td>
      <strong>${escapeHtml(kitBooking.kitName || 'Project Kit')}</strong>
      <details class="admin-kit-resources">
        <summary>${resourceCount} included resource${resourceCount === 1 ? '' : 's'}</summary>
        <ul>${resourceListHtml}</ul>
      </details>
    </td>
    <td style="font-size: 0.8rem; color: var(--slate-600);">
      ${formatDateTime(kitBooking.startTime)} &rarr; ${formatDateTime(kitBooking.endTime)}
    </td>
    <td>
      <span class="status-pill ${escapeHtml(kitBooking.status)}">${escapeHtml(getBookingDisplayStatus(kitBooking))}</span>
    </td>
    <td style="text-align: right;">
      ${isPending
        ? `<div style="display: inline-flex; gap: 0.4rem;">
             <button class="btn btn-success btn-sm admin-kit-approve-btn" type="button"><span>✅ Approve Kit</span></button>
             <button class="btn btn-danger btn-sm admin-kit-reject-btn" type="button"><span>❌ Reject Kit</span></button>
           </div>`
        : '<span style="color: var(--slate-500); font-size: 0.8rem; font-weight: 600;">Decision complete</span>'}
    </td>
  `;

  if (isPending) {
    tr.querySelector('.admin-kit-approve-btn').addEventListener('click', () =>
      handleAdminApproveKit(kitBooking)
    );
    tr.querySelector('.admin-kit-reject-btn').addEventListener('click', () =>
      handleAdminRejectKit(kitBooking)
    );
  }
  tbody.appendChild(tr);
}

function renderAdminResourcesTable() {
  const tbody = elements.adminResourcesTbody;
  tbody.innerHTML = '';

  if (state.resources.length === 0) {
    renderTableState(tbody, 7, 'No resources in the catalogue.', 'Add a room, lab, or piece of equipment to get started.');
    return;
  }

  state.resources.forEach((resource) => {
    const tr = document.createElement('tr');

    const isAvailable = resource.status === 'AVAILABLE';

    tr.innerHTML = `
      <td><strong>#${resource.id}</strong></td>
      <td><span style="font-weight: 700; color: var(--slate-900);">${escapeHtml(resource.name)}</span></td>
      <td><span class="type-badge ${resource.type}">${escapeHtml(getResourceTypeLabel(resource.type))}</span></td>
      <td style="max-width: 240px; color: var(--slate-600); font-size: 0.825rem;">${escapeHtml(resource.location || '—')}</td>
      <td>${resource.capacity == null ? '—' : escapeHtml(resource.capacity)}</td>
      <td>
        <span class="status-badge ${resource.status}">
          <span class="dot"></span>
          <span>${escapeHtml(getResourceStatusLabel(resource.status))}</span>
        </span>
      </td>
      <td style="text-align: right;">
        <div style="display: inline-flex; gap: 0.5rem;">
          <button class="btn btn-secondary btn-sm toggle-status-btn" data-id="${resource.id}" data-status="${resource.status}" aria-label="${isAvailable ? 'Set ' : 'Make '}${escapeHtml(resource.name)} ${isAvailable ? 'for maintenance' : 'operational'}">
            <span>${isAvailable ? '🔧 Set Maintenance' : '🟢 Set Operational'}</span>
          </button>
          <button class="btn btn-danger btn-sm delete-resource-btn" data-id="${resource.id}" data-name="${escapeHtml(resource.name)}" aria-label="Delete ${escapeHtml(resource.name)}">
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

function renderAdminIssuesTable() {
  const tbody = elements.adminIssuesTbody;
  tbody.innerHTML = '';
  const pendingCount = state.adminIssues.filter((issue) => issue.status === 'PENDING').length;
  const openCount = state.adminIssues.filter((issue) => issue.status === 'OPEN').length;
  elements.issuesCountBadge.textContent = `${pendingCount} awaiting review • ${openCount} in progress`;

  if (state.adminIssues.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--slate-500); padding: 2rem;">
          No resource issues have been reported.
        </td>
      </tr>
    `;
    return;
  }

  state.adminIssues.forEach((issue) => {
    const tr = document.createElement('tr');
    const isPending = issue.status === 'PENDING';
    const isOpen = issue.status === 'OPEN';
    const actionHtml = isPending
      ? `<div style="display: inline-flex; gap: 0.4rem;">
           <button class="btn btn-success btn-sm approve-issue-btn" data-id="${issue.issueId}"><span>✅ Approve</span></button>
           <button class="btn btn-danger btn-sm reject-issue-btn" data-id="${issue.issueId}"><span>❌ Reject</span></button>
         </div>`
      : isOpen
        ? `<button class="btn btn-success btn-sm resolve-issue-btn" data-id="${issue.issueId}"><span>✅ Resolve</span></button>`
        : '<span style="color: var(--slate-500); font-size: 0.8rem; font-weight: 600;">Closed</span>';
    tr.innerHTML = `
      <td><strong>#${issue.issueId}</strong></td>
      <td>
        <span style="font-weight: 600;">${escapeHtml(issue.resourceName)}</span>
        <span class="type-badge ${issue.resourceType}" style="font-size: 0.65rem; margin-left: 0.25rem;">${escapeHtml(getResourceTypeLabel(issue.resourceType))}</span>
      </td>
      <td>${escapeHtml(issue.reporterUsername)} <span style="color: var(--slate-400); font-size: 0.75rem;">(ID: ${issue.reporterUserId})</span></td>
      <td style="max-width: 320px; color: var(--slate-600);">${escapeHtml(issue.description)}</td>
      <td style="font-size: 0.8rem; color: var(--slate-600);">${formatDateTime(issue.reportedTime)}</td>
      <td><span class="status-pill ${issue.status}">${escapeHtml(getStatusLabel(issue.status))}</span></td>
      <td style="text-align: right;">
        ${actionHtml}
      </td>
    `;

    if (isPending) {
      tr.querySelector('.approve-issue-btn').addEventListener('click', () => handleApproveIssue(issue));
      tr.querySelector('.reject-issue-btn').addEventListener('click', () => handleRejectIssue(issue));
    }
    if (isOpen) {
      tr.querySelector('.resolve-issue-btn').addEventListener('click', () => handleResolveIssue(issue));
    }
    tbody.appendChild(tr);
  });
}

// ============================================================================
// Actions & Handlers
// ============================================================================

function prepareAvailabilityTarget(route, item, forceReset = false) {
  const sameTarget = route.entityType === 'kit'
    ? Number(state.selectedKitForBooking?.id) === Number(item.id)
    : Number(state.selectedResourceForBooking?.id) === Number(item.id);
  state.selectedKitForBooking = route.entityType === 'kit' ? item : null;
  state.selectedResourceForBooking = route.entityType === 'resource' ? item : null;
  elements.bookingIsKit.value = String(route.entityType === 'kit');
  elements.bookingKitId.value = route.entityType === 'kit' ? item.id : '';
  elements.bookingResourceId.value = route.entityType === 'resource' ? item.id : '';
  elements.modalBookingTitle.textContent = `${item.name} — Availability`;
  elements.modalResourceSubtitle.textContent = route.entityType === 'kit'
    ? `Project Kit · ${Number(item.itemCount ?? (item.items || []).length)} included resources`
    : getResourceTypeLabel(item.type);
  elements.modalUserName.textContent = state.currentUser.name;
  elements.availabilitySummaryName.textContent = route.entityType === 'kit'
    ? `Project Kit · ${item.name}`
    : item.name;

  const status = route.entityType === 'kit'
    ? (kitIsReady(item) ? 'AVAILABLE' : 'UNAVAILABLE')
    : item.status;
  setOperationalStatus(status);
  elements.availabilitySummaryLocationRow.hidden = route.entityType === 'kit' || !item.location;
  elements.availabilitySummaryLocationLabel.textContent = item.type === 'EQUIPMENT' ? 'Pickup location' : 'Location';
  elements.availabilitySummaryLocation.textContent = item.location || '';
  elements.availabilitySummaryCapacityRow.hidden = route.entityType === 'kit' || item.capacity == null;
  elements.availabilitySummaryCapacity.textContent = item.capacity == null ? '' : `${item.capacity} people`;
  elements.mobileWorkspaceTitle.textContent = 'Availability';
  const heading = document.getElementById('availabilityHeading');
  if (heading) heading.textContent = route.entityType === 'kit' ? 'Choose an available Kit time' : 'Choose an available time';

  if (forceReset || !sameTarget) {
    state.selectedGroupMembers = [];
    resetBookingSuccessState();
    elements.groupMemberInput.value = '';
    elements.conflictBanner.style.display = 'none';
    initialiseScheduleSelection();
    renderGroupMemberTags();
  }
}

function closeBookingModal() {
  const route = state.contextRoute;
  if (route?.page === 'availability') {
    const previousRoute = window.history.state?.previousContextRoute;
    if (previousRoute?.page === 'detail'
        && previousRoute.entityType === route.entityType
        && Number(previousRoute.id) === Number(route.id)) {
      window.history.back();
      return;
    }
    navigateToContextRoute({
      page: 'detail',
      entityType: route.entityType,
      id: route.id
    }, { history: 'replace' });
    return;
  }
  switchTab('browse', { navKey: 'resources' });
}

function resetBookingSuccessState() {
  elements.bookingForm.hidden = false;
  elements.bookingSuccessState.hidden = true;
}

function showBookingSuccess({ isKit, resourceName, startTime, endTime }) {
  const displayName = isKit ? `Project Kit · ${resourceName}` : resourceName;
  elements.bookingForm.hidden = true;
  elements.bookingSuccessState.hidden = false;
  elements.modalBookingTitle.textContent = 'Request sent';
  elements.modalResourceSubtitle.textContent = isKit
    ? 'Project Kit · awaiting Admin approval'
    : 'Reservation · awaiting Admin approval';
  elements.bookingSuccessTitle.textContent = isKit
    ? 'Your Project Kit request is on its way'
    : 'Your reservation request is on its way';
  elements.bookingSuccessMessage.textContent = isKit
    ? 'The complete Project Kit request has been sent. An Admin will review it before the reservation is confirmed.'
    : 'Your reservation request has been sent. An Admin will review it before the reservation is confirmed.';
  elements.bookingSuccessResource.textContent = displayName;
  elements.bookingSuccessTime.textContent = `${formatDateTime(startTime)} → ${formatDateTime(endTime)}`;
  requestAnimationFrame(() => elements.closeBookingSuccessBtn.focus());
}

function setOperationalStatus(status) {
  const available = status === 'AVAILABLE';
  elements.modalOperationalStatus.className = `status-badge ${available ? 'AVAILABLE' : status}`;
  elements.modalOperationalStatus.innerHTML = `
    <span class="dot"></span>
    <span>${escapeHtml(available ? getResourceStatusLabel('AVAILABLE') : getResourceStatusLabel(status))}</span>
  `;
}

function initialiseScheduleSelection() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  state.availabilityWeekStart = startOfWeek(tomorrow);
  state.selectedMobileDay = dayIndexFromMonday(tomorrow);
  state.availability = null;
  clearScheduleSelection(false);
  elements.bookingStartTime.min = getLocalIsoString(now);
  elements.scheduleDaysGrid.innerHTML = '';
  elements.scheduleState.className = 'schedule-state';
  elements.scheduleState.textContent = 'Loading availability…';
  elements.scheduleState.setAttribute('aria-busy', 'true');
}

function startOfWeek(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  const mondayOffset = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - mondayOffset);
  return result;
}

function dayIndexFromMonday(date) {
  return (date.getDay() + 6) % 7;
}

async function loadAvailability() {
  if (!state.availabilityWeekStart) return;
  const weekStart = new Date(state.availabilityWeekStart);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const queryStart = getLocalIsoString(weekStart);
  const queryEnd = getLocalIsoString(weekEnd);

  elements.scheduleState.className = 'schedule-state';
  elements.scheduleState.textContent = 'Loading availability…';
  elements.scheduleDaysGrid.innerHTML = '';
  elements.mobileDaySelector.innerHTML = '';
  updateWeekLabel(weekStart, weekEnd);

  try {
    state.availability = state.selectedKitForBooking
      ? await api.getKitAvailability(state.selectedKitForBooking.id, queryStart, queryEnd)
      : await api.getResourceAvailability(state.selectedResourceForBooking.id, queryStart, queryEnd);
    elements.scheduleState.className = 'schedule-state ready';
    elements.scheduleState.textContent = '';
    elements.scheduleState.setAttribute('aria-busy', 'false');
    renderAvailabilitySchedule();
  } catch (err) {
    state.availability = null;
    elements.scheduleState.className = 'schedule-state error-state';
    elements.scheduleState.setAttribute('aria-busy', 'false');
    elements.scheduleState.innerHTML = `
      <span>Availability could not be loaded. ${escapeHtml(err.message || 'Please try again.')}</span>
      <button type="button" class="btn btn-secondary btn-sm schedule-retry-btn">Try again</button>
    `;
    elements.scheduleState.querySelector('.schedule-retry-btn')?.addEventListener('click', () => loadAvailability());
  }
}

function updateWeekLabel(weekStart, weekEnd) {
  const lastDay = new Date(weekEnd);
  lastDay.setDate(lastDay.getDate() - 1);
  const options = { day: 'numeric', month: 'short' };
  elements.scheduleWeekLabel.textContent = `${weekStart.toLocaleDateString('en-NZ', options)} – ${lastDay.toLocaleDateString('en-NZ', { ...options, year: 'numeric' })}`;
}

function renderAvailabilitySchedule() {
  const availability = state.availability;
  if (!availability) return;

  elements.scheduleDaysGrid.innerHTML = '';
  elements.mobileDaySelector.innerHTML = '';
  const slotsByDate = new Map();
  availability.slots.forEach((slot) => {
    const key = slot.startTime.slice(0, 10);
    if (!slotsByDate.has(key)) slotsByDate.set(key, []);
    slotsByDate.get(key).push(slot);
  });

  for (let index = 0; index < 7; index += 1) {
    const day = new Date(state.availabilityWeekStart);
    day.setDate(day.getDate() + index);
    const key = getLocalIsoString(day).slice(0, 10);
    const daySlots = slotsByDate.get(key) || [];

    const mobileButton = document.createElement('button');
    mobileButton.type = 'button';
    mobileButton.className = `mobile-day-btn${index === state.selectedMobileDay ? ' active' : ''}`;
    mobileButton.textContent = `${day.toLocaleDateString('en-NZ', { weekday: 'short' })} ${day.getDate()}`;
    mobileButton.setAttribute('aria-pressed', index === state.selectedMobileDay ? 'true' : 'false');
    mobileButton.setAttribute('aria-label', `Show ${day.toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long' })}`);
    mobileButton.addEventListener('click', () => {
      state.selectedMobileDay = index;
      renderAvailabilitySchedule();
    });
    elements.mobileDaySelector.appendChild(mobileButton);

    const column = document.createElement('section');
    column.className = `schedule-day${index === state.selectedMobileDay ? '' : ' mobile-hidden'}`;
    column.innerHTML = `
      <div class="schedule-day-header">
        <h3>${day.toLocaleDateString('en-NZ', { weekday: 'short' })}</h3>
        <span>${day.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}</span>
      </div>
      <div class="schedule-slots"></div>
    `;
    const slotsContainer = column.querySelector('.schedule-slots');
    daySlots.forEach((slot) => slotsContainer.appendChild(createScheduleSlot(slot)));
    if (daySlots.length === 0) {
      slotsContainer.innerHTML = '<span class="schedule-slot unavailable">No hours</span>';
    }
    elements.scheduleDaysGrid.appendChild(column);
  }
}

function createScheduleSlot(slot) {
  const button = document.createElement('button');
  button.type = 'button';
  const selected = isSlotSelected(slot);
  button.className = `schedule-slot ${selected ? 'selected' : slot.status.toLowerCase()}`;
  button.textContent = new Date(slot.startTime).toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit', hour12: false });
  const slotLabel = selected
    ? 'Selected'
    : slot.status === 'AVAILABLE' ? getStatusLabel('AVAILABLE') : getStatusLabel(slot.status);
  const start = new Date(slot.startTime);
  const end = new Date(slot.endTime);
  const dayLabel = start.toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long' });
  const timeLabel = `${start.toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })} to ${end.toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })}`;
  button.title = `${dayLabel}, ${timeLabel} — ${slotLabel}`;
  button.setAttribute('aria-label', button.title);
  const waitlistableConflict = !elements.bookingIsKit.value.includes('true')
    && ['BOOKED', 'PENDING'].includes(slot.status);
  button.disabled = slot.status !== 'AVAILABLE' && !waitlistableConflict;
  if (slot.status === 'AVAILABLE') {
    button.addEventListener('click', () => selectScheduleSlot(slot));
  } else if (waitlistableConflict) {
    button.addEventListener('click', () => selectConflictingSlot(slot));
  }
  return button;
}

function selectConflictingSlot(slot) {
  state.selectedScheduleStart = slot.startTime.slice(0, 16);
  state.selectedScheduleEnd = slot.endTime.slice(0, 16);
  elements.bookingStartTime.value = state.selectedScheduleStart;
  elements.bookingEndTime.min = state.selectedScheduleStart;
  elements.bookingEndTime.value = state.selectedScheduleEnd;
  updateDurationPreview();
  renderAvailabilitySchedule();
}

function isSlotSelected(slot) {
  if (!state.selectedScheduleStart || !state.selectedScheduleEnd) return false;
  return new Date(slot.startTime) >= new Date(state.selectedScheduleStart)
    && new Date(slot.endTime) <= new Date(state.selectedScheduleEnd);
}

function selectScheduleSlot(slot) {
  const clickedStart = new Date(slot.startTime);
  const clickedEnd = new Date(slot.endTime);
  let selectionStart = clickedStart;
  let selectionEnd = clickedEnd;

  if (state.selectedScheduleStart && state.selectedScheduleEnd) {
    const currentStart = new Date(state.selectedScheduleStart);
    const currentEnd = new Date(state.selectedScheduleEnd);
    const sameDay = currentStart.toDateString() === clickedStart.toDateString();
    const clickedOutside = clickedStart < currentStart || clickedStart >= currentEnd;
    if (sameDay && clickedOutside) {
      selectionStart = clickedStart < currentStart ? clickedStart : currentStart;
      selectionEnd = clickedEnd > currentEnd ? clickedEnd : currentEnd;
      if (!isRangeAvailable(selectionStart, selectionEnd)) {
        showToast('Unavailable Range', 'Your selection crosses a blocked period. Choose a continuous green range.', 'warning');
        return;
      }
    }
  }

  state.selectedScheduleStart = getLocalIsoString(selectionStart);
  state.selectedScheduleEnd = getLocalIsoString(selectionEnd);
  elements.bookingStartTime.value = state.selectedScheduleStart;
  elements.bookingEndTime.min = state.selectedScheduleStart;
  elements.bookingEndTime.value = state.selectedScheduleEnd;
  updateDurationPreview();
  renderAvailabilitySchedule();
}

function clearScheduleSelection(render = true) {
  state.selectedScheduleStart = null;
  state.selectedScheduleEnd = null;
  elements.bookingStartTime.value = '';
  elements.bookingEndTime.value = '';
  updateDurationPreview();
  if (render && state.availability) renderAvailabilitySchedule();
}

function isRangeAvailable(start, end) {
  if (!state.availability) return true;
  const overlappingSlots = state.availability.slots.filter((slot) =>
    new Date(slot.startTime) < end && new Date(slot.endTime) > start
  );
  if (overlappingSlots.length === 0) return true;
  return overlappingSlots.every((slot) => slot.status === 'AVAILABLE');
}

function changeAvailabilityWeek(days) {
  const next = new Date(state.availabilityWeekStart);
  next.setDate(next.getDate() + days);
  state.availabilityWeekStart = next;
  state.selectedMobileDay = 0;
  clearScheduleSelection(false);
  loadAvailability();
}

// Group Member Tag Helpers
function addGroupMemberFromInput() {
  const input = elements.groupMemberInput;
  if (!input) return;
  const raw = input.value.trim();
  if (!raw) return;

  const isId = /^\d+$/.test(raw);
  const memberObj = isId
    ? { id: Number(raw), display: `Peer ID: ${raw}` }
    : { username: raw, display: `@${raw}` };

  if (isId && Number(raw) === state.currentUser.id) {
    showToast('Notice', 'You are automatically included as the reservation owner.', 'info', 2500);
    input.value = '';
    return;
  }
  if (!isId && raw.toLowerCase() === state.currentUser.name.toLowerCase()) {
    showToast('Notice', 'You are automatically included as the reservation owner.', 'info', 2500);
    input.value = '';
    return;
  }

  const exists = state.selectedGroupMembers.some((m) =>
    isId ? m.id === memberObj.id : m.username && m.username.toLowerCase() === memberObj.username.toLowerCase()
  );

  if (exists) {
    showToast('Notice', 'This member is already added to the group list.', 'warning', 2000);
    input.value = '';
    return;
  }

  state.selectedGroupMembers.push(memberObj);
  input.value = '';
  renderGroupMemberTags();
}

function removeGroupMember(index) {
  state.selectedGroupMembers.splice(index, 1);
  renderGroupMemberTags();
}

function renderGroupMemberTags() {
  const container = elements.groupMembersTagsContainer;
  if (!container) return;
  container.innerHTML = '';

  if (state.selectedGroupMembers.length === 0) {
    container.innerHTML = '<span style="font-size: 0.75rem; color: var(--slate-400); font-style: italic;">No peers added yet.</span>';
    return;
  }

  state.selectedGroupMembers.forEach((member, index) => {
    const tag = document.createElement('span');
    tag.className = 'member-tag';
    tag.innerHTML = `
      <span>${escapeHtml(member.display)}</span>
      <button type="button" class="member-tag-remove" aria-label="Remove ${escapeHtml(member.display)}">&times;</button>
    `;
    tag.querySelector('.member-tag-remove').addEventListener('click', () => removeGroupMember(index));
    container.appendChild(tag);
  });
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
  if (state.availability) renderAvailabilitySchedule();
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
  if (state.availability) renderAvailabilitySchedule();
}

function updateDurationPreview() {
  const start = elements.bookingStartTime.value;
  const end = elements.bookingEndTime.value;
  elements.modalDurationPreview.textContent = formatDuration(start, end) || '—';

  if (!start || !end || new Date(end) <= new Date(start)) {
    elements.bookingForm.querySelector('#submitBookingBtn').disabled = true;
    state.selectedScheduleStart = null;
    state.selectedScheduleEnd = null;
    elements.modalSelectedDate.textContent = 'Choose a slot';
    elements.modalSelectedTime.textContent = '—';
    elements.selectionValidation.className = 'selection-validation';
    elements.selectionValidation.textContent = 'Select an available time slot to continue.';
    elements.conflictBanner.style.display = 'none';
    return;
  }

  state.selectedScheduleStart = start;
  state.selectedScheduleEnd = end;
  const startDate = new Date(start);
  const endDate = new Date(end);
  elements.modalSelectedDate.textContent = startDate.toLocaleDateString('en-NZ', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  elements.modalSelectedTime.textContent = `${startDate.toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })} – ${endDate.toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })}`;

  const available = isRangeAvailable(startDate, endDate);
  elements.bookingForm.querySelector('#submitBookingBtn').disabled = !available;
  elements.selectionValidation.className = `selection-validation ${available ? 'valid' : 'invalid'}`;
  elements.selectionValidation.textContent = available
    ? 'This displayed range is available. The server will verify it again when you book.'
    : 'This range includes a blocked period. Choose a continuous green range.';
  updateWaitlistConflictAction(startDate, endDate);
}

function updateWaitlistConflictAction(start, end, serverConfirmedBookingConflict = false) {
  const resource = state.selectedResourceForBooking;
  const isKit = elements.bookingIsKit.value === 'true';
  const slots = state.availability?.slots?.filter((slot) =>
    new Date(slot.startTime) < end && new Date(slot.endTime) > start
  ) || [];
  const statuses = new Set(slots.map((slot) => slot.status));
  const hasBookingConflict = serverConfirmedBookingConflict
    || statuses.has('BOOKED') || statuses.has('PENDING');
  const hasNonWaitlistableState = ['MAINTENANCE', 'UNAVAILABLE', 'PAST', 'HELD']
    .some((status) => statuses.has(status));
  const duplicate = state.userWaitlists.some((entry) =>
    entry.resourceId === resource?.id
      && new Date(entry.requestedStart).getTime() === start.getTime()
      && new Date(entry.requestedEnd).getTime() === end.getTime()
  );
  const eligible = resource && !isKit && resource.status === 'AVAILABLE'
    && start > new Date() && end > start && hasBookingConflict
    && !hasNonWaitlistableState && !duplicate;

  elements.conflictBanner.style.display = eligible ? 'flex' : 'none';
  if (eligible) {
    const time = `${start.toLocaleDateString('en-NZ', { weekday: 'short' })} ${start.toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit' })}–${end.toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit' })}`;
    elements.conflictMessage.textContent = 'This exact interval conflicts with an active booking.';
    elements.joinWaitlistFromConflictBtn.textContent = `Join waitlist for ${time}`;
  }
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

  if (!isRangeAvailable(new Date(startTime), new Date(endTime))) {
    updateWaitlistConflictAction(new Date(startTime), new Date(endTime));
    showToast('Unavailable Range', 'This time cannot be booked normally. Join the exact-slot waitlist when offered.', 'warning');
    return;
  }

  const memberUserIds = state.selectedGroupMembers
    .filter((m) => m.id !== undefined)
    .map((m) => m.id);
  const memberUsernames = state.selectedGroupMembers
    .filter((m) => m.username !== undefined)
    .map((m) => m.username);

  const isKit = elements.bookingIsKit.value === 'true';
  const kitId = Number(elements.bookingKitId.value);
  const resourceId = Number(elements.bookingResourceId.value);
  const resourceName = state.selectedResourceForBooking?.name || 'resource';
  const kitName = state.selectedKitForBooking?.name || 'Project Kit';

  const submitBtn = document.getElementById('submitBookingBtn');
  const btnText = submitBtn.querySelector('.btn-text');

  try {
    submitBtn.disabled = true;
    if (btnText) btnText.textContent = isKit ? 'Reserving All Kit Items...' : 'Verifying Slot...';

    if (isKit && kitId) {
      const payload = {
        userId: state.currentUser.id,
        startTime: startTime,
        endTime: endTime,
        memberUserIds: memberUserIds.length ? memberUserIds : undefined,
        memberUsernames: memberUsernames.length ? memberUsernames : undefined
      };

      const kitBooking = await api.bookKit(kitId, payload);
      showBookingSuccess({
        isKit: true,
        resourceName: kitBooking.kitName || kitName,
        startTime,
        endTime
      });
    } else {
      const payload = {
        userId: state.currentUser.id,
        resourceId: resourceId,
        startTime: startTime,
        endTime: endTime,
        memberUserIds: memberUserIds.length ? memberUserIds : undefined,
        memberUsernames: memberUsernames.length ? memberUsernames : undefined
      };

      await api.createBooking(payload);
      showBookingSuccess({
        isKit: false,
        resourceName,
        startTime,
        endTime
      });
    }

    await loadAllData();
  } catch (err) {
    if (err.status === 409) {
      // Smart Conflict Display
      if (!isKit && state.selectedResourceForBooking) {
        await loadAvailability();
      }
      const isBookingConflict = err.message === 'Resource is already booked during this time slot';
      updateWaitlistConflictAction(new Date(startTime), new Date(endTime), isBookingConflict);
      if (elements.conflictBanner.style.display === 'flex') {
        elements.conflictMessage.textContent = err.message;
      }
      showToast('Conflict Detected', err.message, 'error', 5500);
    } else {
      showToast('Booking Failed', err.message || 'Server error occurred.', 'error');
    }
  } finally {
    submitBtn.disabled = false;
    if (btnText) btnText.textContent = 'Confirm booking';
  }
}


// Direct Waitlist Join from Conflict Banner
async function handleJoinWaitlistFromConflict() {
  if (!state.selectedResourceForBooking) return;

  const startTime = elements.bookingStartTime.value;
  const endTime = elements.bookingEndTime.value;
  if (!startTime || !endTime) return;

  try {
    const resource = state.selectedResourceForBooking;
    const joined = await api.joinWaitlist(resource.id, startTime, endTime);
    state.userWaitlists = [
      joined,
      ...state.userWaitlists.filter((entry) => entry.id !== joined.id)
    ];
    renderMyWaitlists();
    updateMetrics();

    closeBookingModal();
    showToast(
      'Exact-slot waitlist joined',
      `You are waiting for ${resource.name}, ${formatDateTime(startTime)} to ${formatDateTime(endTime)}.`,
      'success'
    );

    await loadMyWaitlists();
  } catch (err) {
    showToast('Waitlist Notice', err.message, err.status === 409 ? 'warning' : 'error');
  }
}

// Cancel Booking Flow
async function handleCancelBooking(bookingId, resourceName) {
  const confirmed = await showConfirmDialog({
    title: 'Cancel this booking?',
    message: `Your reservation for ${resourceName} will be cancelled and the time may be offered to another student.`,
    confirmLabel: 'Cancel booking',
    cancelLabel: 'Keep booking',
    tone: 'danger'
  });
  if (!confirmed) return;

  try {
    await api.cancelBooking(bookingId);

    showToast(
      'Booking Cancelled',
      `Booking #${bookingId} was cancelled. Any matching student will receive a temporary slot offer.`,
      'info',
      6000
    );

    await loadAllData();
  } catch (err) {
    showToast('Cancellation Error', err.message, 'error');
  }
}

async function handleCancelKitBooking(kitBooking) {
  const reference = kitBooking.bookingReference || `Kit #${kitBooking.id}`;
  const kitName = kitBooking.kitName || 'Project Kit';
  const confirmed = await showConfirmDialog({
    title: 'Cancel this Project Kit reservation?',
    message: `${reference} · ${kitName} will be cancelled, releasing every included resource.`,
    confirmLabel: 'Cancel Project Kit',
    cancelLabel: 'Keep reservation',
    tone: 'danger'
  });
  if (!confirmed) return;

  try {
    await api.cancelKitBooking(kitBooking.id);
    showToast(
      'Kit Cancelled',
      `${reference} was cancelled and all included resources were released.`,
      'info',
      6000
    );
    await loadAllData();
  } catch (err) {
    showToast('Kit Cancellation Error', err.message, err.status === 409 ? 'warning' : 'error');
  }
}

async function handleReceiptDownload(bookingId) {
  try {
    const { blob, filename } = await api.downloadReceipt(bookingId);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('Receipt Downloaded', `PDF receipt for booking #${bookingId} is ready.`, 'success');
  } catch (err) {
    showToast('Receipt Error', err.message, 'error');
  }
}

async function handleKitReceiptDownload(kitBooking) {
  const reference = kitBooking.bookingReference || `Kit #${kitBooking.id}`;
  try {
    const { blob, filename } = await api.downloadKitReceipt(kitBooking.id);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `${reference}-receipt.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('Kit Receipt Downloaded', `PDF receipt for ${reference} is ready.`, 'success');
  } catch (err) {
    showToast('Kit Receipt Error', err.message, err.status === 403 ? 'warning' : 'error');
  }
}

function openIssueModal(resource) {
  state.selectedResourceForIssue = resource;
  elements.issueResourceId.value = resource.id;
  elements.modalIssueResourceName.textContent = `${resource.name} · ${getResourceTypeLabel(resource.type)}`;
  elements.issueDescription.value = '';
  openManagedModal(elements.issueModalBackdrop, elements.issueDescription, closeIssueModal);
}

function closeIssueModal() {
  closeManagedModal(elements.issueModalBackdrop);
  state.selectedResourceForIssue = null;
}

async function handleIssueSubmit(e) {
  e.preventDefault();
  const description = elements.issueDescription.value.trim();
  if (!description) {
    showToast('Validation Error', 'Please enter a short issue description.', 'warning');
    return;
  }

  const resource = state.selectedResourceForIssue;
  if (!resource) return;

  try {
    elements.submitIssueBtn.disabled = true;
    await api.reportIssue({
      resourceId: resource.id,
      reporterUserId: state.currentUser.id,
      description
    });
    closeIssueModal();
    showToast('Issue Reported', `${resource.name} is waiting for administrator review.`, 'success');
    await loadAllData();
  } catch (err) {
    showToast('Report Failed', err.message, 'error');
  } finally {
    elements.submitIssueBtn.disabled = false;
  }
}

async function handleApproveIssue(issue) {
  const confirmed = await showConfirmDialog({
    title: 'Approve this issue report?',
    message: `${issue.resourceName} will be placed into maintenance while the issue is investigated.`,
    confirmLabel: 'Approve issue',
    cancelLabel: 'Review later',
    tone: 'warning',
    icon: '⚠'
  });
  if (!confirmed) return;

  try {
    await api.approveIssue(issue.issueId);
    showToast('Issue Approved', `${issue.resourceName} is now in maintenance.`, 'success');
    await loadAllData();
  } catch (err) {
    showToast('Approval Failed', err.message, 'error');
  }
}

async function handleRejectIssue(issue) {
  const confirmed = await showConfirmDialog({
    title: 'Reject this issue report?',
    message: `The report for ${issue.resourceName} will be closed without changing its maintenance status.`,
    confirmLabel: 'Reject report',
    cancelLabel: 'Keep report',
    tone: 'danger'
  });
  if (!confirmed) return;

  try {
    await api.rejectIssue(issue.issueId);
    showToast('Issue Rejected', `Issue #${issue.issueId} was rejected; resource status was unchanged.`, 'info');
    await loadAllData();
  } catch (err) {
    showToast('Rejection Failed', err.message, 'error');
  }
}

async function handleResolveIssue(issue) {
  const confirmed = await showConfirmDialog({
    title: 'Mark this issue resolved?',
    message: `This will close the issue report for ${issue.resourceName}.`,
    confirmLabel: 'Mark resolved',
    cancelLabel: 'Not yet',
    tone: 'primary',
    icon: '✓'
  });
  if (!confirmed) return;

  try {
    await api.resolveIssue(issue.issueId);
    showToast('Issue Resolved', `Issue #${issue.issueId} has been resolved.`, 'success');
    await loadAllData();
  } catch (err) {
    showToast('Resolution Failed', err.message, 'error');
  }
}

// Admin Approvals
async function handleAdminApprove(bookingId) {
  const confirmed = await showConfirmDialog({
    title: 'Approve this booking?',
    message: `Booking #${bookingId} will become confirmed for the requested time.`,
    confirmLabel: 'Approve booking',
    cancelLabel: 'Review later',
    tone: 'primary',
    icon: '✓'
  });
  if (!confirmed) return;

  try {
    await api.approveBooking(bookingId);
    showToast('Booking approved', `Booking #${bookingId} is now confirmed.`, 'success');
    await loadAllData();
  } catch (err) {
    showToast('Error', err.message, 'error');
  }
}

async function handleAdminReject(bookingId) {
  const confirmed = await showConfirmDialog({
    title: 'Reject this booking?',
    message: `Booking #${bookingId} will be declined and its requested time released.`,
    confirmLabel: 'Reject booking',
    cancelLabel: 'Keep pending',
    tone: 'danger'
  });
  if (!confirmed) return;

  try {
    await api.rejectBooking(bookingId);
    showToast('Booking rejected', `Booking #${bookingId} was declined.`, 'warning');
    await loadAllData();
  } catch (err) {
    showToast('Error', err.message, 'error');
  }
}

async function handleAdminApproveKit(kitBooking) {
  const reference = kitBooking.bookingReference || `Kit #${kitBooking.id}`;
  const confirmed = await showConfirmDialog({
    title: 'Approve this Project Kit reservation?',
    message: `${reference} · ${kitBooking.kitName || 'Project Kit'} will be confirmed as one reservation.`,
    confirmLabel: 'Approve Project Kit',
    cancelLabel: 'Review later',
    tone: 'primary',
    icon: '✓'
  });
  if (!confirmed) return;

  try {
    await api.approveKitBooking(kitBooking.id);
    showToast('Kit Approved', `${reference} has been approved as one reservation.`, 'success');
    await loadAllData();
  } catch (err) {
    showToast('Kit Approval Error', err.message, err.status === 409 ? 'warning' : 'error');
  }
}

async function handleAdminRejectKit(kitBooking) {
  const reference = kitBooking.bookingReference || `Kit #${kitBooking.id}`;
  const confirmed = await showConfirmDialog({
    title: 'Reject this Project Kit reservation?',
    message: `${reference} · ${kitBooking.kitName || 'Project Kit'} will be declined and its resources released.`,
    confirmLabel: 'Reject Project Kit',
    cancelLabel: 'Keep pending',
    tone: 'danger'
  });
  if (!confirmed) return;

  try {
    await api.rejectKitBooking(kitBooking.id);
    showToast('Kit Rejected', `${reference} has been rejected and its resources were released.`, 'warning');
    await loadAllData();
  } catch (err) {
    showToast('Kit Rejection Error', err.message, err.status === 409 ? 'warning' : 'error');
  }
}

// Admin Resource Management
function openAddResourceModal() {
  elements.addResourceForm.reset();
  openManagedModal(elements.addResourceModalBackdrop, elements.newResourceName, closeAddResourceModal);
}

function closeAddResourceModal() {
  closeManagedModal(elements.addResourceModalBackdrop);
}

async function handleAddResourceSubmit(e) {
  e.preventDefault();

  const name = elements.newResourceName.value.trim();
  const type = elements.newResourceType.value;
  const status = elements.newResourceStatus.value;
  const description = elements.newResourceDescription.value.trim();
  const location = elements.newResourceLocation.value.trim();
  const capacityText = elements.newResourceCapacity.value.trim();

  if (!name) {
    showToast('Validation Error', 'Resource name is required.', 'warning');
    return;
  }

  const capacity = capacityText ? Number(capacityText) : null;
  if (capacity !== null && (!Number.isInteger(capacity) || capacity < 1)) {
    showToast('Validation Error', 'Capacity must be a positive whole number.', 'warning');
    elements.newResourceCapacity.focus();
    return;
  }

  const payload = { name, type, status, description, location: location || null, capacity };

  try {
    await api.createResource(payload);
    closeAddResourceModal();
    showToast('Resource created', `Added ${getResourceTypeLabel(type).toLowerCase()} "${name}".`, 'success');
    await loadResources();
    await loadAdminData();
  } catch (err) {
    showToast('Creation Failed', err.message, 'error');
  }
}

async function handleToggleResourceStatus(resourceId, newStatus) {
  try {
    await api.patchResourceStatus(resourceId, newStatus);
    showToast('Resource status updated', `Resource #${resourceId} is now ${getStatusLabel(newStatus).toLowerCase()}.`, 'info');
    await loadResources();
    await loadAdminData();
  } catch (err) {
    showToast('Update Failed', err.message, 'error');
  }
}

async function handleDeleteResource(resourceId, resourceName) {
  const confirmed = await showConfirmDialog({
    title: 'Delete this resource?',
    message: `"${resourceName}" will be permanently removed from the campus catalogue.`,
    confirmLabel: 'Delete resource',
    cancelLabel: 'Keep resource',
    tone: 'danger'
  });
  if (!confirmed) return;

  try {
    await api.deleteResource(resourceId);
    showToast('Deleted', `Resource "${resourceName}" was removed.`, 'warning');
    await loadResources();
    await loadAdminData();
  } catch (err) {
    showToast('Delete Failed', err.message, 'error');
  }
}

// ============================================================================
// Event Listeners Binding
// ============================================================================
function setupEventListeners() {
  window.addEventListener('popstate', restoreNavigationFromHistory);

  // Public authentication
  elements.signInModeBtn.addEventListener('click', () => {
    setAuthMode('signin');
    elements.authLoginUsername.focus();
  });
  elements.registerModeBtn.addEventListener('click', () => {
    setAuthMode('register');
    elements.authRegisterUsername.focus();
  });
  elements.loginForm.addEventListener('submit', handleLoginSubmit);
  elements.registerForm.addEventListener('submit', handleRegisterSubmit);
  elements.demoFillBtns.forEach((button) => {
    button.addEventListener('click', () => {
      setAuthMode('signin');
      elements.authLoginUsername.value = button.dataset.demoUsername || '';
      elements.authLoginPassword.value = button.dataset.demoPassword || '';
      setAuthNotice('Demo credentials filled. Select Sign in to authenticate normally.', 'info');
      elements.authLoginPassword.focus();
    });
  });

  // Mobile shell navigation
  elements.mobileMenuBtn.addEventListener('click', () => {
    const open = elements.appSidebar.classList.toggle('open');
    elements.sidebarBackdrop.hidden = !open;
    elements.mobileMenuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    elements.mobileMenuBtn.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  elements.sidebarBackdrop.addEventListener('click', closeMobileNavigation);
  elements.logoutBtn.addEventListener('click', handleLogout);

  // Sidebar navigation
  elements.navTabs.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('.nav-tab');
    if (tabBtn && tabBtn.dataset.tab) {
      switchTab(tabBtn.dataset.tab, {
        navKey: tabBtn.dataset.navKey || tabBtn.dataset.tab,
        focus: tabBtn.dataset.focus
      });
    }
  });

  elements.homeFindAvailabilityBtn.addEventListener('click', () =>
    switchTab('find-availability', { navKey: 'find-availability' })
  );
  elements.homeQuickLinks.forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.homeTarget;
      if (target === 'find-availability') switchTab('find-availability', { navKey: 'find-availability' });
      if (target === 'resources') switchTab('browse', { navKey: 'resources', focus: 'resources' });
      if (target === 'bookings') switchTab('my-bookings', { navKey: 'bookings' });
      if (target === 'waitlist') switchTab('waitlist', { navKey: 'waitlist' });
    });
  });
  elements.homeUpcomingList?.addEventListener('click', (event) => {
    if (event.target.closest('.home-reservation-view')) {
      switchTab('my-bookings', { navKey: 'bookings' });
    }
  });
  elements.homeViewAllBookingsBtn?.addEventListener('click', () =>
    switchTab('my-bookings', { navKey: 'bookings' })
  );
  elements.homeWaitlistOfferBtn?.addEventListener('click', () =>
    switchTab('waitlist', { navKey: 'waitlist' })
  );

  document.addEventListener('click', (event) => {
    const routeLink = event.target.closest('[data-nav-to]');
    if (routeLink?.dataset.navTo === 'resources') switchTab('browse', { navKey: 'resources' });
    const adminRouteLink = event.target.closest('[data-nav-to-admin]');
    if (adminRouteLink && ADMIN_ROUTES[adminRouteLink.dataset.navToAdmin]) {
      switchTab('admin', { navKey: adminRouteLink.dataset.navToAdmin });
    }
  });

  // Search & Filters
  elements.resourceSearchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderResources();
  });

  elements.typeFilters.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (chip && chip.dataset.filter) {
      document.querySelectorAll('.filter-chips .chip').forEach((c) => c.classList.remove('active'));
      document.querySelectorAll('.filter-chips .chip').forEach((c) => c.setAttribute('aria-pressed', 'false'));
      chip.classList.add('active');
      chip.setAttribute('aria-pressed', 'true');
      state.filterType = chip.dataset.filter;
      renderResources();
    }
  });

  elements.onlyAvailableToggle.addEventListener('click', () => {
    state.filterOnlyAvailable = !state.filterOnlyAvailable;
    elements.onlyAvailableToggle.classList.toggle('active', state.filterOnlyAvailable);
    elements.onlyAvailableToggle.setAttribute('aria-pressed', state.filterOnlyAvailable ? 'true' : 'false');
    renderResources();
  });


  // My Bookings Refresh
  elements.refreshMyBookingsBtn.addEventListener('click', () => {
    loadUserData();
    showToast('Refreshed', 'Schedule and queue updated.', 'info', 1800);
  });

  elements.bookingViewTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.booking-view-tab');
    if (!tab) return;
    state.bookingView = tab.dataset.bookingView;
    document.querySelectorAll('.booking-view-tab').forEach((button) => {
      const selected = button === tab;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-selected', selected ? 'true' : 'false');
    });
    renderMyBookings();
  });

  // Resource-first contextual detail and availability pages.
  elements.resourceDetailBackBtn.addEventListener('click', () =>
    switchTab('browse', { navKey: 'resources' })
  );
  elements.availabilityPageBackBtn.addEventListener('click', closeBookingModal);
  elements.cancelBookingModalBtn.addEventListener('click', closeBookingModal);
  elements.closeBookingSuccessBtn.addEventListener('click', closeBookingModal);
  elements.viewBookingsFromSuccessBtn.addEventListener('click', () => {
    switchTab('my-bookings', { navKey: 'bookings' });
  });

  elements.bookingStartTime.addEventListener('change', handleStartTimeChange);
  elements.bookingStartTime.addEventListener('input', handleStartTimeChange);
  elements.bookingEndTime.addEventListener('change', handleEndTimeChange);
  elements.bookingEndTime.addEventListener('input', handleEndTimeChange);

  elements.bookingForm.addEventListener('submit', handleBookingSubmit);
  elements.joinWaitlistFromConflictBtn.addEventListener('click', handleJoinWaitlistFromConflict);

  // Time-first availability search and parent-level booking path
  elements.timeFirstSearchForm.addEventListener('submit', handleTimeFirstSearchSubmit);
  elements.timeFirstSearchForm.addEventListener('input', invalidateTimeFirstResultsOnCriteriaChange);
  elements.timeFirstSearchForm.addEventListener('change', invalidateTimeFirstResultsOnCriteriaChange);
  elements.timeFirstCategory.addEventListener('change', updateTimeFirstCapacityVisibility);
  elements.timeFirstRefreshBtn.addEventListener('click', () => elements.timeFirstSearchForm.requestSubmit());
  elements.timeFirstBackBtn.addEventListener('click', () => {
    state.timeFirstSelection = null;
    state.timeFirstConflict = false;
    renderTimeFirstWorkflow();
  });
  elements.timeFirstConflictRefreshBtn.addEventListener('click', () => elements.timeFirstSearchForm.requestSubmit());
  elements.timeFirstAddMemberBtn.addEventListener('click', addTimeFirstGroupMember);
  elements.timeFirstGroupMemberInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addTimeFirstGroupMember();
    }
  });
  elements.timeFirstSubmitBtn.addEventListener('click', submitTimeFirstBooking);
  elements.timeFirstViewBookingsBtn.addEventListener('click', () =>
    switchTab('my-bookings', { navKey: 'bookings' })
  );
  elements.timeFirstAnotherBtn.addEventListener('click', resetTimeFirstWorkflow);
  elements.clearSlotSelectionBtn.addEventListener('click', () => clearScheduleSelection());
  elements.previousWeekBtn.addEventListener('click', () => changeAvailabilityWeek(-7));
  elements.nextWeekBtn.addEventListener('click', () => changeAvailabilityWeek(7));
  elements.currentWeekBtn.addEventListener('click', () => {
    state.availabilityWeekStart = startOfWeek(new Date());
    state.selectedMobileDay = dayIndexFromMonday(new Date());
    clearScheduleSelection(false);
    loadAvailability();
  });

  // Add Group Member Button & Enter key
  if (elements.addGroupMemberBtn) {
    elements.addGroupMemberBtn.addEventListener('click', addGroupMemberFromInput);
  }
  if (elements.groupMemberInput) {
    elements.groupMemberInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addGroupMemberFromInput();
      }
    });
  }

  // Presets
  elements.presetTomorrowMorning.addEventListener('click', () => setPreset(1, 9, 2));
  elements.presetTomorrowAfternoon.addEventListener('click', () => setPreset(1, 14, 2));
  elements.presetNextDay.addEventListener('click', () => setPreset(2, 10, 2));


  // Add Resource Modal
  elements.openAddResourceModalBtn.addEventListener('click', openAddResourceModal);
  elements.closeAddResourceModalBtn.addEventListener('click', closeAddResourceModal);
  elements.cancelAddResourceModalBtn.addEventListener('click', closeAddResourceModal);
  elements.addResourceForm.addEventListener('submit', handleAddResourceSubmit);

  // Issue Report Modal
  elements.closeIssueModalBtn.addEventListener('click', closeIssueModal);
  elements.cancelIssueModalBtn.addEventListener('click', closeIssueModal);
  elements.issueForm.addEventListener('submit', handleIssueSubmit);

  // Close the active modal on backdrop click or keep focus inside it on Escape/Tab.
  window.addEventListener('click', (e) => {
    if (modalState.active && e.target === modalState.active) closeActiveModal();
  });

  window.addEventListener('keydown', handleModalKeydown);
}

// ============================================================================
// Initialization
// ============================================================================
async function initApp() {
  elements.tabBrowse.appendChild(elements.weeklyAvailabilityPage);
  setupEventListeners();
  initialiseTimeFirstSearchForm();
  await restoreSession();
}

document.addEventListener('DOMContentLoaded', initApp);
