import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NotFound = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <h1 className="not-found-title">404</h1>
        <h2 className="not-found-subtitle">Page Not Found</h2>
        <p className="not-found-text">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="not-found-actions">
          <Link to={isAuthenticated ? '/' : '/auth/login'} className="primary-button">
            {isAuthenticated ? 'Go Home' : 'Sign In'}
          </Link>
          {!isAuthenticated && (
            <Link to="/auth/register" className="secondary-button">
              Join LinkedOut
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotFound;