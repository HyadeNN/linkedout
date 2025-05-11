import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get token from URL parameters
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const newErrors = {};
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!token) {
      newErrors.token = 'Reset token is missing';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear previous errors
    setErrors({});

    try {
      setLoading(true);
      await authService.resetPassword(token, password, confirmPassword);
      setResetSuccess(true);
    } catch (error) {
      console.error('Password reset failed:', error);

      if (error.response && error.response.data) {
        if (error.response.data.detail === 'Invalid reset token') {
          setErrors({ token: 'Invalid or expired reset token' });
        } else {
          setErrors({ general: error.response.data.detail || 'Password reset failed. Please try again.' });
        }
      } else {
        setErrors({ general: 'Password reset failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-page reset-password-page">
        <h2 className="auth-title">Reset Password</h2>
        <div className="error-message">
          Reset token is missing. Please check your email link or request a new password reset.
        </div>
        <Link to="/forgot-password" className="auth-button">
          Request New Reset Link
        </Link>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="auth-page reset-password-page">
        <h2 className="auth-title">Password Reset Successful!</h2>
        <p className="auth-subtitle">
          Your password has been successfully reset. You can now sign in with your new password.
        </p>
        <button
          className="auth-button"
          onClick={() => navigate('/login')}
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="auth-page reset-password-page">
      <h2 className="auth-title">Reset Password</h2>
      <p className="auth-subtitle">
        Create a new password for your account
      </p>

      {errors.general && <div className="error-message">{errors.general}</div>}
      {errors.token && <div className="error-message">{errors.token}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="password">New Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password (8+ characters)"
            className={errors.password ? 'error' : ''}
            disabled={loading}
          />
          {errors.password && <span className="input-error">{errors.password}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="confirm-password">Confirm Password</label>
          <input
            type="password"
            id="confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className={errors.confirmPassword ? 'error' : ''}
            disabled={loading}
          />
          {errors.confirmPassword && <span className="input-error">{errors.confirmPassword}</span>}
        </div>

        <button
          type="submit"
          className="auth-button"
          disabled={loading}
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>

      <p className="auth-footer">
        Remember your password? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
};

export default ResetPassword;