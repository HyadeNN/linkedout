import { VALIDATION } from './constants';

/**
 * Form validation utilities
 */

// Email validation
export const isValidEmail = (email) => {
  return VALIDATION.EMAIL_REGEX.test(email);
};

// Required field validation
export const isRequired = (value) => {
  if (value === undefined || value === null) return false;
  return value.toString().trim().length > 0;
};

// Min length validation
export const minLength = (value, min) => {
  if (!value) return false;
  return value.length >= min;
};

// Max length validation
export const maxLength = (value, max) => {
  if (!value) return true;
  return value.length <= max;
};

// Match field validation (e.g., password confirmation)
export const matches = (value, fieldToMatch) => {
  return value === fieldToMatch;
};

// URL validation
export const isValidUrl = (url) => {
  if (!url) return true;
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

// Phone number validation (basic)
export const isValidPhone = (phone) => {
  if (!phone) return true;
  const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
  return phoneRegex.test(phone);
};

// Date validation
export const isValidDate = (dateString) => {
  if (!dateString) return true;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

// Future date validation
export const isFutureDate = (dateString) => {
  if (!dateString) return true;
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
};

// Past date validation
export const isPastDate = (dateString) => {
  if (!dateString) return true;
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

// Date range validation
export const isValidDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return true;
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start <= end;
};

// Numeric validation
export const isNumeric = (value) => {
  if (!value) return true;
  return !isNaN(Number(value));
};

// Integer validation
export const isInteger = (value) => {
  if (!value) return true;
  return Number.isInteger(Number(value));
};

// Positive number validation
export const isPositive = (value) => {
  if (!value) return true;
  return Number(value) > 0;
};

// Strong password validation
export const isStrongPassword = (password) => {
  if (!password) return false;

  // Minimum length
  if (password.length < VALIDATION.MIN_PASSWORD_LENGTH) return false;

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) return false;

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) return false;

  // Check for at least one number
  if (!/[0-9]/.test(password)) return false;

  // Check for at least one special character
  if (!/[^A-Za-z0-9]/.test(password)) return false;

  return true;
};

// Generic form validator
export const validateForm = (values, validationRules) => {
  const errors = {};

  Object.keys(validationRules).forEach(field => {
    const fieldRules = validationRules[field];
    const value = values[field];

    if (fieldRules.required && !isRequired(value)) {
      errors[field] = fieldRules.requiredMessage || 'This field is required';
      return;
    }

    if (fieldRules.email && value && !isValidEmail(value)) {
      errors[field] = fieldRules.emailMessage || 'Invalid email address';
      return;
    }

    if (fieldRules.minLength && value && !minLength(value, fieldRules.minLength)) {
      errors[field] = fieldRules.minLengthMessage || `Minimum length is ${fieldRules.minLength} characters`;
      return;
    }

    if (fieldRules.maxLength && value && !maxLength(value, fieldRules.maxLength)) {
      errors[field] = fieldRules.maxLengthMessage || `Maximum length is ${fieldRules.maxLength} characters`;
      return;
    }

    if (fieldRules.matches && value && !matches(value, values[fieldRules.matches])) {
      errors[field] = fieldRules.matchesMessage || `Must match ${fieldRules.matches} field`;
      return;
    }

    if (fieldRules.url && value && !isValidUrl(value)) {
      errors[field] = fieldRules.urlMessage || 'Invalid URL format';
      return;
    }

    if (fieldRules.phone && value && !isValidPhone(value)) {
      errors[field] = fieldRules.phoneMessage || 'Invalid phone number format';
      return;
    }

    if (fieldRules.date && value && !isValidDate(value)) {
      errors[field] = fieldRules.dateMessage || 'Invalid date format';
      return;
    }

    if (fieldRules.numeric && value && !isNumeric(value)) {
      errors[field] = fieldRules.numericMessage || 'Must be a number';
      return;
    }

    if (fieldRules.integer && value && !isInteger(value)) {
      errors[field] = fieldRules.integerMessage || 'Must be an integer';
      return;
    }

    if (fieldRules.positive && value && !isPositive(value)) {
      errors[field] = fieldRules.positiveMessage || 'Must be a positive number';
      return;
    }

    if (fieldRules.strongPassword && value && !isStrongPassword(value)) {
      errors[field] = fieldRules.strongPasswordMessage ||
        `Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters and include uppercase, lowercase, number, and special character`;
      return;
    }

    if (fieldRules.custom && value && typeof fieldRules.custom === 'function') {
      const customError = fieldRules.custom(value, values);
      if (customError) {
        errors[field] = customError;
        return;
      }
    }
  });

  return errors;
};