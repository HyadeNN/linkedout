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
  const { login, signInWithGoogle, isAuthenticated, USER_ROLES } = useAuth();
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

  // Handle Google Sign-in
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrors({});
      await signInWithGoogle(role);
      
      // Redirect based on role - this will be determined after sign-in from Firebase
      // but we redirect to home by default
      navigate('/');
    } catch (error) {
      console.error('Google login failed:', error);
      setErrors({ general: error.message || 'Google login failed. Please try again.' });
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

      <div className="auth-divider">
        <span>or</span>
      </div>

      <button 
        className="auth-social-button google"
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
          <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
          <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
          <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
          <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
        </svg>
        <span>Sign in with Google</span>
      </button>

      <p className="auth-footer">
        New to LinkedOut? <Link to="/auth/register">Join now</Link>
      </p>
    </div>
  );
};

export default Login;