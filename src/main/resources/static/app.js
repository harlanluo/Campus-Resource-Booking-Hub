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
  userIssues: [],
  myBookingsSuccess: null,
  issueModalView: 'FORM',
  adminBookings: [],
  adminBookingHistory: [],
  adminKitBookings: [],
  adminKitBookingHistory: [],
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
  timeFirstRequestSequence: 0,
  sessionGeneration: 0,
  waitlistRequestSequence: 0,
  resourceLoadError: null,
  kitLoadError: null,
  resourcesLoaded: false,
  kitsLoaded: false,
  adminLoadError: null,
  adminHistoryLoadError: null,
  adminWaitlistLoadError: null,
  adminWaitlistLoaded: false,
  adminDataLoaded: false,
  userDataLoaded: false,
  homeReservationError: false,
  waitlistLoadError: false,
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
  timeFirstWhenSection: document.getElementById('timeFirstWhenSection'),
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
  adminResourceHealthList: document.getElementById('adminResourceHealthList'),
  adminFeedback: document.getElementById('adminFeedback'),
  adminFeedbackMessage: document.getElementById('adminFeedbackMessage'),
  dismissAdminFeedbackBtn: document.getElementById('dismissAdminFeedbackBtn'),
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
  addResourceFormError: document.getElementById('addResourceFormError'),
  newResourceName: document.getElementById('newResourceName'),
  newResourceType: document.getElementById('newResourceType'),
  newResourceStatus: document.getElementById('newResourceStatus'),
  newResourceDescription: document.getElementById('newResourceDescription'),
  newResourceLocation: document.getElementById('newResourceLocation'),
  newResourceCapacity: document.getElementById('newResourceCapacity'),
  newResourceCapacityGroup: document.getElementById('newResourceCapacityGroup'),
  newResourceNameError: document.getElementById('newResourceNameError'),
  newResourceCapacityError: document.getElementById('newResourceCapacityError'),

  // Issue Modal
  issueModalBackdrop: document.getElementById('issueModalBackdrop'),
  closeIssueModalBtn: document.getElementById('closeIssueModalBtn'),
  cancelIssueModalBtn: document.getElementById('cancelIssueModalBtn'),
  issueForm: document.getElementById('issueForm'),
  issueResourceId: document.getElementById('issueResourceId'),
  issueDescription: document.getElementById('issueDescription'),
  issueDescriptionError: document.getElementById('issueDescriptionError'),
  issueDescriptionCount: document.getElementById('issueDescriptionCount'),
  modalIssueResourceName: document.getElementById('modalIssueResourceName'),
  submitIssueBtn: document.getElementById('submitIssueBtn'),
  issueFormTitle: document.getElementById('modalIssueTitle'),
  issueSuccessState: document.getElementById('issueSuccessState'),
  issueSuccessResource: document.getElementById('issueSuccessResource'),
  issueSuccessBackBtn: document.getElementById('issueSuccessBackBtn'),
  issueSuccessHistoryBtn: document.getElementById('issueSuccessHistoryBtn'),
  issueHistoryState: document.getElementById('issueHistoryState'),
  issueHistoryTitle: document.getElementById('issueHistoryTitle'),
  issueHistoryList: document.getElementById('issueHistoryList'),
  issueHistoryBackBtn: document.getElementById('issueHistoryBackBtn'),
  issueHistoryReportBtn: document.getElementById('issueHistoryReportBtn'),
  myBookingsSuccess: document.getElementById('myBookingsSuccess'),
  myBookingsSuccessTitle: document.getElementById('myBookingsSuccessTitle'),
  myBookingsSuccessMessage: document.getElementById('myBookingsSuccessMessage'),
  myBookingsSuccessDetail: document.getElementById('myBookingsSuccessDetail'),
  myBookingsSuccessViewBtn: document.getElementById('myBookingsSuccessViewBtn'),
  myBookingsSuccessDismissBtn: document.getElementById('myBookingsSuccessDismissBtn'),

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
  AVAILABLE: 'Operational',
  MAINTENANCE: 'Maintenance',
  UNAVAILABLE: 'Unavailable',
  PENDING: 'Awaiting approval',
  APPROVED: 'Confirmed',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  WAITING: 'Waiting',
  OFFERED: 'Slot offered',
  EXPIRED: 'Expired',
  OPEN: 'Under review',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  BOOKED: 'Booked',
  HELD: 'Temporarily held',
  PAST: 'Past',
  LEFT: 'Left waitlist'
});

