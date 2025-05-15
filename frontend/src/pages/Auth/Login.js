import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // Default role
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, USER_ROLES } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear previous errors
    setErrors({});

    try {
      setLoading(true);
      await login(email, password);
      
      // Redirect based on role
      if (role === USER_ROLES.EMPLOYER) {
        navigate('/jobs/my-jobs');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setErrors({ general: error.message || 'Login failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page login-page">
      <h2 className="auth-title">Sign In</h2>
      <p className="auth-subtitle">Stay updated on your professional world</p>

      {errors.general && (
        <div className="error-message">{errors.general}</div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label>Account Type</label>
          <div className="role-selection">
            <label 
              className={`role-option ${role === USER_ROLES.USER ? 'selected' : ''}`}
              onClick={() => setRole(USER_ROLES.USER)}
            >
              <input
                type="radio"
                name="role"
                value={USER_ROLES.USER}
                checked={role === USER_ROLES.USER}
                onChange={() => setRole(USER_ROLES.USER)}
                disabled={loading}
              />
              <span className="role-icon">👤</span>
              <span className="role-label">Job Seeker</span>
              <span className="role-description">Find jobs and connect with employers</span>
            </label>
            <label 
              className={`role-option ${role === USER_ROLES.EMPLOYER ? 'selected' : ''}`}
              onClick={() => setRole(USER_ROLES.EMPLOYER)}
            >
              <input
                type="radio"
                name="role"
                value={USER_ROLES.EMPLOYER}
                checked={role === USER_ROLES.EMPLOYER}
                onChange={() => setRole(USER_ROLES.EMPLOYER)}
                disabled={loading}
              />
              <span className="role-icon">🏢</span>
              <span className="role-label">Employer</span>
              <span className="role-description">Post jobs and find candidates</span>
            </label>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className={errors.email ? 'error' : ''}
            disabled={loading}
          />
          {errors.email && <span className="input-error">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className={errors.password ? 'error' : ''}
            disabled={loading}
          />
          {errors.password && <span className="input-error">{errors.password}</span>}
        </div>

        <div className="forgot-password">
          <Link to="/auth/forgot-password">Forgot password?</Link>
        </div>

        <button
          type="submit"
          className="auth-button"
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="auth-footer">
        New to LinkedOut? <Link to="/auth/register">Join now</Link>
      </p>
    </div>
  );
};

export default Login;