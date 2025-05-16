// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password requirements:
// - At least 8 characters
// - At least one uppercase letter
// - At least one lowercase letter
// - At least one number
// - At least one special character
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])(?=.{8,})/;

// Validation functions
export const validators = {
  required: (value) => (value ? undefined : 'This field is required'),
  
  email: (value) => 
    !value || emailRegex.test(value) ? undefined : 'Please enter a valid email address',
  
  minLength: (min) => (value) =>
    !value || value.length >= min 
      ? undefined 
      : `Must be at least ${min} characters`,
  
  maxLength: (max) => (value) =>
    !value || value.length <= max 
      ? undefined 
      : `Must be no more than ${max} characters`,
  
  password: (value) =>
    !value || passwordRegex.test(value)
      ? undefined
      : 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character',
  
  confirmPassword: (password) => (value) =>
    !value || value === password ? undefined : 'Passwords do not match',
  
  url: (value) => {
    if (!value) return undefined;
    try {
      new URL(value);
      return undefined;
    } catch (_) {
      return 'Please enter a valid URL';
    }
  },
  
  numeric: (value) => 
    !value || /^\d+$/.test(value) ? undefined : 'Must be a number',
  
  minValue: (min) => (value) =>
    !value || parseFloat(value) >= min 
      ? undefined 
      : `Must be at least ${min}`,
  
  maxValue: (max) => (value) =>
    !value || parseFloat(value) <= max 
      ? undefined 
      : `Must be no more than ${max}`,
};

// Helper function to compose multiple validators
export const composeValidators = (...validators) => (value) =>
  validators.reduce(
    (error, validator) => error || (validator && validator(value)),
    undefined
  );

// Common validation schemas
export const validationSchemas = {
  email: [
    validators.required,
    validators.email,
  ],
  
  password: [
    validators.required,
    validators.minLength(8),
    validators.password,
  ],
  
  name: [
    validators.required,
    validators.minLength(2),
    validators.maxLength(50),
  ],
  
  url: [
    validators.required,
    validators.url,
  ],
  
  requiredField: [
    validators.required,
  ],
};

// Function to validate a form field
export const validateField = (value, rules) => {
  if (!rules) return undefined;
  
  const errors = rules
    .map(rule => (typeof rule === 'function' ? rule(value) : undefined))
    .filter(Boolean);
    
  return errors.length > 0 ? errors[0] : undefined;
};

// Function to validate entire form
export const validateForm = (values, schema) => {
  const errors = {};
  
  Object.keys(schema).forEach(field => {
    const fieldError = validateField(values[field], schema[field]);
    if (fieldError) {
      errors[field] = fieldError;
    }
  });
  
  return Object.keys(errors).length === 0 ? null : errors;
};
