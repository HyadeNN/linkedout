import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const AuthLayout = ({ children }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="auth-layout">
      <div className="auth-header">
        <div className="logo">
          <Link to="/">
            <h1>LinkedOut</h1>
          </Link>
        </div>

        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>

      <div className="auth-container">
        <div className="auth-content">
          {children}
        </div>

        <div className="auth-info">
          <h2>Join our professional community</h2>
          <p>Connect with professionals, find jobs, and build your career with LinkedOut.</p>
        </div>
      </div>

      <div className="auth-footer">
        <p>&copy; {new Date().getFullYear()} LinkedOut. All rights reserved.</p>
        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Help</a>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;