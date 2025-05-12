import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService, profileService } from '../services';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Create Auth Context
const AuthContext = createContext();

// Auth Provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper: fetch Firestore profile and merge into user
  const fetchAndMergeProfile = async (firebaseUser) => {
    try {
      const profile = await profileService.getCurrentUserProfile();
      setUser({
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        uid: firebaseUser.uid,
        profile, // includes profile_image
      });
      localStorage.setItem('user', JSON.stringify({
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        uid: firebaseUser.uid,
        profile,
      }));
    } catch (e) {
      setUser({
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        uid: firebaseUser.uid,
      });
      localStorage.setItem('user', JSON.stringify({
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        uid: firebaseUser.uid,
      }));
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        fetchAndMergeProfile(firebaseUser);
      } else {
        setUser(null);
        localStorage.removeItem('user');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Login function
  const handleLogin = async (email, password) => {
    try {
      setLoading(true);
      const result = await authService.login(email, password);
      await fetchAndMergeProfile(result.user);
      return result;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const handleRegister = async (userData) => {
    try {
      setLoading(true);
      const result = await authService.register(userData);
      await fetchAndMergeProfile(result.user);
      return result;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const handleLogout = async () => {
    try {
      console.log('Logging out user');
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  // Update user data
  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  // Context value
  const authContextValue = {
    user,
    isAuthenticated: !!user,
    loading,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default AuthContext;