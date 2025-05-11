/**
 * General utility helpers for the application
 */

// Format date to a human-readable string
export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Format date range (e.g. for experience or education)
export const formatDateRange = (startDate, endDate, isCurrent = false) => {
  if (!startDate) return '';

  const formattedStart = formatDate(startDate);

  if (isCurrent) {
    return `${formattedStart} - Present`;
  }

  if (endDate) {
    return `${formattedStart} - ${formatDate(endDate)}`;
  }

  return formattedStart;
};

// Truncate text with ellipsis
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Check if an object is empty
export const isEmptyObject = (obj) => {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
};

// Parse URL query parameters
export const getQueryParams = () => {
  const params = new URLSearchParams(window.location.search);
  const result = {};

  for (const [key, value] of params.entries()) {
    result[key] = value;
  }

  return result;
};

// Generate a random ID (for temp IDs)
export const generateId = () => {
  return Math.random().toString(36).substring(2, 11);
};

// Debug logger that only logs in development
export const debugLog = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

// Create a debounce function to limit function calls
export const debounce = (func, delay) => {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

// Get the file extension from a filename
export const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

// Deep clone an object
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Check if the device is mobile
export const isMobile = () => {
  return window.innerWidth <= 768;
};

// Check if the connection is online
export const isOnline = () => {
  return navigator.onLine;
};

// Network status detector
export const createNetworkStatusDetector = (onOnline, onOffline) => {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
};

// Check for API connection and log details
export const checkApiConnection = async (url, options = {}) => {
  try {
    const start = Date.now();
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-cache',
      ...options
    });
    const end = Date.now();

    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      latency: end - start,
      headers: Object.fromEntries([...response.headers.entries()])
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};