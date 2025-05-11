/**
 * Application constants
 */

// API related constants
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001/api';
export const API_TIMEOUT = 30000; // 30 seconds
export const TOKEN_KEY = 'access_token';
export const USER_KEY = 'user';

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',
  PROFILE: '/profile',
  EDIT_PROFILE: '/profile/edit',
  USER_PROFILE: '/users/:userId',
  NETWORK: '/network',
  JOBS: '/jobs',
  JOB_DETAIL: '/jobs/:jobId',
  CREATE_JOB: '/jobs/create',
  EDIT_JOB: '/jobs/edit/:jobId',
  MY_JOBS: '/jobs/my-jobs',
  SAVED_JOBS: '/jobs/saved',
  APPLICATIONS: '/applications',
  NOTIFICATIONS: '/notifications',
  POST_DETAIL: '/posts/:postId',
  TEST_API: '/test-api'
};

// UI constants
export const BREAKPOINTS = {
  MOBILE: 480,
  TABLET: 768,
  DESKTOP: 1024,
  LARGE_DESKTOP: 1200
};

// Form validation constants
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_NAME_LENGTH: 100,
  MAX_BIO_LENGTH: 500,
  MAX_HEADLINE_LENGTH: 100,
  EMAIL_REGEX: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
};

// User roles
export const USER_ROLES = {
  USER: 'user',
  EMPLOYER: 'employer',
  ADMIN: 'admin'
};

// Job types
export const JOB_TYPES = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'temporary', label: 'Temporary' },
  { value: 'internship', label: 'Internship' }
];

// Application statuses
export const APPLICATION_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'accepted', label: 'Accepted' }
];

// Connection statuses
export const CONNECTION_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Connected' },
  { value: 'rejected', label: 'Rejected' }
];

// Notification types
export const NOTIFICATION_TYPES = {
  CONNECTION_REQUEST: 'connection_request',
  CONNECTION_ACCEPTED: 'connection_accepted',
  POST_LIKE: 'post_like',
  COMMENT: 'comment',
  NEW_POST: 'new_post',
  JOB_APPLICATION: 'job_application',
  APPLICATION_STATUS: 'application_status'
};

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'access_token',
  USER: 'user',
  THEME: 'theme'
};

// Theme options
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
};

// Date formats
export const DATE_FORMATS = {
  DEFAULT: 'MMM dd, yyyy',
  SHORT: 'MM/dd/yyyy',
  WITH_TIME: 'MMM dd, yyyy HH:mm',
  MONTH_YEAR: 'MMM yyyy'
};

// Default pagination
export const DEFAULT_PAGINATION = {
  LIMIT: 20,
  INITIAL_PAGE: 1
};

// API Error messages
export const API_ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect to server. Please check your internet connection.',
  UNAUTHORIZED: 'Your session has expired. Please log in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  INTERNAL_SERVER: 'An unexpected error occurred. Please try again later.',
  DEFAULT: 'Something went wrong. Please try again.'
};

// Debug settings
export const DEBUG = {
  ENABLED: process.env.NODE_ENV === 'development',
  LOG_API_CALLS: true,
  LOG_REDUX_ACTIONS: true
};