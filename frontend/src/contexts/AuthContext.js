import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services';

// Create Auth Context
const AuthContext = createContext();

// Auth Provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on initial render
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get current user from local storage
        const storedUser = authService.getCurrentUser();
        const token = localStorage.getItem('access_token');

        if (storedUser && token) {
          // Verify the token is valid by fetching current user data
          try {
            // This would be an API call to validate the token
            // const userData = await authService.validateToken();
            // For now, just set the user from storage
            setUser(storedUser);
          } catch (validationError) {
            // If token validation fails, log the user out
            console.error('Token validation failed:', validationError);
            handleLogout();
          }
        } else {
          // No user or token in storage
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
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
  const handleLogout = () => {
    console.log('Logging out user');
    authService.logout();
    setUser(null);
  };

  // Update user data
  const updateUser = (userData) => {
    // Make sure to persist to local storage
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