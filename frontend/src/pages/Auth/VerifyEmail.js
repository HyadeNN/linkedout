import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services';

const VerifyEmail = () => {
  const [verificationStatus, setVerificationStatus] = useState('verifying'); // verifying, success, error
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const verifyEmail = async () => {
      // Get token from URL parameters
      const queryParams = new URLSearchParams(location.search);
      const token = queryParams.get('token');

      if (!token) {
        setVerificationStatus('error');
        setError('Verification token is missing. Please check your email link.');
        return;
      }

      try {
        await authService.verifyEmail({ token });
        setVerificationStatus('success');
      } catch (error) {
        console.error('Email verification failed:', error);
        setVerificationStatus('error');

        if (error.response && error.response.data) {
          setError(error.response.data.detail || 'Email verification failed. Please try again.');
        } else {
          setError('Email verification failed. Please try again.');
        }
      }
    };

    verifyEmail();
  }, [location]);

  const renderContent = () => {
    switch (verificationStatus) {
      case 'verifying':
        return (
          <div className="verification-verifying">
            <div className="spinner"></div>
            <p>Verifying your email address...</p>
          </div>
        );

      case 'success':
        return (
          <div className="verification-success">
            <div className="success-icon">✓</div>
            <h3>Email Verified Successfully!</h3>
            <p>Your email has been verified. You can now sign in to your account.</p>
            <button
              className="auth-button"
              onClick={() => navigate('/login')}
            >
              Sign In
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="verification-error">
            <div className="error-icon">✗</div>
            <h3>Verification Failed</h3>
            <p>{error}</p>
            <p>
              If you're having trouble verifying your email, please request a new verification link or contact support.
            </p>
            <Link to="/login" className="auth-button">
              Back to Sign In
            </Link>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="auth-page verify-email-page">
      <h2 className="auth-title">Email Verification</h2>
      {renderContent()}
    </div>
  );
};

export default VerifyEmail;