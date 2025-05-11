import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001/api';
console.log(`API URL set to: ${API_URL}`);

// Create axios instance with extended timeout
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add request interceptor to add auth token and debug info
api.interceptors.request.use(
  (config) => {
    // Add timestamp to each request for debugging
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Making ${config.method.toUpperCase()} request to: ${config.baseURL}${config.url}`);

    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`[${timestamp}] Including auth token in request`);
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors and token refresh
api.interceptors.response.use(
  (response) => {
    console.log(`Response received from ${response.config.url} with status ${response.status}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    console.error('Response error:', {
      url: originalRequest?.url || 'unknown URL',
      method: originalRequest?.method || 'unknown method',
      status: error.response?.status || 'no status',
      statusText: error.response?.statusText || 'no status text',
      message: error.message,
      data: error.response?.data || 'no data'
    });

    // If we get a 401 error and we haven't already tried to refresh the token
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // For now, just redirect to login since we don't have refresh token implemented
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');

      if (window.location.pathname !== '/auth/login' &&
          window.location.pathname !== '/auth/register' &&
          !window.location.pathname.startsWith('/auth/') &&
          !window.location.pathname.startsWith('/test-api')) {
        window.location.href = '/auth/login';
      }

      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export const setAuthToken = (token) => {
  if (token) {
    console.log('Setting auth token in axios defaults');
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('access_token', token);
  } else {
    console.log('Removing auth token from axios defaults');
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('access_token');
  }
};

export const getFormData = (data) => {
  const formData = new FormData();

  Object.keys(data).forEach(key => {
    if (data[key] !== undefined && data[key] !== null) {
      if (data[key] instanceof File) {
        formData.append(key, data[key]);
      } else if (typeof data[key] === 'object' && !(data[key] instanceof File)) {
        formData.append(key, JSON.stringify(data[key]));
      } else {
        formData.append(key, data[key]);
      }
    }
  });

  return formData;
};

// Test function to check if API is reachable
export const testApiConnection = async () => {
  try {
    const response = await axios.get(`${API_URL.replace('/api', '')}/`);
    console.log('Backend root endpoint reached:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (err) {
    console.error('Backend connection test failed:', err);
    return {
      success: false,
      error: err.message,
      details: {
        status: err.response?.status,
        data: err.response?.data
      }
    };
  }
};

export default api;