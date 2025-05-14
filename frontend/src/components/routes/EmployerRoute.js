import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const EmployerRoute = ({ children }) => {
  const { isAuthenticated, isEmployer, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated()) {
    return <Navigate to="/auth/login" />;
  }

  return isEmployer() ? children : <Navigate to="/jobs" />;
};

export default EmployerRoute; 