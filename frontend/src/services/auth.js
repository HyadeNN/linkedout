import api, { setAuthToken } from './api';
import axios from 'axios';
import { encodeFormData } from '../utils/formEncoder';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Register user
export const register = async (userData) => {
  console.log("Sending registration request with data:", userData);

  try {
    // Test direct Axios request to bypass our custom instance
    const response = await axios.post(`${API_URL}/auth/register`, userData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000
    });

    console.log("Registration successful:", response.data);
    return response.data;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

// Login user
export const login = async (email, password) => {
  console.log("Attempting login for:", email);

  try {
    // Format data for OAuth2
    const formData = {
      username: email,  // OAuth2 uses username field for email
      password: password
    };

    // URL encode the form data
    const encodedFormData = encodeFormData(formData);

    // Test direct Axios request with URL encoded form data
    const response = await axios.post(`${API_URL}/auth/login`, encodedFormData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 60000
    });

    console.log("Login response:", response.data);

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
    console.error("Login error:", error);
    throw error;
  }
};

// Logout user
export const logout = () => {
  // Remove token from Auth header
  setAuthToken(null);

  // Remove user from local storage
  localStorage.removeItem('user');
};

// Verify email
export const verifyEmail = async (token) => {
  try {
    const response = await axios.post(`${API_URL}/auth/verify-email`, { token });
    return response.data;
  } catch (error) {
    console.error("Email verification error:", error);
    throw error;
  }
};

// Request password reset
export const requestPasswordReset = async (email) => {
  try {
    const response = await axios.post(`${API_URL}/auth/password-reset`, { email });
    return response.data;
  } catch (error) {
    console.error("Password reset request error:", error);
    throw error;
  }
};

// Reset password
export const resetPassword = async (token, password, confirm_password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/password-reset/confirm`, {
      token,
      password,
      confirm_password,
    });
    return response.data;
  } catch (error) {
    console.error("Password reset error:", error);
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