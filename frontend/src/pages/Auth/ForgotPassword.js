import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError('Email is required');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email is invalid');
      return;
    }

    setError('');

    try {
      setLoading(true);
      await authService.requestPasswordReset({ email });
      setRequestSent(true);
    } catch (error) {
      console.error('Password reset request failed:', error);
      // Don't show specific errors to avoid account enumeration
      // Just pretend it worked even if the email doesn't exist
      setRequestSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (requestSent) {
    return (
      <div className="auth-page forgot-password-page">
        <h2 className="auth-title">Check Your Email</h2>
        <div className="email-sent-message">
          <p>
            If an account exists for <strong>{email}</strong>, we've sent password reset instructions to that email address.
          </p>
          <p>
            Please check your email (including your spam folder) and follow the instructions to reset your password.
          </p>
          <Link to="/login" className="auth-button">
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page forgot-password-page">
      <h2 className="auth-title">Forgot Password</h2>
      <p className="auth-subtitle">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className={error ? 'error' : ''}
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          className="auth-button"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Reset Password'}
        </button>
      </form>

      <p className="auth-footer">
        Remember your password? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
};

export default ForgotPassword;