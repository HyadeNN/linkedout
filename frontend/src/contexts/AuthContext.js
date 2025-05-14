import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService, profileService } from '../services';
import { auth } from '../firebase';
import { onAuthStateChanged, getAuth } from 'firebase/auth';

// Create Auth Context
const AuthContext = createContext();

// User roles
export const USER_ROLES = {
  USER: 'user',
  EMPLOYER: 'employer',
  ADMIN: 'admin'
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState(null);

  // Helper: fetch Firestore profile and merge into user
  const fetchAndMergeProfile = async (firebaseUser) => {
    try {
      const profile = await profileService.getCurrentUserProfile();
      setUser({
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        uid: firebaseUser.uid,
        role: profile?.role || USER_ROLES.USER, // Default role: normal user
        company_name: profile?.company_name || '', // Include company name
        profile, // includes profile_image
      });
      localStorage.setItem('user', JSON.stringify({
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        uid: firebaseUser.uid,
        role: profile?.role || USER_ROLES.USER,
        company_name: profile?.company_name || '',
        profile,
      }));
    } catch (e) {
      setUser({
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        uid: firebaseUser.uid,
        role: USER_ROLES.USER,
        company_name: '',
      });
      localStorage.setItem('user', JSON.stringify({
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        uid: firebaseUser.uid,
        role: USER_ROLES.USER,
        company_name: '',
      }));
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setFirebaseUser(currentUser);
      
      if (currentUser) {
        fetchAndMergeProfile(currentUser);
      } else {
        setUser(null);
        localStorage.removeItem('user');
        // No automatic redirects here
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Direct check if user is authenticated with Firebase
  const checkFirebaseAuth = () => {
    const currentAuth = getAuth();
    const currentUser = currentAuth.currentUser;
    return !!currentUser;
  };

  // Login
  const login = async (email, password) => {
    const result = await authService.login(email, password);
    return result;
  };

  // Register
  const register = async (userData) => {
    const result = await authService.register(userData);
    return result;
  };

  // Logout
  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setFirebaseUser(null);
      window.location.href = '/auth/login'; // Force redirect after logout only
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Check if user is employer
  const isEmployer = () => {
    return user?.role === USER_ROLES.EMPLOYER;
  };

  // Check if user is admin
  const isAdmin = () => {
    return user?.role === USER_ROLES.ADMIN;
  };

  // Check if user is logged in
  const isAuthenticated = () => {
    return !!user;
  };

  // Update user role
  const updateUserRole = async (role) => {
    if (!user) return false;
    
    try {
      await profileService.updateUserRole(user.uid, role);
      setUser(prev => ({
        ...prev,
        role
      }));
      
      // Update localStorage after update
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (storedUser) {
        localStorage.setItem('user', JSON.stringify({
          ...storedUser,
          role
        }));
      }
      
      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      return false;
    }
  };

  // Value to be provided to consumers
  const value = {
    user,
    firebaseUser,
    login,
    register,
    logout,
    loading,
    isEmployer,
    isAdmin,
    isAuthenticated,
    checkFirebaseAuth,
    updateUserRole,
    USER_ROLES
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using Auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;