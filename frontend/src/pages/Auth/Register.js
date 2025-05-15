import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const Register = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    company_name: '', // Added company name field
    role: 'user', // Default role
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const { register, signInWithGoogle, USER_ROLES } = useAuth();
  const navigate = useNavigate();

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Check if company name already exists
  const checkCompanyNameExists = async (companyName) => {
    if (!companyName) return false;
    
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('company_name', '==', companyName));
      const querySnapshot = await getDocs(q);
      
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking company name:', error);
      return false;
    }
  };

  // Validate form
  const validateForm = async () => {
    const newErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    // Validate company name for employers
    if (formData.role === USER_ROLES.EMPLOYER) {
      if (!formData.company_name.trim()) {
        newErrors.company_name = 'Company name is required for employers';
      } else {
        // Check if company name already exists
        const exists = await checkCompanyNameExists(formData.company_name);
        if (exists) {
          newErrors.company_name = 'This company name is already registered';
        }
      }
    }

    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submission started');

    // Validate form
    const newErrors = await validateForm();
    if (Object.keys(newErrors).length > 0) {
      console.log('Validation errors:', newErrors);
      setErrors(newErrors);
      return;
    }

    // Clear previous errors
    setErrors({});

    try {
      console.log('Attempting registration with data:', { ...formData, password: '[REDACTED]' });
      setLoading(true);
      
      // Register user with the selected role
      await register(formData);
      
      console.log('Registration successful');
      setRegistrationSuccess(true);
      
      // After registration, just show success view which has a button to navigate to login
      // instead of automatic redirect
    } catch (error) {
      console.error('Registration failed:', error);

      if (error.response) {
        console.log('Error response:', error.response);
        if (error.response.data.detail === 'Email already registered') {
          setErrors({ email: 'Email already registered' });
        } else {
          setErrors({ general: error.response.data.detail || 'Registration failed. Please try again.' });
        }
      } else if (error.request) {
        console.log('No response received:', error.request);
        setErrors({ general: 'No response from server. Please check your internet connection.' });
      } else {
        console.log('Error setting up request:', error.message);
        setErrors({ general: 'Registration failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign-up
  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      setErrors({});
      await signInWithGoogle(formData.role);
      
      // Google sign-in/sign-up was successful, redirect to home
      navigate('/');
    } catch (error) {
      console.error('Google sign-up failed:', error);
      setErrors({ general: error.message || 'Google sign-up failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="auth-page register-success">
        <h2 className="auth-title">Registration Successful!</h2>
        <p className="auth-subtitle">
          Please check your email to verify your account. We've sent a verification link to {formData.email}
        </p>
        <button
          className="auth-button"
          onClick={() => navigate('/auth/login')}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="auth-page register-page">
      <h2 className="auth-title">Join LinkedOut</h2>
      <p className="auth-subtitle">Make the most of your professional life</p>

      {errors.general && (
        <div className="error-message">{errors.general}</div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="first_name">First Name</label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            placeholder="First name"
            className={errors.first_name ? 'error' : ''}
            disabled={loading}
          />
          {errors.first_name && <span className="input-error">{errors.first_name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="last_name">Last Name</label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            placeholder="Last name"
            className={errors.last_name ? 'error' : ''}
            disabled={loading}
          />
          {errors.last_name && <span className="input-error">{errors.last_name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
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
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password (8+ characters)"
            className={errors.password ? 'error' : ''}
            disabled={loading}
          />
          {errors.password && <span className="input-error">{errors.password}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="confirm_password">Confirm Password</label>
          <input
            type="password"
            id="confirm_password"
            name="confirm_password"
            value={formData.confirm_password}
            onChange={handleChange}
            placeholder="Confirm password"
            className={errors.confirm_password ? 'error' : ''}
            disabled={loading}
          />
          {errors.confirm_password && <span className="input-error">{errors.confirm_password}</span>}
        </div>

        <div className="form-group">
          <label>Account Type</label>
          <div className="role-selection">
            <label className={`role-option ${formData.role === USER_ROLES.USER ? 'selected' : ''}`}>
              <input
                type="radio"
                name="role"
                value={USER_ROLES.USER}
                checked={formData.role === USER_ROLES.USER}
                onChange={handleChange}
                disabled={loading}
              />
              <span className="role-icon">👤</span>
              <span className="role-label">Job Seeker</span>
              <span className="role-description">Find jobs and connect with employers</span>
            </label>
            <label className={`role-option ${formData.role === USER_ROLES.EMPLOYER ? 'selected' : ''}`}>
              <input
                type="radio"
                name="role"
                value={USER_ROLES.EMPLOYER}
                checked={formData.role === USER_ROLES.EMPLOYER}
                onChange={handleChange}
                disabled={loading}
              />
              <span className="role-icon">🏢</span>
              <span className="role-label">Employer</span>
              <span className="role-description">Post jobs and find candidates</span>
            </label>
          </div>
        </div>

        {/* Company name field - only visible for employers */}
        {formData.role === USER_ROLES.EMPLOYER && (
          <div className="form-group">
            <label htmlFor="company_name">Company Name*</label>
            <input
              type="text"
              id="company_name"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              placeholder="Your company name"
              className={errors.company_name ? 'error' : ''}
              disabled={loading}
            />
            {errors.company_name && <span className="input-error">{errors.company_name}</span>}
            <small className="form-hint">This name will be used for all your job postings</small>
          </div>
        )}

        <p className="terms-text">
          By clicking "Join now", you agree to the LinkedOut User Agreement, Privacy Policy, and Cookie Policy.
        </p>

        <button
          type="submit"
          className="auth-button"
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Join now'}
        </button>
      </form>

      <div className="auth-divider">
        <span>or</span>
      </div>

      <button 
        className="auth-social-button google"
        onClick={handleGoogleSignUp}
        disabled={loading}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
          <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
          <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
          <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
          <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
        </svg>
        <span>Join with Google</span>
      </button>

      <p className="auth-footer">
        Already on LinkedOut? <Link to="/auth/login">Sign in</Link>
      </p>
    </div>
  );
};

export default Register;