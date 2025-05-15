import { auth, googleProvider } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, signInWithPopup } from 'firebase/auth';
import { encodeFormData } from '../utils/formEncoder';
import { debugLog } from '../utils/helpers';
import api, { setAuthToken } from './api';
import axios from 'axios';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { USER_ROLES } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001/api';

// Register user
export const register = async (userData) => {
  const { email, password, first_name, last_name, role = USER_ROLES.USER, company_name = '' } = userData;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update user profile with first and last name
    await updateProfile(userCredential.user, {
      displayName: `${first_name} ${last_name}`
    });

    // Prepare user data with basic fields
    const userDataForFirestore = {
      name: `${first_name} ${last_name}`,
      email: userCredential.user.email,
      role,
      createdAt: new Date().toISOString(),
      profile: {
        profile_image: '',
        cover_image: '',
        about: ''
      },
      profile_image: '',
      cover_image: '',
      headline: '',
      location: '',
      bio: '',
      connections: [],
      sentFriendRequests: [],
      friendRequests: [],
      experience: [],
      education: [],
      skill: [],
      activity: [],
      interest: []
    };
    
    // Add company_name field for employers
    if (role === USER_ROLES.EMPLOYER && company_name) {
      userDataForFirestore.company_name = company_name;
    }

    // Create user document in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), userDataForFirestore);

    // Save user to local storage
    const userDataForLocalStorage = {
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
      uid: userCredential.user.uid,
      role
    };
    
    // Include company name in local storage for employers
    if (role === USER_ROLES.EMPLOYER && company_name) {
      userDataForLocalStorage.company_name = company_name;
    }
    
    localStorage.setItem('user', JSON.stringify(userDataForLocalStorage));

    return { user: userCredential.user };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Google Auth Sign-in/Sign-up
export const signInWithGoogle = async (role = USER_ROLES.USER) => {
  try {
    // Configure Google to request a user account selection
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user already exists in Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      // This is a new user, create their profile in Firestore
      // Extract name parts
      const displayName = user.displayName || '';
      const nameParts = displayName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Create new user document
      const userDataForFirestore = {
        name: displayName,
        email: user.email,
        role,
        createdAt: new Date().toISOString(),
        profile: {
          profile_image: user.photoURL || '',
          cover_image: '',
          about: ''
        },
        profile_image: user.photoURL || '',
        cover_image: '',
        headline: '',
        location: '',
        bio: '',
        connections: [],
        sentFriendRequests: [],
        friendRequests: [],
        experience: [],
        education: [],
        skill: [],
        activity: [],
        interest: []
      };
      
      await setDoc(doc(db, 'users', user.uid), userDataForFirestore);
    }
    
    // Save user to local storage
    const userDataForLocalStorage = {
      email: user.email,
      displayName: user.displayName,
      uid: user.uid,
      profile_image: user.photoURL,
      role: userDoc.exists() ? userDoc.data().role : role // Use existing role if user exists
    };
    
    localStorage.setItem('user', JSON.stringify(userDataForLocalStorage));
    
    return { user };
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
};

// Login user
export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // We'll get the role from Firestore in the AuthContext
    // through fetchAndMergeProfile
    
    return { user: userCredential.user };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Logout user
export const logout = async () => {
  try {
    await signOut(auth);
    localStorage.removeItem('user');
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
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