import api, { setAuthToken } from './api';
import axios from 'axios';
import { encodeFormData } from '../utils/formEncoder';
import { debugLog } from '../utils/helpers';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Register user
export const register = async (userData) => {
  debugLog("Sending registration request with data:", { ...userData, password: '[REDACTED]' });

  try {
    // Direct Axios request to bypass custom instance for troubleshooting
    const response = await axios.post(`${API_URL}/auth/register`, userData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000
    });

    debugLog("Registration successful:", response.data);
    return response.data;
  } catch (error) {
    debugLog("Registration error:", error);

    // Improved error handling with details
    if (error.response) {
      debugLog("Error response data:", error.response.data);
      debugLog("Error response status:", error.response.status);
      debugLog("Error response headers:", error.response.headers);
    } else if (error.request) {
      debugLog("Error request:", error.request);
    } else {
      debugLog("Error message:", error.message);
    }

    // Rethrow the error with more context
    const enhancedError = new Error(error.response?.data?.detail || error.message);
    enhancedError.response = error.response;
    enhancedError.request = error.request;
    throw enhancedError;
  }
};

// Login user
export const login = async (email, password) => {
  debugLog("Attempting login for:", email);

  try {
    // Format data for OAuth2
    const formData = {
      username: email,  // OAuth2 uses username field for email
      password: password
    };

    // URL encode the form data
    const encodedFormData = encodeFormData(formData);

    debugLog("Encoded form data:", encodedFormData);

    // Direct Axios request with URL encoded form data
    const response = await axios.post(`${API_URL}/auth/login`, encodedFormData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 60000
    });

    debugLog("Login response:", response.data);

    const { access_token, token_type } = response.data;

    // Set token to Auth header
    setAuthToken(access_token);

    // Get current user info using our configured API instance
    const userResponse = await api.get('/users/me');
    const user = userResponse.data;

    // Save user to local storage
    localStorage.setItem('user', JSON.stringify(user));

    return { token: access_token, user };
  } catch (error) {
    debugLog("Login error:", error);

    // Improved error handling with details
    if (error.response) {
      debugLog("Error response data:", error.response.data);
      debugLog("Error response status:", error.response.status);
      debugLog("Error response headers:", error.response.headers);
    } else if (error.request) {
      debugLog("Error request:", error.request);
    } else {
      debugLog("Error message:", error.message);
    }

    // Rethrow the error with more context
    const enhancedError = new Error(error.response?.data?.detail || error.message);
    enhancedError.response = error.response;
    enhancedError.request = error.request;
    throw enhancedError;
  }
};

// Logout user
export const logout = () => {
  debugLog("Logging out user");

  // Remove token from Auth header
  setAuthToken(null);

  // Remove user from local storage
  localStorage.removeItem('user');
};

// Verify email
export const verifyEmail = async (token) => {
  try {
    debugLog("Verifying email with token:", token.slice(0, 10) + "...");
    const response = await axios.post(`${API_URL}/auth/verify-email`, { token });
    debugLog("Email verification response:", response.data);
    return response.data;
  } catch (error) {
    debugLog("Email verification error:", error);
    throw error;
  }
};

// Request password reset
export const requestPasswordReset = async (email) => {
  try {
    debugLog("Requesting password reset for:", email);
    const response = await axios.post(`${API_URL}/auth/password-reset`, { email });
    debugLog("Password reset request response:", response.data);
    return response.data;
  } catch (error) {
    debugLog("Password reset request error:", error);
    throw error;
  }
};

// Reset password
export const resetPassword = async (token, password, confirm_password) => {
  try {
    debugLog("Resetting password with token:", token.slice(0, 10) + "...");
    const response = await axios.post(`${API_URL}/auth/password-reset/confirm`, {
      token,
      password,
      confirm_password,
    });
    debugLog("Password reset response:", response.data);
    return response.data;
  } catch (error) {
    debugLog("Password reset error:", error);
    throw error;
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('access_token');
  const user = localStorage.getItem('user');

  return !!token && !!user;
};

// Get current user from local storage
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};