const STUDENT_STATUS_LABELS = Object.freeze({
  booking: Object.freeze({
    PENDING: 'Awaiting approval',
    APPROVED: 'Confirmed',
    CONFIRMED: 'Confirmed',
    COMPLETED: 'Completed',
    REJECTED: 'Rejected',
    CANCELLED: 'Cancelled'
  }),
  waitlist: Object.freeze({
    WAITING: 'Waiting',
    OFFERED: 'Slot offered',
    ACCEPTED: 'Accepted',
    DECLINED: 'Declined',
    EXPIRED: 'Expired',
    LEFT: 'Left waitlist'
  }),
  issue: Object.freeze({
    PENDING: 'Awaiting review',
    OPEN: 'In progress',
    REJECTED: 'Closed',
    RESOLVED: 'Resolved'
  })
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
  if (options.domain === 'booking' && status === 'PENDING' && options.history) return 'Expired request';
  return STUDENT_STATUS_LABELS[options.domain]?.[status] || STATUS_LABELS[status] || humanize(status);
}

function getResourceTypeLabel(type) {
  return RESOURCE_TYPE_LABELS[type] || humanize(type);
}

function getResourceStatusLabel(status) {
  return RESOURCE_STATUS_LABELS[status] || getStatusLabel(status);
}

function getBookingStatusLabel(status, history = false) {
  return getStatusLabel(status, { domain: 'booking', history });
}

function getWaitlistStatusLabel(status) {
  return getStatusLabel(status, { domain: 'waitlist' });
}

function getIssueStatusLabel(status) {
  return getStatusLabel(status, { domain: 'issue' });
}

function getStudentErrorMessage(error, fallback) {
  if (error?.status === 401) return 'Your session has expired. Sign in again.';
  if (error?.status === 403) return 'You do not have permission to complete this action.';
  if (error?.status === 404) return 'This item is no longer available. Refresh and try again.';
  if (error?.status === 409) return 'This request can no longer be completed. Refresh and try again.';
  return fallback;
}

function getAdminErrorMessage(error, fallback) {
  if (error?.status === 401) return 'Your session has expired. Sign in again.';
  if (error?.status === 403) return 'You do not have permission to complete this action.';
  if (error?.status === 404) return 'This item is no longer available. The list is refreshing.';
  if (error?.status === 409 || error?.status === 400) {
    return 'This item has already changed or can no longer be updated. The list is refreshing.';
  }
  return fallback;
}

function setAdminFeedback(message, type = 'success') {
  if (!elements.adminFeedback || !elements.adminFeedbackMessage) return;
  elements.adminFeedbackMessage.textContent = message;
  elements.adminFeedback.hidden = false;
  elements.adminFeedback.className = `admin-feedback ${type}`;
  const urgent = type === 'error' || type === 'warning';
  elements.adminFeedback.setAttribute('role', urgent ? 'alert' : 'status');
  elements.adminFeedback.setAttribute('aria-live', urgent ? 'assertive' : 'polite');
}

function clearAdminFeedback() {
  if (!elements.adminFeedback) return;
  elements.adminFeedback.hidden = true;
  if (elements.adminFeedbackMessage) elements.adminFeedbackMessage.textContent = '';
}

function adminActionFailed(error, fallback) {
  const message = getAdminErrorMessage(error, fallback);
  const stale = [400, 404, 409].includes(error?.status);
  setAdminFeedback(message, stale ? 'warning' : 'error');
  return stale;
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
    if (!res.ok) throw await responseError(res, 'We could not load resources. Try again.');
    return res.json();
  },

  async createResource(data) {
    const res = await fetch('/api/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw await responseError(res, 'We could not add this resource. Check the details and try again.');
    return res.json();
  },

  async patchResourceStatus(id, status) {
    const res = await fetch(`/api/resources/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw await responseError(res, 'We could not change the resource status. Try again.');
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
    if (!res.ok) throw await responseError(res, 'We could not delete this resource. Try again.');
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

  async getAdminKitBookingHistory() {
    const res = await fetch('/api/kit-bookings/history');
    if (!res.ok) throw await responseError(res, 'Failed to fetch Project Kit reservation history');
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
    if (!res.ok) throw await responseError(res, 'Failed to download booking receipt');
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
    if (!res.ok) throw await responseError(res, 'We could not load reported issues. Try again.');
    return res.json();
  },

  async getMyIssues() {
    const res = await fetch('/api/issues/mine');
    if (!res.ok) throw await responseError(res, 'Failed to fetch your issue reports');
    return res.json();
  },

  async reportIssue(data) {
    const res = await fetch('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw await responseError(res, 'Failed to report resource issue');
    return res.json();
  },

  async approveIssue(id) {
    const res = await fetch(`/api/issues/${id}/approve`, { method: 'PUT' });
    if (!res.ok) throw await responseError(res, 'We could not update this issue. Try again.');
    return res.json();
  },

  async rejectIssue(id) {
    const res = await fetch(`/api/issues/${id}/reject`, { method: 'PUT' });
    if (!res.ok) throw await responseError(res, 'We could not update this issue. Try again.');
    return res.json();
  },

  async resolveIssue(id) {
    const res = await fetch(`/api/issues/${id}/resolve`, { method: 'PUT' });
    if (!res.ok) throw await responseError(res, 'We could not update this issue. Try again.');
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
  previousFocus: null,
  initialFocus: null
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

function getModalInitialFocus(backdrop = modalState.active) {
  if (!backdrop) return null;
  const target = typeof modalState.initialFocus === 'function'
    ? modalState.initialFocus()
    : modalState.initialFocus;
  return target?.isConnected ? target : getFocusableElements(backdrop)[0] || backdrop;
}

function focusActiveModal(backdrop = modalState.active) {
  if (!backdrop || modalState.active !== backdrop || backdrop.getAttribute('aria-hidden') === 'true') return;

  // Resolve the newly opened visibility state before calling focus.
  void window.getComputedStyle(backdrop).visibility;
  const target = getModalInitialFocus(backdrop);
  if (target && document.activeElement !== target) target.focus?.({ preventScroll: true });
}

function openManagedModal(backdrop, initialFocus, closeHandler) {
  if (!backdrop) return;
  if (modalState.active && modalState.active !== backdrop) {
    modalState.close?.();
  }

  modalState.active = backdrop;
  modalState.close = closeHandler;
  modalState.initialFocus = initialFocus;
  modalState.previousFocus = document.activeElement instanceof HTMLElement
    ? document.activeElement
    : null;
  backdrop.classList.add('open');
  backdrop.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');

  elements.app?.setAttribute('inert', '');

  focusActiveModal(backdrop);
  requestAnimationFrame(() => requestAnimationFrame(() => focusActiveModal(backdrop)));
  window.setTimeout(() => focusActiveModal(backdrop), 0);
  // Reapply after the opening click's default focus handling has completed.
  window.setTimeout(() => focusActiveModal(backdrop), 50);
}

function closeManagedModal(backdrop, restoreFocus = true) {
  if (!backdrop) return;

  if (modalState.active === backdrop) {
    const previousFocus = modalState.previousFocus;
    modalState.active = null;
    modalState.close = null;
    modalState.previousFocus = null;
    modalState.initialFocus = null;
    document.body.classList.remove('modal-open');
    elements.app?.removeAttribute('inert');
    if (restoreFocus && previousFocus?.isConnected && previousFocus.focus
        && !previousFocus.closest('[hidden], [inert], [aria-hidden="true"]')) {
      previousFocus.focus();
    }
  }
  backdrop.classList.remove('open');
  backdrop.setAttribute('aria-hidden', 'true');
}

function closeActiveModal() {
  modalState.close?.();
}

function handleModalFocusOut() {
  if (!modalState.active) return;
  const activeModal = modalState.active;
  window.setTimeout(() => {
    if (modalState.active !== activeModal || activeModal.contains(document.activeElement)) return;
    focusActiveModal(activeModal);
  }, 0);
}

function handleModalFocusIn(event) {
  if (!modalState.active || modalState.active.contains(event.target)) return;
  focusActiveModal(modalState.active);
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
      elements.confirmModalCancelBtn,
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
  if (!modalState.active.contains(document.activeElement)) {
    event.preventDefault();
    const initialFocus = getModalInitialFocus(modalState.active);
    (focusables.includes(initialFocus) ? initialFocus : first).focus({ preventScroll: true });
    return;
  }
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
  return getBookingStatusLabel(booking.status, isHistory);
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
  state.sessionGeneration += 1;
  state.waitlistRequestSequence += 1;
  state.timeFirstRequestSequence += 1;
  state.currentUser = null;
  state.resources = [];
  state.kits = [];
  state.userBookings = [];
  state.userBookingHistory = [];
  state.userKitBookings = [];
  state.userKitBookingHistory = [];
  state.userWaitlists = [];
  state.userIssues = [];
  state.myBookingsSuccess = null;
  state.issueModalView = 'FORM';
  state.homeReservationError = false;
  state.waitlistLoadError = false;
  state.adminBookings = [];
  state.adminBookingHistory = [];
  state.adminKitBookings = [];
  state.adminKitBookingHistory = [];
  state.adminIssues = [];
  state.adminWaitlistOverview = [];
  state.activeTab = 'home';
  state.activeNavKey = 'home';
  state.contextRoute = null;
  state.filterType = 'ALL';
  state.filterOnlyAvailable = false;
  state.searchQuery = '';
  state.bookingView = 'UPCOMING';
  state.selectedResourceForBooking = null;
  state.selectedKitForBooking = null;
  state.selectedResourceForIssue = null;
  state.availability = null;
  state.availabilityWeekStart = null;
  state.selectedScheduleStart = null;
  state.selectedScheduleEnd = null;
  state.selectedMobileDay = 0;
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
  state.adminWaitlistLoadError = null;
  state.adminWaitlistLoaded = false;
  state.adminDataLoaded = false;
  state.userDataLoaded = false;

  elements.timeFirstSearchForm?.reset();
  initialiseTimeFirstSearchForm();
  if (elements.timeFirstSearchNotice) setTimeFirstNotice('');
  if (elements.timeFirstGroupMemberInput) elements.timeFirstGroupMemberInput.value = '';
  if (elements.timeFirstSearchBtn) {
    elements.timeFirstSearchBtn.disabled = false;
    elements.timeFirstSearchBtn.textContent = 'Search availability';
  }
  if (elements.timeFirstSubmitBtn) {
    elements.timeFirstSubmitBtn.disabled = false;
    elements.timeFirstSubmitBtn.textContent = 'Send booking request';
  }
  renderTimeFirstGroupMembers();
  renderTimeFirstWorkflow();
  elements.timeFirstResultsGrid.innerHTML = '';
  elements.timeFirstReviewDetails.innerHTML = '';
  elements.timeFirstInterval.textContent = '';
  elements.timeFirstConflictNotice.hidden = true;
  elements.timeFirstSuccessResource.textContent = '';
  elements.timeFirstSuccessTime.textContent = '';
  elements.timeFirstSuccessSection.hidden = true;

  elements.authLoginUsername.value = '';
  elements.authLoginPassword.value = '';
  elements.authRegisterUsername.value = '';
  elements.authRegisterEmail.value = '';
  elements.authRegisterPassword.value = '';
  elements.authRegisterConfirmPassword.value = '';
  elements.resourceSearchInput.value = '';
  elements.onlyAvailableToggle.classList.remove('active');
  elements.onlyAvailableToggle.setAttribute('aria-pressed', 'false');
  elements.typeFilters.querySelectorAll('.chip').forEach((chip) => {
    const selected = chip.dataset.filter === 'ALL';
    chip.classList.toggle('active', selected);
    chip.setAttribute('aria-pressed', selected ? 'true' : 'false');
  });
  elements.bookingForm?.reset();
  elements.bookingResourceId.value = '';
  elements.bookingIsKit.value = 'false';
  elements.bookingKitId.value = '';
  elements.groupMemberInput.value = '';
  elements.groupMembersTagsContainer.innerHTML = '';
  elements.bookingSuccessResource.textContent = '';
  elements.bookingSuccessTime.textContent = '';
  elements.modalResourceSubtitle.textContent = '';
  elements.availabilitySummaryName.textContent = '';
  resetBookingSuccessState();
  elements.myBookingsSuccess.hidden = true;
  elements.myBookingsSuccessTitle.textContent = '';
  elements.myBookingsSuccessMessage.textContent = '';
  elements.myBookingsSuccessDetail.textContent = '';
  elements.myBookingsList.innerHTML = '';
  elements.myWaitlistList.innerHTML = '';
  elements.studentSnapshotGrid.innerHTML = '';
  elements.homeUpcomingList.innerHTML = '';
  elements.homeWaitlistOffer.hidden = true;
  elements.resourcesGrid.innerHTML = '';
  elements.resourceDetailContent.innerHTML = '';
  elements.adminWaitlistTbody.innerHTML = '';
  clearAdminFeedback();
  elements.issueForm?.reset();
  elements.issueResourceId.value = '';
  elements.issueDescriptionError.hidden = true;
  elements.issueDescription.setAttribute('aria-invalid', 'false');
  elements.issueDescriptionCount.textContent = '0 / 500';
  elements.modalIssueResourceName.textContent = '';
  elements.issueSuccessResource.textContent = '';
  elements.issueHistoryList.innerHTML = '';
  elements.issueSuccessState.hidden = true;
  elements.issueHistoryState.hidden = true;
  elements.issueForm.hidden = false;
  elements.issueFormTitle.textContent = 'Report resource issue';
  elements.submitIssueBtn.disabled = false;
}

function showAuthScreen(message = '', type = 'error') {
  closeActiveModal();
  resetPrivateState();
  closeMobileNavigation();
  setAuthMode('signin', { keepNotice: Boolean(message) });
  elements.authScreen.hidden = false;
  elements.authLoginUsername.focus();
  elements.app.hidden = true;
  elements.app.setAttribute('aria-hidden', 'true');
  setAuthNotice(message, type);
  elements.authLoginPassword.value = '';
}

async function showAuthenticatedShell(identity) {
  closeActiveModal();
  resetPrivateState();
  applyCurrentUser(identity);
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
  elements.authScreen.hidden = true;
  await loadAllData();
  if (contextualRoute) renderContextualRoute(contextualRoute, { focus: true, refreshAvailability: true });
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
    resetPrivateState();
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

function setBrowseContextView(view, options = {}) {
  const views = {
    catalogue: elements.resourcesCatalogueView,
    detail: elements.resourceDetailPage,
    availability: elements.weeklyAvailabilityPage
  };
  const targetView = views[view];
  targetView.hidden = false;
  if (options.focus) {
    const heading = view === 'catalogue'
      ? targetView.querySelector('h1')
      : view === 'detail'
        ? elements.resourceDetailContent.querySelector('h1')
        : elements.modalBookingTitle;
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus();
    }
  }
  Object.entries(views).forEach(([key, item]) => {
    if (key !== view) item.hidden = true;
  });
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
  switchTab('browse', { navKey: 'resources', history: 'none', skipLoad: true, focus: false });
  renderContextualRoute(route, {
    focus: options.focus !== false,
    forceReset: Boolean(options.forceReset),
    refreshAvailability: options.refreshAvailability
  });
}

function focusPanelHeading(panel, isAdmin) {
  const heading = isAdmin
    ? elements.adminPageTitle
    : [...panel.querySelectorAll('h1')].find((item) => !item.closest('[hidden]'));
  if (!heading) return;
  heading.setAttribute('tabindex', '-1');
  heading.focus();
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
  if (isAdmin && state.activeNavKey !== navKey) clearAdminFeedback();
  if (state.activeTab === 'find-availability' && tabId !== 'find-availability') {
    state.timeFirstRequestSequence += 1;
  }
  if (!isAdmin && navKey === 'find-availability') {
    resetTimeFirstWorkflow({ focus: false, resetCriteria: true });
  }
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

  let activeAdminView = null;
  if (isAdmin) {
    const route = ADMIN_ROUTES[navKey];
    activeAdminView = route.view;
    document.querySelectorAll(`[data-admin-view="${activeAdminView}"]`).forEach((view) => {
      view.hidden = false;
    });
    elements.adminPageTitle.textContent = route.title;
    elements.adminPageDescription.textContent = route.description;
    elements.adminAddResourceAction.hidden = navKey !== 'admin-resources';
    if (activeNavButton) elements.tabAdmin.setAttribute('aria-labelledby', activeNavButton.id);
  } else {
    elements.tabAdmin.setAttribute('aria-labelledby', 'tabAdminBtn');
  }

  const panels = [elements.tabHome, elements.tabFindAvailability, elements.tabBrowse,
    elements.tabMyBookings, elements.tabWaitlist, elements.tabAdmin];
  const targetPanel = panels.find((panel) => panel.id === `tab-${tabId}`);
  targetPanel.classList.add('active');
  targetPanel.setAttribute('aria-hidden', 'false');
  if (tabId === 'browse' && (options.history !== 'none' || options.showCatalogue)) {
    setBrowseContextView('catalogue', { focus: options.focus !== false });
  }
  if (options.focus !== false) focusPanelHeading(targetPanel, isAdmin);
  panels.filter((panel) => panel !== targetPanel).forEach((panel) => {
    panel.classList.remove('active');
    panel.setAttribute('aria-hidden', 'true');
  });
  if (isAdmin) {
    document.querySelectorAll('[data-admin-view]').forEach((view) => {
      view.hidden = view.dataset.adminView !== activeAdminView;
    });
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
    switchTab('browse', { navKey: 'resources', history: 'none', skipLoad: true, focus: false });
    renderContextualRoute(contextualRoute, { focus: true, refreshAvailability: true });
    return;
  }
  const route = getRouteForRole(state.currentUser.role, routeKey);
  const validRoute = state.currentUser.role === 'ADMIN'
    ? Boolean(ADMIN_ROUTES[routeKey])
    : Boolean(STUDENT_ROUTES[routeKey]);
  if (state.currentUser.role === 'STUDENT' && route.navKey === 'resources') {
    state.contextRoute = null;
  }
  switchTab(route.tabId, {
    navKey: route.navKey,
    history: validRoute ? 'none' : 'replace',
    showCatalogue: state.currentUser.role === 'STUDENT' && route.navKey === 'resources'
  });
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

function isCurrentUserSession(sessionGeneration, userId) {
  return state.sessionGeneration === sessionGeneration
    && state.currentUser != null
    && String(state.currentUser.id) === String(userId);
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
  state.timeFirstRequestSequence += 1;
  state.timeFirstSearch = null;
  state.timeFirstResults = [];
  state.timeFirstSearchError = null;
  state.timeFirstSearching = false;
  elements.timeFirstSearchBtn.disabled = false;
  elements.timeFirstSearchBtn.textContent = 'Search availability';
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

  const requestSequence = ++state.timeFirstRequestSequence;
  const sessionGeneration = state.sessionGeneration;
  const userId = state.currentUser?.id;
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
    if (requestSequence !== state.timeFirstRequestSequence
        || !isCurrentUserSession(sessionGeneration, userId)) return;
    state.timeFirstResults = response.results || [];
  } catch (error) {
    if (requestSequence !== state.timeFirstRequestSequence
        || !isCurrentUserSession(sessionGeneration, userId)) return;
    state.timeFirstSearchError = getStudentErrorMessage(error, 'We could not search availability. Try again.');
  } finally {
    if (requestSequence === state.timeFirstRequestSequence
        && isCurrentUserSession(sessionGeneration, userId)) {
      state.timeFirstSearching = false;
      elements.timeFirstSearchBtn.disabled = false;
      elements.timeFirstSearchBtn.textContent = 'Search availability';
      renderTimeFirstWorkflow();
      if (state.activeTab === 'find-availability') {
        document.getElementById('timeFirstResultsTitle').focus();
      }
    }
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
  elements.timeFirstReviewSection.hidden = false;
  document.getElementById('timeFirstReviewTitle').focus();
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
  const requestSequence = ++state.timeFirstRequestSequence;
  const sessionGeneration = state.sessionGeneration;
  const userId = state.currentUser?.id;
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
    if (requestSequence !== state.timeFirstRequestSequence
        || !isCurrentUserSession(sessionGeneration, userId)) return;
    state.timeFirstSuccess = {
      isKit,
      name: isKit ? (created.kitName || result.name) : result.name,
      startTime,
      endTime
    };
    state.timeFirstSelection = null;
    state.timeFirstConflict = false;
    state.selectedGroupMembers = [];
    elements.timeFirstSuccessSection.hidden = false;
    document.getElementById('timeFirstSuccessTitle').focus();
    renderTimeFirstWorkflow();
    await loadUserData();
  } catch (error) {
    if (requestSequence !== state.timeFirstRequestSequence
        || !isCurrentUserSession(sessionGeneration, userId)) return;
    if (error.status === 409) {
      state.timeFirstConflict = true;
      renderTimeFirstWorkflow();
      return;
    }
    showToast('Booking request failed', getStudentErrorMessage(error, 'We could not send this booking request. Check the details and try again.'), 'error', 5000);
  } finally {
    if (requestSequence === state.timeFirstRequestSequence
        && isCurrentUserSession(sessionGeneration, userId)) {
      state.timeFirstSubmitting = false;
      if (state.timeFirstSelection) renderTimeFirstReview();
    }
  }
}

function renderTimeFirstSuccess() {
  const success = state.timeFirstSuccess;
  if (!success) return;
  elements.timeFirstSuccessResource.textContent = `${success.isKit ? 'Project Kit · ' : ''}${success.name}`;
  elements.timeFirstSuccessTime.textContent = formatTimeFirstInterval(success.startTime, success.endTime);
}

function resetTimeFirstWorkflow(options = {}) {
  state.timeFirstRequestSequence += 1;
  state.timeFirstSearch = null;
  state.timeFirstResults = [];
  state.timeFirstSearchError = null;
  state.timeFirstSearching = false;
  state.timeFirstSelection = null;
  state.timeFirstSuccess = null;
  state.timeFirstConflict = false;
  state.timeFirstSubmitting = false;
  state.selectedGroupMembers = [];
  elements.timeFirstGroupMemberInput.value = '';
  elements.timeFirstResultsGrid.innerHTML = '';
  elements.timeFirstReviewDetails.innerHTML = '';
  elements.timeFirstInterval.textContent = '';
  elements.timeFirstSuccessResource.textContent = '';
  elements.timeFirstSuccessTime.textContent = '';
  elements.timeFirstConflictNotice.hidden = true;
  if (options.resetCriteria) {
    elements.timeFirstSearchForm.reset();
    initialiseTimeFirstSearchForm();
    setTimeFirstNotice('');
  }
  elements.timeFirstWhenSection.hidden = false;
  if (options.focus !== false) elements.timeFirstDate.focus();
  elements.timeFirstSearchBtn.disabled = false;
  elements.timeFirstSearchBtn.textContent = 'Search availability';
  elements.timeFirstSubmitBtn.disabled = false;
  elements.timeFirstSubmitBtn.textContent = 'Send booking request';
  renderTimeFirstGroupMembers();
  renderTimeFirstWorkflow();
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
  if (!state.currentUser) return;
  const userId = state.currentUser.id;
  const sessionGeneration = state.sessionGeneration;
  state.userDataLoaded = false;
  state.homeReservationError = false;
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
    api.getUserBookings(userId)
      .then((data) => ({ ok: true, data }))
      .catch((error) => ({ ok: false, error })),
    api.getUserBookingHistory(userId)
      .then((data) => ({ ok: true, data }))
      .catch((error) => ({ ok: false, error })),
    api.getUserKitBookings(userId)
      .then((data) => ({ ok: true, data }))
      .catch((error) => ({ ok: false, error })),
    api.getUserKitBookingHistory(userId)
      .then((data) => ({ ok: true, data }))
      .catch((error) => ({ ok: false, error }))
  ]);

  if (!isCurrentUserSession(sessionGeneration, userId)) return;

  if (upcomingResult.ok) state.userBookings = upcomingResult.data;
  if (historyResult.ok) state.userBookingHistory = historyResult.data;
  if (kitUpcomingResult.ok) state.userKitBookings = kitUpcomingResult.data;
  if (kitHistoryResult.ok) state.userKitBookingHistory = kitHistoryResult.data;
  state.homeReservationError = !upcomingResult.ok || !kitUpcomingResult.ok;
  const activeBookingResult = state.bookingView === 'HISTORY' ? historyResult : upcomingResult;
  const activeKitResult = state.bookingView === 'HISTORY' ? kitHistoryResult : kitUpcomingResult;
  if (activeBookingResult.ok) {
    renderMyBookings();
  } else {
    const err = activeBookingResult.error;
    renderErrorState(
      elements.myBookingsList,
      'We could not load your reservations.',
      getStudentErrorMessage(err, 'Try again to reload your bookings.'),
      () => loadUserData()
    );
  }

  if (!activeKitResult.ok) {
    console.error('Error loading Project Kit reservations:', activeKitResult.error);
    showToast('Project Kit notice', getStudentErrorMessage(activeKitResult.error, 'Project Kit reservations could not be loaded.'), 'warning');
  }

  await waitlistPromise;
  if (!isCurrentUserSession(sessionGeneration, userId)) return;
  state.userDataLoaded = true;
  renderStudentSnapshot();
  renderStudentHomeDashboard();
  updateMetrics();
}

async function loadMyWaitlists() {
  const userId = state.currentUser?.id;
  if (userId == null) return false;
  const sessionGeneration = state.sessionGeneration;
  const requestSequence = ++state.waitlistRequestSequence;
  const isCurrentRequest = () => requestSequence === state.waitlistRequestSequence
    && isCurrentUserSession(sessionGeneration, userId);
  elements.myWaitlistList.innerHTML = '<div class="empty-state"><div class="spinner"></div><p>Loading your waitlist activity...</p></div>';
  try {
    const waitlists = await api.getMyWaitlist();
    if (!isCurrentRequest()) return false;
    state.userWaitlists = waitlists;
    state.waitlistLoadError = false;
    renderMyWaitlists();
    updateMetrics();
    return true;
  } catch (err) {
    if (!isCurrentRequest()) return false;
    state.userWaitlists = [];
    state.waitlistLoadError = true;
    renderErrorState(
      elements.myWaitlistList,
      'We could not load your waitlist activity.',
      getStudentErrorMessage(err, 'Try again to reload your waitlist.'),
      () => loadMyWaitlists(),
      { compact: true }
    );
    return false;
  }
}

async function loadAdminData() {
  const shouldShowLoading = !state.adminDataLoaded || Boolean(state.adminLoadError);
  state.adminLoadError = null;
  if (shouldShowLoading) renderAdminLoadingStates();
  const waitlistPromise = loadAdminWaitlistOverview();
  try {
    const [allBookings, allKitBookings, allIssues, bookingHistoryResult, kitHistoryResult] = await Promise.all([
      api.getAllBookings(),
      api.getAllKitBookings(),
      api.getIssues(),
      api.getAdminBookingHistory()
        .then((data) => ({ ok: true, data }))
        .catch((error) => ({ ok: false, error })),
      api.getAdminKitBookingHistory()
        .then((data) => ({ ok: true, data }))
        .catch((error) => ({ ok: false, error }))
    ]);
    state.adminBookings = allBookings;
    state.adminKitBookings = allKitBookings;
    state.adminIssues = allIssues;
    state.adminBookingHistory = bookingHistoryResult.ok ? bookingHistoryResult.data : [];
    state.adminKitBookingHistory = kitHistoryResult.ok ? kitHistoryResult.data : [];
    state.adminHistoryLoadError = !bookingHistoryResult.ok
      ? bookingHistoryResult.error
      : !kitHistoryResult.ok
        ? kitHistoryResult.error
        : null;
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
  if (!state.adminWaitlistLoaded) {
    elements.adminWaitlistCountBadge.textContent = 'Loading…';
    elements.adminWaitlistTbody.innerHTML = `
      <tr class="admin-loading-row"><td colspan="5"><span class="spinner spinner-sm" aria-hidden="true"></span> Loading waitlist updates…</td></tr>`;
  }
  try {
    state.adminWaitlistOverview = await api.getAdminWaitlistOverview();
    state.adminWaitlistLoaded = true;
    state.adminWaitlistLoadError = null;
    renderAdminWaitlistOverview();
    if (state.adminDataLoaded && !state.adminLoadError) renderAdminOverview();
  } catch (err) {
    state.adminWaitlistLoaded = true;
    state.adminWaitlistLoadError = err;
    renderTableState(
      elements.adminWaitlistTbody,
      5,
      'Waitlist activity is unavailable.',
      'Try again to refresh the slot and offer summary.',
      () => loadAdminWaitlistOverview()
    );
    elements.adminWaitlistCountBadge.textContent = 'Unavailable';
    if (state.adminDataLoaded && !state.adminLoadError) renderAdminOverview();
  }
}

function renderAdminLoadingStates() {
  const loadingRow = (colspan, label) => `
    <tr class="admin-loading-row"><td colspan="${colspan}"><span class="spinner spinner-sm" aria-hidden="true"></span> ${escapeHtml(label)}</td></tr>`;
  elements.adminBookingsTbody.innerHTML = loadingRow(7, 'Loading booking requests…');
  elements.adminReservationsTbody.innerHTML = loadingRow(7, 'Loading reservations…');
  elements.adminResourcesTbody.innerHTML = loadingRow(7, 'Loading resources…');
  elements.adminIssuesTbody.innerHTML = loadingRow(7, 'Loading issues…');
  elements.adminKitCatalogue.innerHTML = '<div class="snapshot-loading"><div class="spinner spinner-sm"></div><span>Loading Project Kits…</span></div>';
  elements.adminNeedsAttentionList.innerHTML = '<div class="snapshot-loading"><div class="spinner spinner-sm"></div><span>Loading actions…</span></div>';
  elements.adminUpcomingReservationsList.innerHTML = '<div class="snapshot-loading"><div class="spinner spinner-sm"></div><span>Loading reservations…</span></div>';
  elements.adminResourceHealthList.innerHTML = '<div class="snapshot-loading"><div class="spinner spinner-sm"></div><span>Loading resource health…</span></div>';
  [elements.statPendingBookings, elements.statApprovedBookings, elements.statTotalResources,
    elements.statMaintenanceResources, elements.statOpenIssues].forEach((element) => {
    element.textContent = '—';
  });
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
    ? `${formatDateTime(next.data.startTime)} · ${escapeHtml(getBookingDisplayStatus(next.data))}`
    : 'Browse resources to reserve a time.';
  const approvalMeta = pendingCount === 0
    ? 'Nothing is waiting for a decision.'
    : `${pendingCount} ${pendingCount === 1 ? 'reservation is' : 'reservations are'} awaiting review.`;
  const waitlistTitle = state.waitlistLoadError
    ? 'Unavailable'
    : offeredCount > 0
    ? `${offeredCount} slot ${offeredCount === 1 ? 'offer' : 'offers'} ready`
    : waitlistTotal > 0
      ? `${waitingCount} ${waitingCount === 1 ? 'request' : 'requests'} waiting`
      : 'No active waitlists';
  const waitlistMeta = state.waitlistLoadError
    ? 'We could not load your waitlist activity.'
    : offeredCount > 0
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

  if (state.homeReservationError) {
    renderErrorState(
      elements.homeUpcomingList,
      'Your reservations are unavailable.',
      'Try again to reload your upcoming reservations.',
      () => loadUserData(),
      { compact: true }
    );
    elements.homeWaitlistOffer.hidden = true;
    return;
  }

  const upcoming = getStudentReservationItems(false)
    .filter((item) => item.kind === 'KIT'
      ? isCurrentDashboardKit(item.data)
      : isCurrentDashboardBooking(item.data))
    .slice(0, 4);

  if (upcoming.length === 0) {
    elements.homeUpcomingList.innerHTML = `
      <div class="home-upcoming-empty">
        <strong>No upcoming bookings yet.</strong>
        <span>Your active room, lab, equipment, and Kit reservations will appear here.</span>
        <button type="button" class="btn btn-secondary btn-sm home-empty-find-btn">Find availability</button>
      </div>`;
  } else {
    elements.homeUpcomingList.innerHTML = upcoming.map((item) => {
      const booking = item.data;
      const name = item.kind === 'KIT'
        ? (booking.kitName || 'Project Kit')
        : (booking.resourceName || 'Resource reservation');
      const kindLabel = item.kind === 'KIT' ? 'Project Kit' : 'Reservation';
      const location = item.kind === 'BOOKING' && booking.resourceLocation
        ? `<span class="home-reservation-location">${escapeHtml(booking.resourceLocation)}</span>`
        : '';
      return `
        <article class="home-reservation-row">
          <div class="home-reservation-copy">
            <strong>${escapeHtml(name)}</strong>
            <span>${escapeHtml(formatTimeFirstInterval(booking.startTime, booking.endTime))}</span>
            ${location}
            <span class="status-pill ${escapeHtml(booking.status)}">${escapeHtml(getBookingDisplayStatus(booking))}</span>
          </div>
          <button class="btn btn-ghost btn-sm home-reservation-view" type="button" aria-label="Open ${escapeHtml(kindLabel.toLowerCase())} in My bookings">View</button>
        </article>`;
    }).join('');
  }

  elements.homeUpcomingList.querySelector('.home-empty-find-btn')?.addEventListener('click', () =>
    switchTab('find-availability', { navKey: 'find-availability' })
  );

  const activeOffer = state.userWaitlists
    .filter((item) => item.status === 'OFFERED')
    .filter((item) => !item.offerExpiresAt || new Date(item.offerExpiresAt).getTime() > Date.now())
    .sort((a, b) => new Date(a.offerExpiresAt || 0).getTime() - new Date(b.offerExpiresAt || 0).getTime())[0];
  elements.homeWaitlistOffer.hidden = !activeOffer;
  if (activeOffer) {
    elements.homeWaitlistOfferTitle.textContent = activeOffer.resourceName || 'Waitlist offer';
    const slot = formatTimeFirstInterval(
      activeOffer.requestedStart,
      activeOffer.requestedEnd
    );
    const expiry = activeOffer.offerExpiresAt
      ? ` · Offer expires at ${formatDateTime(activeOffer.offerExpiresAt)}`
      : '';
    elements.homeWaitlistOfferTime.textContent = `${slot}${expiry}`;
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
    elements.resourceDetailContent.innerHTML = `
      <div class="empty-state context-not-found" role="status">
        <h1 class="page-title" id="resourceDetailPageHeading" tabindex="-1">Item not found</h1>
        <p>This resource or Project Kit is no longer in the catalogue.</p>
      </div>
    `;
    elements.mobileWorkspaceTitle.textContent = 'Resource details';
    setBrowseContextView('detail', { focus: options.focus !== false });
    return;
  }

  state.contextRoute = route;
  if (route.page === 'detail') {
    elements.mobileWorkspaceTitle.textContent = route.entityType === 'kit' ? 'Project Kit details' : 'Resource details';
    if (route.entityType === 'kit') renderKitDetailPage(item);
    else renderResourceDetailPage(item);
    setBrowseContextView('detail', { focus: options.focus !== false });
    return;
  }

  prepareAvailabilityTarget(route, item, options.forceReset);
  setBrowseContextView('availability', { focus: options.focus !== false });
  if (options.refreshAvailability) loadAvailability();
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
            <button class="btn btn-ghost" type="button" id="resourceDetailMyIssuesBtn">My reported issues</button>
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
  elements.resourceDetailContent.querySelector('#resourceDetailMyIssuesBtn')?.addEventListener('click', () =>
    openIssueHistory(resource)
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
  elements.bookingViewTabs.querySelectorAll('.booking-view-tab').forEach((button) => {
    const selected = button.dataset.bookingView === state.bookingView;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-selected', selected ? 'true' : 'false');
  });
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

  renderMyBookingsSuccess();

  if (visibleItems.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="state-icon" aria-hidden="true">${isHistory ? '✓' : '▦'}</div>
        <p class="state-title">${isHistory ? 'No booking history yet.' : 'No upcoming bookings.'}</p>
        <p>${isHistory ? 'Completed, cancelled, and rejected reservations will appear here.' : 'Find a resource and choose an available time to get started.'}</p>
        ${isHistory ? '' : '<button class="btn btn-primary btn-sm empty-bookings-find-btn" type="button">Find availability</button>'}
      </div>
    `;
    container.querySelector('.empty-bookings-find-btn')?.addEventListener('click', () =>
      switchTab('find-availability', { navKey: 'find-availability' })
    );
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

function renderMyBookingsSuccess() {
  if (!elements.myBookingsSuccess) return;
  const notice = state.myBookingsSuccess;
  elements.myBookingsSuccess.hidden = !notice;
  if (!notice) return;
  elements.myBookingsSuccessTitle.textContent = notice.title;
  elements.myBookingsSuccessMessage.textContent = notice.message;
  elements.myBookingsSuccessDetail.textContent = notice.detail || '';
  elements.myBookingsSuccessViewBtn.textContent = notice.actionLabel || 'Review booking';
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

  const isOwner = Number(booking.userId) === Number(state.currentUser.id);
  const canCancel = !isHistory
    && isOwner
    && ['PENDING', 'CONFIRMED', 'APPROVED'].includes(booking.status)
    && new Date(booking.startTime).getTime() > Date.now();

  const duration = formatDuration(booking.startTime, booking.endTime);
  const isGroup = booking.groupBooking || (booking.groupMemberNames && booking.groupMemberNames.length > 0);
  const displayStatus = getBookingDisplayStatus(booking, isHistory);
  const locationHtml = booking.resourceLocation
    ? `<div class="booking-location-line"><span aria-hidden="true">⌖</span><span><strong>Location:</strong> ${escapeHtml(booking.resourceLocation)}</span></div>`
    : '';

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
          ${locationHtml}
          ${coMembersHtml}
        </div>
      </div>

      <div class="booking-actions-group">
        <span class="status-pill ${escapeHtml(booking.status)}">${escapeHtml(displayStatus)}</span>
        ${
          ['APPROVED', 'CONFIRMED', 'COMPLETED'].includes(booking.status)
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
      cancelBtn.addEventListener('click', () => handleCancelBooking(booking));
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

  const activeEntries = state.userWaitlists.filter((item) =>
    ['WAITING', 'OFFERED'].includes(item.status));
  const historyEntries = state.userWaitlists.filter((item) =>
    !['WAITING', 'OFFERED'].includes(item.status));
  elements.waitlistCountBadge.textContent = `${activeEntries.length} active`;

  if (state.userWaitlists.length === 0) {
    container.innerHTML = `
      <div class="empty-state waitlist-empty-state">
        <div class="state-icon" aria-hidden="true">↔️</div>
        <p class="state-title">You are not waiting for any resource slots.</p>
        <p>Join an exact time from a resource schedule when a slot is busy.</p>
        <button type="button" class="btn btn-primary btn-sm waitlist-browse-btn">Browse resources</button>
      </div>
    `;
    container.querySelector('.waitlist-browse-btn')?.addEventListener('click', () =>
      switchTab('browse', { navKey: 'resources' })
    );
    return;
  }

  const appendSection = (title, entries, active) => {
    if (!entries.length) return;
    const section = document.createElement('section');
    section.className = `waitlist-state-section${active ? ' waitlist-active-section' : ' waitlist-history-section'}`;
    section.innerHTML = `<h3>${title}</h3><div class="waitlist-section-list"></div>`;
    const list = section.querySelector('.waitlist-section-list');
    entries.forEach((item) => list.appendChild(createWaitlistCard(item, active)));
    container.appendChild(section);
  };

  appendSection('Active', activeEntries, true);
  appendSection('History', historyEntries, false);
}

function createWaitlistCard(item, active) {
  const card = document.createElement('article');
  const offered = item.status === 'OFFERED';
  const waiting = item.status === 'WAITING';
  card.className = `waitlist-card${offered ? ' offer-card' : ''}${active ? '' : ' history-card'}`;

  const position = waiting && item.queuePosition != null
    ? `<span>Position ${escapeHtml(item.queuePosition)} in queue</span>`
    : '';
  const expiry = offered && item.offerExpiresAt
    ? `<span>Offer expires at ${escapeHtml(formatDateTime(item.offerExpiresAt))}</span>`
    : '';
  const actions = offered
    ? `<div class="waitlist-actions">
         <p class="waitlist-offer-note">Accepting creates a normal booking request. Admin approval is still required.</p>
         <div class="waitlist-offer-buttons">
           <button type="button" class="btn btn-primary btn-sm accept-slot-btn">Accept slot</button>
           <button type="button" class="btn btn-secondary btn-sm decline-slot-btn">Decline</button>
         </div>
       </div>`
    : waiting
      ? '<button type="button" class="btn btn-danger btn-sm leave-waitlist-btn">Leave waitlist</button>'
      : '';

  card.innerHTML = `
    <div class="waitlist-card-copy">
      <span class="status-pill ${escapeHtml(item.status)}">${escapeHtml(getWaitlistStatusLabel(item.status))}</span>
      <strong class="waitlist-resource-name">${escapeHtml(item.resourceName)}</strong>
      <span>${escapeHtml(formatTimeFirstInterval(item.requestedStart, item.requestedEnd))}</span>
      ${position}${expiry}
    </div>
    ${actions}
  `;

  card.querySelector('.accept-slot-btn')?.addEventListener('click', () => handleAcceptSlot(item));
  card.querySelector('.decline-slot-btn')?.addEventListener('click', () => handleDeclineSlot(item));
  card.querySelector('.leave-waitlist-btn')?.addEventListener('click', () => handleLeaveWaitlist(item));
  return card;
}

async function handleAcceptSlot(item) {
  const userId = state.currentUser?.id;
  const sessionGeneration = state.sessionGeneration;
  try {
    const booking = await api.acceptWaitlistOffer(item.id);
    if (!isCurrentUserSession(sessionGeneration, userId)) return;
    state.bookingView = 'UPCOMING';
    state.myBookingsSuccess = {
      title: 'Slot accepted',
      message: 'A booking request was created for this exact time. Admin approval is still required.',
      detail: `${booking.resourceName || item.resourceName} · ${formatTimeFirstInterval(booking.startTime, booking.endTime)}`,
      actionLabel: 'Review upcoming bookings',
      view: 'UPCOMING'
    };
    await loadAllData();
    switchTab('my-bookings', { navKey: 'bookings' });
  } catch (err) {
    if (!isCurrentUserSession(sessionGeneration, userId)) return;
    showToast('Unable to accept', getStudentErrorMessage(err, 'We could not accept this offer. Refresh and try again.'), err.status === 409 ? 'warning' : 'error');
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

  const userId = state.currentUser?.id;
  const sessionGeneration = state.sessionGeneration;
  try {
    await api.declineWaitlistOffer(item.id);
    if (!isCurrentUserSession(sessionGeneration, userId)) return;
    showToast('Offer declined', 'The slot was released to the next eligible student.', 'info');
    await loadAllData();
    if (state.activeTab === 'waitlist') focusPanelHeading(elements.tabWaitlist, false);
  } catch (err) {
    if (!isCurrentUserSession(sessionGeneration, userId)) return;
    showToast('Unable to decline', getStudentErrorMessage(err, 'We could not decline this offer. Refresh and try again.'), err.status === 409 ? 'warning' : 'error');
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

  const userId = state.currentUser?.id;
  const sessionGeneration = state.sessionGeneration;
  try {
    await api.leaveWaitlist(item.id);
    if (!isCurrentUserSession(sessionGeneration, userId)) return;
    showToast('Waitlist left', 'Your request no longer counts in this queue.', 'info');
    await loadAllData();
    if (state.activeTab === 'waitlist') focusPanelHeading(elements.tabWaitlist, false);
  } catch (err) {
    if (!isCurrentUserSession(sessionGeneration, userId)) return;
    showToast('Unable to leave', getStudentErrorMessage(err, 'We could not leave this waitlist. Refresh and try again.'), err.status === 409 ? 'warning' : 'error');
  }
}

// ============================================================================
// Render: Tab 3 (Admin Panel)
// ============================================================================
function renderAdminDashboard() {
  if (state.adminLoadError) {
    const retry = () => loadAdminData();
    renderTableState(elements.adminBookingsTbody, 7, 'Booking data is unavailable.', 'Try again to refresh the approval queue.', retry);
    renderTableState(elements.adminReservationsTbody, 7, 'Reservation data is unavailable.', 'Try again to refresh current reservations.', retry);
    renderAdminResourcesTable();
    renderTableState(elements.adminIssuesTbody, 7, 'Issue data is unavailable.', 'Try again to refresh maintenance work.', retry);
    renderAdminKitManagement();
    elements.adminKitRequestsLink.hidden = true;
    renderErrorState(elements.adminNeedsAttentionList, 'Overview data is unavailable.', 'Retry to refresh actionable work.', retry, { compact: true });
    renderErrorState(elements.adminUpcomingReservationsList, 'Reservations are unavailable.', 'Retry to refresh the reservation preview.', retry, { compact: true });
    renderErrorState(elements.adminResourceHealthList, 'Resource health is unavailable.', 'Retry to refresh resource status.', retry, { compact: true });
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
  const resourceCounts = state.resourcesLoaded && !state.resourceLoadError
    ? {
      operational: state.resources.filter((resource) => resource.status === 'AVAILABLE').length,
      maintenance: state.resources.filter((resource) => resource.status === 'MAINTENANCE').length
    }
    : null;
  const maintenance = resourceCounts?.maintenance ?? null;
  const affectedKits = state.kitsLoaded && !state.kitLoadError
    ? state.kits.filter((kit) => !kitIsReady(kit)).length
    : null;
  const actionableIssues = state.adminIssues.filter(isActionableAdminIssue).length;
  const activeOffers = state.adminWaitlistLoaded && !state.adminWaitlistLoadError
    ? state.adminWaitlistOverview.filter((slot) => slot.activeOffer).length
    : null;
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
    },
    {
      title: 'Project Kits affected by maintenance',
      count: affectedKits,
      detail: affectedKits === null
        ? state.kitLoadError ? 'Project Kit readiness is temporarily unavailable.' : 'Project Kit readiness is still loading.'
        : affectedKits
          ? `${affectedKits} Kit${affectedKits === 1 ? '' : 's'} need an operational resource restored.`
          : 'All Project Kits are ready to book.',
      route: 'admin-kits'
    },
    {
      title: 'Active Waitlist offers',
      count: activeOffers,
      detail: activeOffers === null
        ? state.adminWaitlistLoadError ? 'Waitlist context is temporarily unavailable.' : 'Waitlist context is still loading.'
        : activeOffers
          ? `${activeOffers} exact-slot offer${activeOffers === 1 ? '' : 's'} awaiting Student acceptance.`
          : 'No active slot offers.',
      route: 'admin-overview',
      target: 'adminWaitlistSection'
    }
  ];

  elements.adminNeedsAttentionList.innerHTML = `
    <div class="admin-attention-list">
      ${attentionItems.map((item) => `
        <button type="button" class="admin-attention-link" data-nav-to-admin="${item.route}"${item.target ? ` data-admin-target="${item.target}"` : ''}>
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
    elements.adminUpcomingReservationsList.innerHTML = '<p class="admin-overview-empty">No upcoming or active confirmed reservations.</p>';
  } else {
    elements.adminUpcomingReservationsList.innerHTML = `
      <div class="admin-upcoming-list">
        ${upcomingReservations.map((item) => {
          const record = item.data;
          const isKit = item.kind === 'KIT';
          const title = isKit ? (record.kitName || 'Project Kit') : (record.resourceName || 'Resource reservation');
          const reference = isKit ? (record.bookingReference || `Kit #${record.id}`) : `Booking #${record.bookingId}`;
          const owner = isKit ? record.ownerName : record.username;
          const status = getBookingDisplayStatus(record);
          const active = new Date(record.startTime).getTime() <= Date.now();
          return `
            <button type="button" class="admin-upcoming-link" data-nav-to-admin="admin-reservations" aria-label="View reservation for ${escapeHtml(title)}">
              <span class="admin-upcoming-main">
                <strong>${escapeHtml(title)}</strong>
                <small>${escapeHtml(reference)}${owner ? ` · ${escapeHtml(owner)}` : ''}</small>
              </span>
              <span class="admin-upcoming-meta">
                <time>${active ? 'In progress' : escapeHtml(formatDateTime(record.startTime))}</time>
                <span class="status-pill ${escapeHtml(record.status)}">${escapeHtml(status)}</span>
              </span>
            </button>`;
        }).join('')}
      </div>`;
  }

  const resourceHealth = resourceCounts
    ? `<div class="admin-health-list">
        <button type="button" class="admin-health-link" data-nav-to-admin="admin-resources"><span>Operational resources</span><strong>${resourceCounts.operational}</strong></button>
        <button type="button" class="admin-health-link" data-nav-to-admin="admin-resources"><span>In maintenance</span><strong>${resourceCounts.maintenance}</strong></button>
        <button type="button" class="admin-health-link" data-nav-to-admin="admin-kits"><span>Kits not ready</span><strong>${affectedKits === null ? '—' : affectedKits}</strong></button>
      </div>`
    : !state.resourcesLoaded
      ? '<div class="snapshot-loading"><div class="spinner spinner-sm"></div><span>Loading resource health…</span></div>'
      : '<p class="admin-overview-empty">Resource status is temporarily unavailable.</p>';
  elements.adminResourceHealthList.innerHTML = resourceHealth;
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
    const statusText = slot.status === 'OFFERED'
      ? `<span class="status-pill OFFERED">${getWaitlistStatusLabel('OFFERED')}</span>`
      : `<span class="status-pill WAITING">${getWaitlistStatusLabel('WAITING')}</span>`;
    tr.innerHTML = `
      <td data-label="Resource"><strong>${escapeHtml(slot.resourceName)}</strong></td>
      <td data-label="Requested slot">${escapeHtml(formatDateTime(slot.requestedStart))} &rarr; ${escapeHtml(formatDateTime(slot.requestedEnd))}</td>
      <td data-label="Status">${statusText}</td>
      <td data-label="Queue">${Number(slot.waitingCount) || 0} waiting</td>
      <td data-label="Offer expires">${slot.activeOffer ? escapeHtml(formatDateTime(slot.offerExpiresAt)) : '—'}</td>`;
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
        <td colspan="7" class="table-empty-state">No booking requests need review.</td>
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
    const members = Array.isArray(booking.groupMemberNames) ? booking.groupMemberNames : [];
    const resource = state.resources.find((entry) => Number(entry.id) === Number(booking.resourceId));
    const capacity = resource?.capacity;
    const location = booking.resourceLocation || resource?.location;
    const type = getResourceTypeLabel(booking.resourceType);
    const groupHtml = members.length
      ? `<small class="admin-record-meta">Group members: ${members.map((name) => escapeHtml(name)).join(', ')}</small>`
      : '';

    tr.innerHTML = `
      <td data-label="Reference"><strong>#${escapeHtml(booking.bookingId)}</strong></td>
      <td data-label="Student and group"><strong>${escapeHtml(booking.username || 'Unknown student')}</strong>${groupHtml}</td>
      <td data-label="Resource or Project Kit">
        <strong>${escapeHtml(booking.resourceName || 'Resource')}</strong>
        <small class="admin-record-meta">Resource booking · ${escapeHtml(type)}</small>
      </td>
      <td data-label="Requested date and time">
        <strong>${escapeHtml(formatDateTime(booking.startTime))}</strong>
        <small class="admin-record-meta">Until ${escapeHtml(formatDateTime(booking.endTime))}</small>
      </td>
      <td data-label="Location or Kit contents">
        <span>${escapeHtml(location || (booking.resourceType === 'EQUIPMENT' ? 'Pickup location not listed' : 'Location not listed'))}</span>
        ${capacity != null ? `<small class="admin-record-meta">Capacity ${escapeHtml(capacity)}</small>` : ''}
      </td>
      <td data-label="Status"><span class="status-pill ${escapeHtml(booking.status)}">${escapeHtml(getBookingDisplayStatus(booking))}</span></td>
      <td data-label="Action">
        <div class="admin-row-actions">
          <button type="button" class="btn btn-success btn-sm admin-approve-btn" aria-label="Approve booking ${escapeHtml(booking.bookingId)}">Approve</button>
          <button type="button" class="btn btn-danger btn-sm admin-reject-btn" aria-label="Reject booking ${escapeHtml(booking.bookingId)}">Reject</button>
        </div>
      </td>
    `;

    tr.querySelector('.admin-approve-btn').addEventListener('click', (event) =>
      handleAdminApprove(booking.bookingId, event.currentTarget)
    );
    tr.querySelector('.admin-reject-btn').addEventListener('click', (event) =>
      handleAdminReject(booking.bookingId, event.currentTarget)
    );

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
  const members = Array.isArray(booking.groupMemberNames) ? booking.groupMemberNames : [];
  const groupHtml = members.length
    ? `<small class="admin-record-meta">Group members: ${members.map((member) => escapeHtml(member)).join(', ')}</small>`
    : '';
  const resource = isKit ? null : state.resources.find((entry) => Number(entry.id) === Number(booking.resourceId));
  const locationHtml = isKit
    ? `<details class="admin-kit-resources"><summary>${Number(booking.resourceCount) || (booking.includedResources || []).length} included resources</summary><ul>${(booking.includedResources || []).map((item) => {
      const location = item.location || 'Location not listed';
      const capacity = item.capacity == null ? '' : ` · Capacity ${escapeHtml(item.capacity)}`;
      return `<li><span>${escapeHtml(item.name)}<small class="admin-record-meta">${escapeHtml(getResourceTypeLabel(item.type || 'RESOURCE'))} · ${escapeHtml(location)}${capacity}</small></span></li>`;
    }).join('')}</ul></details>`
    : `<span>${escapeHtml(booking.resourceLocation || resource?.location || (booking.resourceType === 'EQUIPMENT' ? 'Pickup location not listed' : 'Location not listed'))}</span>${resource?.capacity == null ? '' : `<small class="admin-record-meta">Capacity ${escapeHtml(resource.capacity)}</small>`}`;
  const canCancel = !isHistory
    && ['APPROVED', 'CONFIRMED'].includes(booking.status)
    && new Date(booking.startTime).getTime() > Date.now();
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td data-label="Reference"><strong>${escapeHtml(reference)}</strong></td>
    <td data-label="Student and group"><strong>${escapeHtml(username || 'Unknown student')}</strong>${groupHtml}</td>
    <td data-label="Reservation"><strong>${escapeHtml(name || 'Reservation')}</strong><small class="admin-record-meta">${escapeHtml(type)}</small></td>
    <td data-label="Date and time"><strong>${escapeHtml(formatDateTime(booking.startTime))}</strong><small class="admin-record-meta">Until ${escapeHtml(formatDateTime(booking.endTime))}</small></td>
    <td data-label="Location or included resources">${locationHtml}</td>
    <td data-label="Status"><span class="status-pill ${escapeHtml(booking.status)}">${escapeHtml(status)}</span></td>
    <td data-label="Action">${canCancel
      ? `<button type="button" class="btn btn-danger btn-sm admin-cancel-reservation-btn" aria-label="Cancel reservation ${escapeHtml(reference)}">Cancel reservation</button>`
      : isHistory ? '<span class="admin-record-meta">—</span>' : '<span class="admin-record-meta">No action available</span>'}</td>`;
  const cancelButton = tr.querySelector('.admin-cancel-reservation-btn');
  if (cancelButton) {
    cancelButton.addEventListener('click', (event) =>
      handleAdminCancelReservation(item, event.currentTarget)
    );
  }
  tbody.appendChild(tr);
}

function renderAdminReservationsTable() {
  const tbody = elements.adminReservationsTbody;
  tbody.innerHTML = '';
  const current = getAdminReservationItems().filter((item) =>
    ['APPROVED', 'CONFIRMED'].includes(item.data.status)
  );
  const history = [
    ...state.adminBookingHistory.map((booking) => ({ kind: 'BOOKING', data: booking })),
    ...state.adminKitBookingHistory.map((booking) => ({ kind: 'KIT', data: booking }))
  ].sort((a, b) => new Date(b.data.startTime).getTime() - new Date(a.data.startTime).getTime());
  elements.adminReservationsCountBadge.textContent = `${current.length + history.length} ${current.length + history.length === 1 ? 'reservation' : 'reservations'}`;

  if (current.length === 0 && history.length === 0 && !state.adminHistoryLoadError) {
    tbody.innerHTML = '<tr><td colspan="7" class="table-empty-state">No upcoming reservations or booking history.</td></tr>';
    return;
  }

  if (current.length > 0) {
    const heading = document.createElement('tr');
    heading.className = 'table-section-row';
    heading.innerHTML = '<th colspan="7" scope="colgroup">Upcoming and active reservations</th>';
    tbody.appendChild(heading);
    current.forEach((item) => renderAdminReservationRow(tbody, item));
  }

  if (history.length > 0) {
    const heading = document.createElement('tr');
    heading.className = 'table-section-row';
    heading.innerHTML = '<th colspan="7" scope="colgroup">History</th>';
    tbody.appendChild(heading);
    history.forEach((item) => renderAdminReservationRow(tbody, item, true));
  }

  if (state.adminHistoryLoadError) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="7"><div class="table-inline-error"><span>Some reservation history could not be loaded.</span><button type="button" class="btn btn-secondary btn-sm">Retry</button></div></td>';
    row.querySelector('button').addEventListener('click', () => loadAdminData());
    tbody.appendChild(row);
  }
}

function renderAdminKitManagement() {
  const catalogue = elements.adminKitCatalogue;
  catalogue.innerHTML = '';
  elements.adminKitCountBadge.textContent = state.kitsLoaded
    ? `${state.kits.length} ${state.kits.length === 1 ? 'kit' : 'kits'}`
    : 'Loading…';
  const pendingKitRequests = getAdminReservationItems().filter((item) =>
    item.kind === 'KIT' && item.data.status === 'PENDING'
  ).length;
  elements.adminKitRequestsLink.hidden = pendingKitRequests === 0;
  if (pendingKitRequests > 0) {
    const label = `${pendingKitRequests} pending Project Kit request${pendingKitRequests === 1 ? '' : 's'} — View booking requests`;
    elements.adminKitRequestsLink.textContent = label;
    elements.adminKitRequestsLink.setAttribute('aria-label', label);
  }

  if (!state.kitsLoaded) {
    catalogue.innerHTML = '<div class="snapshot-loading"><div class="spinner spinner-sm"></div><span>Loading Project Kits…</span></div>';
  } else if (state.kitLoadError && state.kits.length === 0) {
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
  const resources = Array.isArray(kitBooking.includedResources)
    ? kitBooking.includedResources
    : [];
  const resourceCount = Number(kitBooking.resourceCount) || resources.length;
  const resourceListHtml = resources.length > 0
     ? resources.map((resource) => {
       const location = resource.location || 'Location not listed';
       const capacity = resource.capacity == null ? '' : ` · Capacity ${escapeHtml(resource.capacity)}`;
       return `<li><span>${escapeHtml(resource.name)}<small class="admin-record-meta">${escapeHtml(getResourceTypeLabel(resource.type || 'RESOURCE'))} · ${escapeHtml(location)}${capacity}</small></span></li>`;
     }).join('')
    : '<li>Resource details unavailable</li>';
  const members = Array.isArray(kitBooking.groupMemberNames) ? kitBooking.groupMemberNames : [];
  const groupHtml = members.length > 0
    ? `<small class="admin-record-meta">Group members: ${members.map((name) => escapeHtml(name)).join(', ')}</small>`
    : '';

  tr.className = 'admin-kit-row';
  tr.innerHTML = `
    <td data-label="Reference"><strong class="kit-booking-reference">${escapeHtml(kitBooking.bookingReference || `Kit #${kitBooking.id}`)}</strong></td>
    <td data-label="Student and group"><strong>${escapeHtml(kitBooking.ownerName || 'Unknown student')}</strong>${groupHtml}</td>
    <td data-label="Resource or Project Kit">
      <strong>${escapeHtml(kitBooking.kitName || 'Project Kit')}</strong>
      <small class="admin-record-meta">Project Kit reservation · ${resourceCount} included resource${resourceCount === 1 ? '' : 's'}</small>
      <details class="admin-kit-resources">
        <summary>Review included resources</summary>
        <ul>${resourceListHtml}</ul>
      </details>
    </td>
    <td data-label="Requested date and time">
      <strong>${escapeHtml(formatDateTime(kitBooking.startTime))}</strong>
      <small class="admin-record-meta">Until ${escapeHtml(formatDateTime(kitBooking.endTime))}</small>
    </td>
    <td data-label="Location or Kit contents">See included resources for their locations.</td>
    <td data-label="Status">
      <span class="status-pill ${escapeHtml(kitBooking.status)}">${escapeHtml(getBookingDisplayStatus(kitBooking))}</span>
    </td>
    <td data-label="Action">
      <div class="admin-row-actions">
        <button class="btn btn-success btn-sm admin-kit-approve-btn" type="button" aria-label="Approve ${escapeHtml(kitBooking.kitName || 'Project Kit')} request">Approve Kit</button>
        <button class="btn btn-danger btn-sm admin-kit-reject-btn" type="button" aria-label="Reject ${escapeHtml(kitBooking.kitName || 'Project Kit')} request">Reject Kit</button>
      </div>
    </td>
  `;

  tr.querySelector('.admin-kit-approve-btn').addEventListener('click', (event) =>
    handleAdminApproveKit(kitBooking, event.currentTarget)
  );
  tr.querySelector('.admin-kit-reject-btn').addEventListener('click', (event) =>
    handleAdminRejectKit(kitBooking, event.currentTarget)
  );
  tbody.appendChild(tr);
}

function renderAdminResourcesTable() {
  const tbody = elements.adminResourcesTbody;
  tbody.innerHTML = '';

  if (state.resourceLoadError) {
    renderTableState(tbody, 7, 'Resource inventory is unavailable.', 'Try again to reload campus resources.', () => loadResources());
    return;
  }
  if (!state.resourcesLoaded) {
    tbody.innerHTML = '<tr class="admin-loading-row"><td colspan="7"><span class="spinner spinner-sm" aria-hidden="true"></span> Loading resources…</td></tr>';
    return;
  }

  if (state.resources.length === 0) {
    renderTableState(tbody, 7, 'No resources in the catalogue.', 'Add a room, lab, or piece of equipment to get started.');
    return;
  }

  state.resources.forEach((resource) => {
    const tr = document.createElement('tr');

    const isAvailable = resource.status === 'AVAILABLE';
    const maintenanceAction = isAvailable ? 'Mark as maintenance'
      : resource.status === 'MAINTENANCE' ? 'Return to operational' : 'Set operational';
    const locationLabel = resource.type === 'EQUIPMENT' ? 'Pickup location' : 'Location';

    tr.innerHTML = `
      <td data-label="ID"><strong>#${escapeHtml(resource.id)}</strong></td>
      <td data-label="Resource"><strong>${escapeHtml(resource.name)}</strong></td>
      <td data-label="Type"><span class="type-badge ${escapeHtml(resource.type)}">${escapeHtml(getResourceTypeLabel(resource.type))}</span></td>
      <td data-label="${locationLabel}">${escapeHtml(resource.location || 'Not listed')}</td>
      <td data-label="Capacity">${resource.capacity == null ? '—' : escapeHtml(resource.capacity)}</td>
      <td data-label="Status">
        <span class="status-badge ${resource.status}">
          <span class="dot"></span>
          <span>${escapeHtml(getResourceStatusLabel(resource.status))}</span>
        </span>
      </td>
      <td data-label="Actions">
        <div class="admin-row-actions">
          <button type="button" class="btn btn-secondary btn-sm toggle-status-btn" aria-label="${maintenanceAction} for ${escapeHtml(resource.name)}">
            <span>${maintenanceAction}</span>
          </button>
          <button type="button" class="btn btn-danger btn-sm delete-resource-btn" aria-label="Delete ${escapeHtml(resource.name)}">
            <span>Delete</span>
          </button>
        </div>
      </td>
    `;

    tr.querySelector('.toggle-status-btn').addEventListener('click', () => {
      const nextStatus = isAvailable ? 'MAINTENANCE' : 'AVAILABLE';
      handleToggleResourceStatus(resource, nextStatus, tr.querySelector('.toggle-status-btn'));
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
    tbody.innerHTML = '<tr><td colspan="7" class="table-empty-state">No open issues need attention. No issue reports have been submitted.</td></tr>';
    return;
  }

  const orderedIssues = [...state.adminIssues].sort((a, b) => {
    const aActionable = isActionableAdminIssue(a) ? 0 : 1;
    const bActionable = isActionableAdminIssue(b) ? 0 : 1;
    return aActionable - bActionable
      || new Date(b.reportedTime).getTime() - new Date(a.reportedTime).getTime();
  });
  let previousGroup = null;
  orderedIssues.forEach((issue) => {
    const group = isActionableAdminIssue(issue) ? 'Open and in progress' : 'Closed reports';
    if (group !== previousGroup) {
      const heading = document.createElement('tr');
      heading.className = 'table-section-row';
      heading.innerHTML = `<th colspan="7" scope="colgroup">${group}</th>`;
      tbody.appendChild(heading);
      previousGroup = group;
    }
    const tr = document.createElement('tr');
    const isPending = issue.status === 'PENDING';
    const isOpen = issue.status === 'OPEN';
    const actionHtml = isPending
      ? `<button type="button" class="btn btn-success btn-sm approve-issue-btn" aria-label="Approve issue ${escapeHtml(issue.issueId)}">Approve report</button>
         <button type="button" class="btn btn-danger btn-sm reject-issue-btn" aria-label="Reject issue ${escapeHtml(issue.issueId)}">Reject report</button>`
      : isOpen
        ? `<button type="button" class="btn btn-success btn-sm resolve-issue-btn" aria-label="Resolve issue ${escapeHtml(issue.issueId)}">Mark resolved</button>`
        : '<span class="admin-record-meta">No action available</span>';
    tr.innerHTML = `
      <td data-label="Issue"><strong>#${escapeHtml(issue.issueId)}</strong></td>
      <td data-label="Resource"><strong>${escapeHtml(issue.resourceName)}</strong><small class="admin-record-meta">${escapeHtml(getResourceTypeLabel(issue.resourceType))}</small></td>
      <td data-label="Student reporter">${escapeHtml(issue.reporterUsername)}</td>
      <td data-label="Description" class="admin-issue-description">${escapeHtml(issue.description)}</td>
      <td data-label="Reported">${escapeHtml(formatDateTime(issue.reportedTime))}</td>
      <td data-label="Status"><span class="status-pill ${escapeHtml(issue.status)}">${escapeHtml(getIssueStatusLabel(issue.status))}</span></td>
      <td data-label="Action"><div class="admin-row-actions">${actionHtml}</div></td>
    `;

    if (isPending) {
      tr.querySelector('.approve-issue-btn').addEventListener('click', (event) => handleApproveIssue(issue, event.currentTarget));
      tr.querySelector('.reject-issue-btn').addEventListener('click', (event) => handleRejectIssue(issue, event.currentTarget));
    }
    if (isOpen) {
      tr.querySelector('.resolve-issue-btn').addEventListener('click', (event) => handleResolveIssue(issue, event.currentTarget));
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
      <span>We could not load availability. ${escapeHtml(getStudentErrorMessage(err, 'Please try again.'))}</span>
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
  const sessionGeneration = state.sessionGeneration;
  const userId = state.currentUser?.id;

  try {
    submitBtn.disabled = true;
    if (btnText) btnText.textContent = isKit ? 'Reserving All Kit Items...' : 'Verifying Slot...';

    if (isKit && kitId) {
      const payload = {
        userId,
        startTime: startTime,
        endTime: endTime,
        memberUserIds: memberUserIds.length ? memberUserIds : undefined,
        memberUsernames: memberUsernames.length ? memberUsernames : undefined
      };

      const kitBooking = await api.bookKit(kitId, payload);
      if (!isCurrentUserSession(sessionGeneration, userId)) return;
      showBookingSuccess({
        isKit: true,
        resourceName: kitBooking.kitName || kitName,
        startTime,
        endTime
      });
    } else {
      const payload = {
        userId,
        resourceId: resourceId,
        startTime: startTime,
        endTime: endTime,
        memberUserIds: memberUserIds.length ? memberUserIds : undefined,
        memberUsernames: memberUsernames.length ? memberUsernames : undefined
      };

      await api.createBooking(payload);
      if (!isCurrentUserSession(sessionGeneration, userId)) return;
      showBookingSuccess({
        isKit: false,
        resourceName,
        startTime,
        endTime
      });
    }

    await loadAllData();
  } catch (err) {
    if (!isCurrentUserSession(sessionGeneration, userId)) return;
    if (err.status === 409) {
      // Smart Conflict Display
      if (!isKit && state.selectedResourceForBooking) {
        await loadAvailability();
      }
      const isBookingConflict = err.message === 'Resource is already booked during this time slot';
      updateWaitlistConflictAction(new Date(startTime), new Date(endTime), isBookingConflict);
      if (elements.conflictBanner.style.display === 'flex') {
        elements.conflictMessage.textContent = 'This slot is no longer available. Refresh availability and try again.';
      }
      showToast('Slot unavailable', 'This slot is no longer available. Refresh availability and try again.', 'warning', 5500);
    } else {
      showToast('Booking failed', getStudentErrorMessage(err, 'We could not send this booking request. Try again.'), 'error');
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
  const sessionGeneration = state.sessionGeneration;
  const userId = state.currentUser?.id;

  try {
    const resource = state.selectedResourceForBooking;
    const joined = await api.joinWaitlist(resource.id, startTime, endTime);
    if (!isCurrentUserSession(sessionGeneration, userId)) return;
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
    if (!isCurrentUserSession(sessionGeneration, userId)) return;
    showToast('Waitlist notice', getStudentErrorMessage(err, 'We could not join this waitlist. Refresh availability and try again.'), err.status === 409 ? 'warning' : 'error');
  }
}

// Cancel Booking Flow
async function handleCancelBooking(booking) {
  const bookingId = booking.bookingId;
  const resourceName = booking.resourceName;
  const confirmed = await showConfirmDialog({
    title: 'Cancel this booking?',
    message: `Your reservation for ${resourceName} will be cancelled and the time may be offered to another student.`,
    confirmLabel: 'Cancel booking',
    cancelLabel: 'Keep booking',
    tone: 'danger'
  });
  if (!confirmed) return;
  const sessionGeneration = state.sessionGeneration;
  const userId = state.currentUser?.id;

  try {
    await api.cancelBooking(bookingId);
    if (!isCurrentUserSession(sessionGeneration, userId)) return;
    state.bookingView = 'HISTORY';
    state.myBookingsSuccess = {
      title: 'Booking cancelled',
      message: `${resourceName} was cancelled. The time may now be offered to another student.`,
      detail: formatTimeFirstInterval(booking.startTime, booking.endTime),
      actionLabel: 'Review booking history',
      view: 'HISTORY'
    };
    await loadAllData();
    if (state.activeTab === 'my-bookings') focusPanelHeading(elements.tabMyBookings, false);
  } catch (err) {
    if (!isCurrentUserSession(sessionGeneration, userId)) return;
    showToast('Cancellation error', getStudentErrorMessage(err, 'We could not cancel this booking. Refresh and try again.'), err.status === 409 ? 'warning' : 'error');
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
  const sessionGeneration = state.sessionGeneration;
  const userId = state.currentUser?.id;

  try {
    await api.cancelKitBooking(kitBooking.id);
    if (!isCurrentUserSession(sessionGeneration, userId)) return;
    state.bookingView = 'HISTORY';
    state.myBookingsSuccess = {
      title: 'Project Kit reservation cancelled',
      message: `${kitName} was cancelled as one parent reservation. Its included resources were released.`,
      detail: `${reference} · ${formatTimeFirstInterval(kitBooking.startTime, kitBooking.endTime)}`,
      actionLabel: 'Review booking history',
      view: 'HISTORY'
    };
    await loadAllData();
    if (state.activeTab === 'my-bookings') focusPanelHeading(elements.tabMyBookings, false);
  } catch (err) {
    if (!isCurrentUserSession(sessionGeneration, userId)) return;
    showToast('Kit cancellation error', getStudentErrorMessage(err, 'We could not cancel this Project Kit reservation. Refresh and try again.'), err.status === 409 ? 'warning' : 'error');
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
    showToast('Receipt Error', getStudentErrorMessage(err, 'We could not download this receipt. Refresh and try again.'), 'error');
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
    showToast('Kit Receipt Error', getStudentErrorMessage(err, 'We could not download this Project Kit receipt. Refresh and try again.'), err.status === 403 || err.status === 409 ? 'warning' : 'error');
  }
}

function openIssueModal(resource) {
  state.selectedResourceForIssue = resource;
  elements.issueResourceId.value = resource.id;
  elements.modalIssueResourceName.textContent = `${resource.name} · ${getResourceTypeLabel(resource.type)}`;
  elements.issueDescription.value = '';
  setIssueDescriptionError('');
  updateIssueDescriptionCount();
  showIssueModalView('FORM');
  openManagedModal(elements.issueModalBackdrop, elements.issueDescription, closeIssueModal);
}

function openIssueHistory(resource) {
  state.selectedResourceForIssue = resource;
  elements.issueResourceId.value = resource.id;
  elements.modalIssueResourceName.textContent = `${resource.name} · ${getResourceTypeLabel(resource.type)}`;
  showIssueModalView('HISTORY');
  openManagedModal(elements.issueModalBackdrop, elements.issueHistoryTitle, closeIssueModal);
  loadMyIssues();
}

function showIssueModalView(view) {
  state.issueModalView = view;
  elements.issueForm.hidden = view !== 'FORM';
  elements.issueSuccessState.hidden = view !== 'SUCCESS';
  elements.issueHistoryState.hidden = view !== 'HISTORY';
  elements.issueFormTitle.textContent = view === 'HISTORY'
    ? 'My reported issues'
    : view === 'SUCCESS' ? 'Issue reported' : 'Report resource issue';
}

function setIssueDescriptionError(message) {
  elements.issueDescriptionError.textContent = message;
  elements.issueDescriptionError.hidden = !message;
  elements.issueDescription.setAttribute('aria-invalid', message ? 'true' : 'false');
}

function updateIssueDescriptionCount() {
  elements.issueDescriptionCount.textContent = `${elements.issueDescription.value.length} / 500`;
}

function renderIssueHistory() {
  const container = elements.issueHistoryList;
  if (state.userIssues.length === 0) {
    container.innerHTML = `
      <div class="empty-state issue-history-empty">
        <p class="state-title">You haven't reported any issues.</p>
        <p>Reports you submit for campus resources will appear here.</p>
        <button type="button" class="btn btn-primary btn-sm issue-history-empty-report-btn">Report an issue</button>
      </div>`;
    container.querySelector('.issue-history-empty-report-btn')?.addEventListener('click', () => {
      showIssueModalView('FORM');
      requestAnimationFrame(() => elements.issueDescription.focus());
    });
    return;
  }

  container.innerHTML = state.userIssues.map((issue) => `
    <article class="issue-history-card">
      <div class="issue-history-card-heading">
        <div>
          <strong>${escapeHtml(issue.resourceName || 'Campus resource')}</strong>
          <span>${escapeHtml(issue.resourceType ? getResourceTypeLabel(issue.resourceType) : 'Resource')}</span>
        </div>
        <span class="status-pill ${escapeHtml(issue.status)}">${escapeHtml(getIssueStatusLabel(issue.status))}</span>
      </div>
      <p>${escapeHtml(issue.description)}</p>
      <span class="issue-history-date">Reported ${escapeHtml(issue.reportedTime ? formatDateTime(issue.reportedTime) : 'date unavailable')}</span>
    </article>
  `).join('');
}

async function loadMyIssues() {
  const userId = state.currentUser?.id;
  if (userId == null) return false;
  const sessionGeneration = state.sessionGeneration;
  elements.issueHistoryList.innerHTML = '<div class="snapshot-loading"><div class="spinner spinner-sm"></div><span>Loading your reports…</span></div>';
  try {
    const issues = await api.getMyIssues();
    if (!isCurrentUserSession(sessionGeneration, userId)) return false;
    state.userIssues = issues;
    renderIssueHistory();
    return true;
  } catch (error) {
    if (!isCurrentUserSession(sessionGeneration, userId)) return false;
    renderErrorState(
      elements.issueHistoryList,
      'We could not load your reports.',
      getStudentErrorMessage(error, 'Try again to reload your issue reports.'),
      () => loadMyIssues(),
      { compact: true }
    );
    return false;
  }
}

function closeIssueModal() {
  closeManagedModal(elements.issueModalBackdrop);
  state.selectedResourceForIssue = null;
  state.issueModalView = 'FORM';
}

async function handleIssueSubmit(e) {
  e.preventDefault();
  const description = elements.issueDescription.value.trim();
  if (!description) {
    setIssueDescriptionError('Enter a short description of the issue.');
    elements.issueDescription.focus();
    return;
  }
  if (description.length > 500) {
    setIssueDescriptionError('Keep the description to 500 characters or fewer.');
    elements.issueDescription.focus();
    return;
  }
  setIssueDescriptionError('');

  const resource = state.selectedResourceForIssue;
  if (!resource) return;
  const userId = state.currentUser?.id;
  const sessionGeneration = state.sessionGeneration;

  try {
    elements.submitIssueBtn.disabled = true;
    const reportedIssue = await api.reportIssue({
      resourceId: resource.id,
      reporterUserId: userId,
      description
    });
    if (!isCurrentUserSession(sessionGeneration, userId)) return;
    state.userIssues = [reportedIssue, ...state.userIssues.filter((issue) =>
      issue.issueId !== reportedIssue.issueId)];
    elements.issueSuccessResource.textContent = `${resource.name} · Reported ${reportedIssue.reportedTime ? formatDateTime(reportedIssue.reportedTime) : 'just now'}`;
    showIssueModalView('SUCCESS');
    requestAnimationFrame(() => elements.issueSuccessBackBtn.focus());
  } catch (err) {
    if (!isCurrentUserSession(sessionGeneration, userId)) return;
    showToast('Report failed', getStudentErrorMessage(err, 'We could not submit this issue report. Try again.'), err.status === 409 ? 'warning' : 'error');
  } finally {
    if (isCurrentUserSession(sessionGeneration, userId)) elements.submitIssueBtn.disabled = false;
  }
}

function setAdminRowBusy(actionButton, busy) {
  const row = actionButton?.closest('tr');
  if (!row) return;
  row.setAttribute('aria-busy', busy ? 'true' : 'false');
  row.querySelectorAll('button').forEach((button) => {
    if (busy) {
      button.dataset.previousLabel = button.textContent;
      button.disabled = true;
    } else {
      button.disabled = false;
      if (button.dataset.previousLabel) {
        button.textContent = button.dataset.previousLabel;
        delete button.dataset.previousLabel;
      }
    }
  });
  if (busy && actionButton) actionButton.textContent = 'Saving…';
}

async function handleApproveIssue(issue, actionButton) {
  const confirmed = await showConfirmDialog({
    title: 'Approve this issue report?',
    message: `${issue.resourceName} will be placed into maintenance while the issue is investigated.`,
    confirmLabel: 'Approve issue',
    cancelLabel: 'Review later',
    tone: 'warning',
    icon: '!'
  });
  if (!confirmed) return;

  setAdminRowBusy(actionButton, true);
  try {
    await api.approveIssue(issue.issueId);
    setAdminFeedback(`Issue report approved. ${issue.resourceName} is in maintenance while it is investigated.`, 'success');
    await loadAllData();
  } catch (err) {
    if (adminActionFailed(err, 'We could not update this issue. Try again.')) await loadAllData();
  } finally {
    setAdminRowBusy(actionButton, false);
  }
}

async function handleRejectIssue(issue, actionButton) {
  const confirmed = await showConfirmDialog({
    title: 'Reject this issue report?',
    message: `The report for ${issue.resourceName} will be closed without changing its maintenance status.`,
    confirmLabel: 'Reject report',
    cancelLabel: 'Keep report',
    tone: 'danger'
  });
  if (!confirmed) return;

  setAdminRowBusy(actionButton, true);
  try {
    await api.rejectIssue(issue.issueId);
    setAdminFeedback(`Issue report for ${issue.resourceName} was rejected. Resource status was unchanged.`, 'success');
    await loadAllData();
  } catch (err) {
    if (adminActionFailed(err, 'We could not update this issue. Try again.')) await loadAllData();
  } finally {
    setAdminRowBusy(actionButton, false);
  }
}

async function handleResolveIssue(issue, actionButton) {
  const confirmed = await showConfirmDialog({
    title: 'Mark this issue resolved?',
    message: `This closes the issue report. The resource may return to operational if no other open issue or manual maintenance remains.`,
    confirmLabel: 'Mark resolved',
    cancelLabel: 'Not yet',
    tone: 'primary',
    icon: '✓'
  });
  if (!confirmed) return;

  setAdminRowBusy(actionButton, true);
  try {
    await api.resolveIssue(issue.issueId);
    setAdminFeedback(`Issue report for ${issue.resourceName} was marked resolved.`, 'success');
    await loadAllData();
  } catch (err) {
    if (adminActionFailed(err, 'We could not update this issue. Try again.')) await loadAllData();
  } finally {
    setAdminRowBusy(actionButton, false);
  }
}

// Admin Approvals
async function handleAdminApprove(bookingId, actionButton) {
  const confirmed = await showConfirmDialog({
    title: 'Approve this booking?',
    message: `Booking #${bookingId} will become confirmed for the requested time.`,
    confirmLabel: 'Approve booking',
    cancelLabel: 'Review later',
    tone: 'primary',
    icon: '✓'
  });
  if (!confirmed) return;

  setAdminRowBusy(actionButton, true);
  try {
    await api.approveBooking(bookingId);
    setAdminFeedback(`Booking #${bookingId} is confirmed.`, 'success');
    await loadAllData();
  } catch (err) {
    if (adminActionFailed(err, 'We could not update this booking request. Try again.')) await loadAllData();
  } finally {
    setAdminRowBusy(actionButton, false);
  }
}

async function handleAdminReject(bookingId, actionButton) {
  const confirmed = await showConfirmDialog({
    title: 'Reject this booking?',
    message: `Booking #${bookingId} will be declined and its requested time released.`,
    confirmLabel: 'Reject booking',
    cancelLabel: 'Keep pending',
    tone: 'danger'
  });
  if (!confirmed) return;

  setAdminRowBusy(actionButton, true);
  try {
    await api.rejectBooking(bookingId);
    setAdminFeedback(`Booking #${bookingId} was rejected. Its time was released for any eligible exact-slot Waitlist offer.`, 'success');
    await loadAllData();
  } catch (err) {
    if (adminActionFailed(err, 'We could not update this booking request. Try again.')) await loadAllData();
  } finally {
    setAdminRowBusy(actionButton, false);
  }
}

async function handleAdminApproveKit(kitBooking, actionButton) {
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

  setAdminRowBusy(actionButton, true);
  try {
    await api.approveKitBooking(kitBooking.id);
    setAdminFeedback(`${reference} was confirmed as one Project Kit reservation.`, 'success');
    await loadAllData();
  } catch (err) {
    if (adminActionFailed(err, 'We could not update this Project Kit request. Try again.')) await loadAllData();
  } finally {
    setAdminRowBusy(actionButton, false);
  }
}

async function handleAdminRejectKit(kitBooking, actionButton) {
  const reference = kitBooking.bookingReference || `Kit #${kitBooking.id}`;
  const confirmed = await showConfirmDialog({
    title: 'Reject this Project Kit reservation?',
    message: `${reference} · ${kitBooking.kitName || 'Project Kit'} will be declined as one parent request. Its included resource slots will be released and may create exact-slot Waitlist offers.`,
    confirmLabel: 'Reject Project Kit',
    cancelLabel: 'Keep pending',
    tone: 'danger'
  });
  if (!confirmed) return;

  setAdminRowBusy(actionButton, true);
  try {
    await api.rejectKitBooking(kitBooking.id);
    setAdminFeedback(`${reference} was rejected as one Project Kit request. Its resource slots were released.`, 'success');
    await loadAllData();
  } catch (err) {
    if (adminActionFailed(err, 'We could not update this Project Kit request. Try again.')) await loadAllData();
  } finally {
    setAdminRowBusy(actionButton, false);
  }
}

async function handleAdminCancelReservation(item, actionButton) {
  const isKit = item.kind === 'KIT';
  const record = item.data;
  const reference = isKit
    ? (record.bookingReference || `Kit #${record.id}`)
    : `Booking #${record.bookingId}`;
  const name = isKit ? (record.kitName || 'Project Kit') : (record.resourceName || 'reservation');
  const confirmed = await showConfirmDialog({
    title: 'Cancel this reservation?',
    message: isKit
      ? `${reference} · ${name} will be cancelled as one parent reservation. Included resource slots will be released, and eligible exact-slot Waitlist offers may be made.`
      : `${reference} · ${name} will be cancelled. Its time will be released, and an eligible exact-slot Waitlist offer may be made.`,
    confirmLabel: 'Cancel reservation',
    cancelLabel: 'Keep reservation',
    tone: 'danger'
  });
  if (!confirmed) return;

  setAdminRowBusy(actionButton, true);
  try {
    if (isKit) await api.cancelKitBooking(record.id);
    else await api.cancelBooking(record.bookingId);
    setAdminFeedback(`${reference} was cancelled. The released time is available for eligible exact-slot Waitlist offers.`, 'success');
    await loadAllData();
  } catch (err) {
    if (adminActionFailed(err, 'We could not cancel this reservation. Try again.')) await loadAllData();
  } finally {
    setAdminRowBusy(actionButton, false);
  }
}

// Admin Resource Management
function openAddResourceModal() {
  elements.addResourceForm.reset();
  elements.addResourceFormError.hidden = true;
  elements.addResourceFormError.textContent = '';
  setResourceFieldError(elements.newResourceName, elements.newResourceNameError, '');
  setResourceFieldError(elements.newResourceCapacity, elements.newResourceCapacityError, '');
  updateResourceCapacityVisibility();
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

  setResourceFieldError(elements.newResourceName, elements.newResourceNameError, '');
  setResourceFieldError(elements.newResourceCapacity, elements.newResourceCapacityError, '');
  elements.addResourceFormError.hidden = true;
  elements.addResourceFormError.textContent = '';
  if (!name) {
    setResourceFieldError(elements.newResourceName, elements.newResourceNameError, 'Enter a resource name.');
    elements.newResourceName.focus();
    return;
  }

  const capacity = type === 'EQUIPMENT' || !capacityText ? null : Number(capacityText);
  if (capacity !== null && (!Number.isInteger(capacity) || capacity < 1)) {
    setResourceFieldError(elements.newResourceCapacity, elements.newResourceCapacityError, 'Enter a positive whole number for capacity.');
    elements.newResourceCapacity.focus();
    return;
  }

  const payload = { name, type, status, description, location: location || null, capacity };
  const submitButton = document.getElementById('submitAddResourceBtn');
  submitButton.disabled = true;
  submitButton.textContent = 'Adding…';

  try {
    await api.createResource(payload);
    closeAddResourceModal();
    setAdminFeedback(`${name} was added to the resource inventory.`, 'success');
    await loadAllData();
  } catch (err) {
    const message = err?.status === 409
      ? 'A resource with this name or configuration already exists.'
      : err?.status === 400
        ? 'Check the resource details and capacity values, then try again.'
        : getAdminErrorMessage(err, 'We could not add this resource. Try again.');
    elements.addResourceFormError.textContent = message;
    elements.addResourceFormError.hidden = false;
    if (err?.status === 409) {
      setResourceFieldError(elements.newResourceName, elements.newResourceNameError, 'Choose a different resource name.');
      elements.newResourceName.focus();
    }
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Add resource';
  }
}

function setResourceFieldError(input, errorElement, message) {
  if (!input || !errorElement) return;
  errorElement.textContent = message;
  errorElement.hidden = !message;
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
}

function updateResourceCapacityVisibility() {
  const isEquipment = elements.newResourceType.value === 'EQUIPMENT';
  elements.newResourceCapacityGroup.hidden = isEquipment;
  elements.newResourceCapacity.disabled = isEquipment;
  if (isEquipment) elements.newResourceCapacity.value = '';
  setResourceFieldError(elements.newResourceCapacity, elements.newResourceCapacityError, '');
}

async function handleToggleResourceStatus(resource, newStatus, actionButton) {
  const isMaintenance = newStatus === 'MAINTENANCE';
  const confirmed = await showConfirmDialog({
    title: isMaintenance ? 'Mark this resource as maintenance?' : 'Return this resource to operational?',
    message: isMaintenance
      ? `${resource.name} will be unavailable for new bookings. Project Kits that include it will show as not ready; existing reservations will not be cancelled.`
      : `${resource.name} will be available for new bookings again. Project Kit readiness will refresh with the resource status.`,
    confirmLabel: isMaintenance ? 'Mark as maintenance' : 'Return to operational',
    cancelLabel: 'Keep current status',
    tone: isMaintenance ? 'warning' : 'primary',
    icon: isMaintenance ? '!' : '✓'
  });
  if (!confirmed) return;

  setAdminRowBusy(actionButton, true);
  try {
    await api.patchResourceStatus(resource.id, newStatus);
    setAdminFeedback(`${resource.name} is now ${getResourceStatusLabel(newStatus).toLowerCase()}. Project Kit readiness has been refreshed.`, 'success');
    await loadAllData();
  } catch (err) {
    if (adminActionFailed(err, 'We could not change the resource status. Try again.')) await loadAllData();
  } finally {
    setAdminRowBusy(actionButton, false);
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
    setAdminFeedback(`Resource ${resourceName} was removed from the catalogue.`, 'success');
    await loadAllData();
  } catch (err) {
    if (err?.status === 409) {
      setAdminFeedback('This resource is part of a Project Kit or has booking history, so it cannot be deleted.', 'warning');
    } else if (adminActionFailed(err, 'We could not delete this resource. Try again.')) {
      await loadAllData();
    }
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
      if (adminRouteLink.dataset.adminTarget) {
        window.setTimeout(() => document.getElementById(adminRouteLink.dataset.adminTarget)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
      }
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
    renderMyBookings();
  });

  elements.myBookingsSuccessViewBtn?.addEventListener('click', () => {
    if (state.myBookingsSuccess?.view) {
      state.bookingView = state.myBookingsSuccess.view;
      renderMyBookings();
    }
    elements.myBookingsList.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  elements.myBookingsSuccessDismissBtn?.addEventListener('click', () => {
    state.myBookingsSuccess = null;
    renderMyBookingsSuccess();
  });

  // Resource-first contextual detail and availability pages.
  elements.resourceDetailBackBtn.addEventListener('click', () =>
    switchTab('browse', { navKey: 'resources' })
  );
  elements.availabilityPageBackBtn.addEventListener('click', closeBookingModal);
  elements.cancelBookingModalBtn.addEventListener('click', closeBookingModal);
  elements.closeBookingSuccessBtn.addEventListener('click', closeBookingModal);
  elements.viewBookingsFromSuccessBtn.addEventListener('click', () => {
    state.bookingView = 'UPCOMING';
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
    elements.timeFirstResultsSection.hidden = false;
    document.getElementById('timeFirstResultsTitle').focus();
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
  elements.timeFirstViewBookingsBtn.addEventListener('click', () => {
    state.bookingView = 'UPCOMING';
    switchTab('my-bookings', { navKey: 'bookings' });
  });
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
  elements.newResourceType.addEventListener('change', updateResourceCapacityVisibility);
  elements.newResourceName.addEventListener('input', () => {
    setResourceFieldError(elements.newResourceName, elements.newResourceNameError, '');
    elements.addResourceFormError.hidden = true;
  });
  elements.newResourceCapacity.addEventListener('input', () =>
    setResourceFieldError(elements.newResourceCapacity, elements.newResourceCapacityError, '')
  );
  elements.dismissAdminFeedbackBtn.addEventListener('click', clearAdminFeedback);

  // Issue Report Modal
  elements.closeIssueModalBtn.addEventListener('click', closeIssueModal);
  elements.cancelIssueModalBtn.addEventListener('click', closeIssueModal);
  elements.issueForm.addEventListener('submit', handleIssueSubmit);
  elements.issueDescription.addEventListener('input', () => {
    updateIssueDescriptionCount();
    if (elements.issueDescription.value.trim()) setIssueDescriptionError('');
  });
  elements.issueSuccessBackBtn.addEventListener('click', closeIssueModal);
  elements.issueHistoryBackBtn.addEventListener('click', closeIssueModal);
  elements.issueSuccessHistoryBtn.addEventListener('click', () => {
    showIssueModalView('HISTORY');
    loadMyIssues().then(() => requestAnimationFrame(() => elements.issueHistoryTitle.focus()));
  });
  elements.issueHistoryReportBtn.addEventListener('click', () => {
    elements.issueDescription.value = '';
    updateIssueDescriptionCount();
    setIssueDescriptionError('');
    showIssueModalView('FORM');
    requestAnimationFrame(() => elements.issueDescription.focus());
  });

  // Close on backdrop click and keep keyboard or programmatic focus within an active modal.
  window.addEventListener('click', (e) => {
    if (modalState.active && e.target === modalState.active) closeActiveModal();
  });

  window.addEventListener('focusout', handleModalFocusOut, true);
  window.addEventListener('focusin', handleModalFocusIn, true);
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
