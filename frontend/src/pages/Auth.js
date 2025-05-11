import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // Validate form
  const validateForm = () => {
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

    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear previous errors
    setErrors({});

    try {
      setLoading(true);
      await register(formData);
      setRegistrationSuccess(true);
    } catch (error) {
      console.error('Registration failed:', error);

      if (error.response && error.response.data) {
        if (error.response.data.detail === 'Email already registered') {
          setErrors({ email: 'Email already registered' });
        } else {
          setErrors({ general: error.response.data.detail || 'Registration failed. Please try again.' });
        }
      } else {
        setErrors({ general: 'Registration failed. Please try again.' });
      }
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
          onClick={() => navigate('/login')}
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

      <button className="auth-social-button google">
        <span className="social-icon">G</span>
        <span>Join with Google</span>
      </button>

      <p className="auth-footer">
        Already on LinkedOut? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
};

export default Register;