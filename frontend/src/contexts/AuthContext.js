import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Create Auth Context
const AuthContext = createContext();

// Auth Provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        const userData = {
          email: user.email,
          displayName: user.displayName,
          uid: user.uid
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        // User is signed out
        setUser(null);
        localStorage.removeItem('user');
      }
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Login function
  const handleLogin = async (email, password) => {
    try {
      console.log('Attempting login for:', email);
      setLoading(true);
      const result = await authService.login(email, password);
      console.log('Login successful:', result);
      setUser(result.user);
      return result;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const handleRegister = async (userData) => {
    try {
      console.log('Attempting registration with data:', { ...userData, password: '[REDACTED]' });
      setLoading(true);
      const result = await authService.register(userData);
      console.log('Registration successful:', result);
      return result;
    } catch (error) {
      console.error('Registration failed:', error);
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