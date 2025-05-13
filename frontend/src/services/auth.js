import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { encodeFormData } from '../utils/formEncoder';
import { debugLog } from '../utils/helpers';
import api, { setAuthToken } from './api';
import axios from 'axios';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001/api';

// Register user
export const register = async (userData) => {
  const { email, password, first_name, last_name } = userData;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Update user profile with first and last name
    await updateProfile(userCredential.user, {
      displayName: `${first_name} ${last_name}`
    });
    // Save user to local storage
    localStorage.setItem('user', JSON.stringify({
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
      uid: userCredential.user.uid
    }));
    // Firestore'a kullanıcıyı kaydet
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      name: `${first_name} ${last_name}`,
      email: userCredential.user.email,
      createdAt: new Date(),
      profile: {
        profile_image: '',
        cover_image: '',
        about: ''
      },
      headline: '',
      location: '',
      bio: '',
      experience: [],
      education: [],
      skill: [],
      activity: [],
      interest: []
    });
    return { user: userCredential.user };
  } catch (error) {
    throw error;
  }
};

// Login user
export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // Save user to local storage
    localStorage.setItem('user', JSON.stringify({
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
      uid: userCredential.user.uid
    }));
    return { user: userCredential.user };
  } catch (error) {
    throw error;
  }
};

// Logout user
export const logout = async () => {
  await signOut(auth);
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