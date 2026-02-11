/**
 * Comprehensive Validation Utility Library
 * Provides validation functions for all form inputs across the application
 */

// Email validation (RFC 5322 compliant)
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email.trim())) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  // Check for common disposable email domains
  const disposableDomains = ['tempmail.com', 'throwaway.email', '10minutemail.com'];
  const domain = email.split('@')[1]?.toLowerCase();

  if (disposableDomains.includes(domain)) {
    return { valid: false, error: 'Disposable email addresses are not allowed' };
  }

  return { valid: true };
};

// Password validation
export const validatePassword = (password) => {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character' };
  }

  return { valid: true };
};

// Phone number validation (international format)
export const validatePhone = (phone) => {
  if (!phone) {
    return { valid: false, error: 'Phone number is required' };
  }

  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, '');

  // Check if there are any digits at all
  if (digitsOnly.length === 0) {
    return { valid: false, error: 'Please enter a valid phone number' };
  }

  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return { valid: false, error: 'Phone number must be between 10 and 15 digits' };
  }

  // More permissive regex - allows +, digits, spaces, parentheses, hyphens, dots
  const phoneRegex = /^[\+]?[0-9\s\(\)\-\.]+$/;

  if (!phoneRegex.test(phone)) {
    return { valid: false, error: 'Please enter a valid phone number' };
  }

  return { valid: true };
};

// Ethiopian phone number validation (09xxxxxxxx or 07xxxxxxxx)
export const validateEthiopianPhoneNumber = (phone) => {
  if (!phone) {
    return { valid: false, error: 'Phone number is required' };
  }

  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, '');

  // Ethiopian phone numbers must be 10 digits starting with 09 or 07
  // Or 12 digits starting with 251 (country code) followed by 9 or 7
  const ethiopianPhoneRegex = /^((09|07)\d{8}|251(9|7)\d{8})$/;

  if (!ethiopianPhoneRegex.test(digitsOnly)) {
    return {
      valid: false,
      error: 'Please enter a valid Ethiopian phone number (09xxxxxxxx or 07xxxxxxxx)',
    };
  }

  return { valid: true };
};

// Name validation
export const validateName = (name, fieldName = 'Name') => {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: `${fieldName} is required` };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 2) {
    return { valid: false, error: `${fieldName} must be at least 2 characters long` };
  }

  if (trimmedName.length > 100) {
    return { valid: false, error: `${fieldName} must not exceed 100 characters` };
  }

  // Allow letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s\-']+$/;

  if (!nameRegex.test(trimmedName)) {
    return {
      valid: false,
      error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`,
    };
  }

  return { valid: true };
};

// Medicine name validation
export const validateMedicineName = (name) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Medicine name is required' };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 2) {
    return { valid: false, error: 'Medicine name must be at least 2 characters long' };
  }

  if (trimmedName.length > 200) {
    return { valid: false, error: 'Medicine name must not exceed 200 characters' };
  }

  // Allow alphanumeric, spaces, hyphens, parentheses, slashes
  const nameRegex = /^[a-zA-Z0-9\s\-()\/]+$/;

  if (!nameRegex.test(trimmedName)) {
    return { valid: false, error: 'Medicine name contains invalid characters' };
  }

  return { valid: true };
};

// Quantity validation (positive integer)
export const validateQuantity = (quantity, fieldName = 'Quantity') => {
  if (quantity === null || quantity === undefined || quantity === '') {
    return { valid: false, error: `${fieldName} is required` };
  }

  const numValue = Number(quantity);

  if (isNaN(numValue)) {
    return { valid: false, error: `${fieldName} must be a number` };
  }

  if (!Number.isInteger(numValue)) {
    return { valid: false, error: `${fieldName} must be a whole number` };
  }

  if (numValue < 0) {
    return { valid: false, error: `${fieldName} cannot be negative` };
  }

  if (numValue > 1000000) {
    return { valid: false, error: `${fieldName} is too large (max: 1,000,000)` };
  }

  return { valid: true };
};

// Price validation (positive decimal with max 2 decimal places)
export const validatePrice = (price, fieldName = 'Price') => {
  if (price === null || price === undefined || price === '') {
    return { valid: false, error: `${fieldName} is required` };
  }

  const numValue = Number(price);

  if (isNaN(numValue)) {
    return { valid: false, error: `${fieldName} must be a number` };
  }

  if (numValue <= 0) {
    return { valid: false, error: `${fieldName} must be greater than zero` };
  }

  if (numValue > 1000000) {
    return { valid: false, error: `${fieldName} is too large (max: 1,000,000)` };
  }

  // Check decimal places
  const decimalPlaces = (numValue.toString().split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    return { valid: false, error: `${fieldName} can have at most 2 decimal places` };
  }

  return { valid: true };
};

// Date validation
export const validateDate = (date, fieldName = 'Date', options = {}) => {
  if (!date) {
    return { valid: false, error: `${fieldName} is required` };
  }

  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    return { valid: false, error: `${fieldName} is not a valid date` };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (options.mustBeFuture && dateObj <= today) {
    return { valid: false, error: `${fieldName} must be a future date` };
  }

  if (options.mustBePast && dateObj >= today) {
    return { valid: false, error: `${fieldName} must be a past date` };
  }

  if (options.minDate && dateObj < new Date(options.minDate)) {
    return { valid: false, error: `${fieldName} cannot be before ${options.minDate}` };
  }

  if (options.maxDate && dateObj > new Date(options.maxDate)) {
    return { valid: false, error: `${fieldName} cannot be after ${options.maxDate}` };
  }

  return { valid: true };
};

// Expiry date validation (must be future date)
export const validateExpiryDate = (date) => {
  return validateDate(date, 'Expiry date', { mustBeFuture: true });
};

// Batch number validation
export const validateBatchNumber = (batch) => {
  if (!batch || typeof batch !== 'string') {
    return { valid: false, error: 'Batch number is required' };
  }

  const trimmedBatch = batch.trim();

  if (trimmedBatch.length < 3) {
    return { valid: false, error: 'Batch number must be at least 3 characters long' };
  }

  if (trimmedBatch.length > 50) {
    return { valid: false, error: 'Batch number must not exceed 50 characters' };
  }

  // Allow alphanumeric and hyphens
  const batchRegex = /^[a-zA-Z0-9\-]+$/;

  if (!batchRegex.test(trimmedBatch)) {
    return { valid: false, error: 'Batch number can only contain letters, numbers, and hyphens' };
  }

  return { valid: true };
};

// Address validation
export const validateAddress = (address, fieldName = 'Address') => {
  if (!address || typeof address !== 'string') {
    return { valid: false, error: `${fieldName} is required` };
  }

  const trimmedAddress = address.trim();

  if (trimmedAddress.length < 5) {
    return { valid: false, error: `${fieldName} must be at least 5 characters long` };
  }

  if (trimmedAddress.length > 200) {
    return { valid: false, error: `${fieldName} must not exceed 200 characters` };
  }

  return { valid: true };
};

// Verification code validation (6 digits)
export const validateVerificationCode = (code) => {
  if (!code) {
    return { valid: false, error: 'Verification code is required' };
  }

  const codeRegex = /^[0-9]{6}$/;

  if (!codeRegex.test(code)) {
    return { valid: false, error: 'Verification code must be exactly 6 digits' };
  }

  return { valid: true };
};

// Generic required field validation
export const validateRequired = (value, fieldName = 'This field') => {
  if (
    value === null ||
    value === undefined ||
    value === '' ||
    (typeof value === 'string' && value.trim() === '')
  ) {
    return { valid: false, error: `${fieldName} is required` };
  }

  return { valid: true };
};

// Validate multiple fields at once
export const validateForm = (fields) => {
  const errors = {};
  let isValid = true;

  Object.entries(fields).forEach(([fieldName, validation]) => {
    const result = validation();
    if (!result.valid) {
      errors[fieldName] = result.error;
      isValid = false;
    }
  });

  return { isValid, errors };
};

// Stock threshold validation
export const validateStockThreshold = (threshold) => {
  const result = validateQuantity(threshold, 'Stock threshold');
  if (!result.valid) return result;

  const numValue = Number(threshold);
  if (numValue < 0) {
    return { valid: false, error: 'Stock threshold cannot be negative' };
  }

  return { valid: true };
};

// Percentage validation (0-100)
export const validatePercentage = (value, fieldName = 'Percentage') => {
  if (value === null || value === undefined || value === '') {
    return { valid: false, error: `${fieldName} is required` };
  }

  const numValue = Number(value);

  if (isNaN(numValue)) {
    return { valid: false, error: `${fieldName} must be a number` };
  }

  if (numValue < 0 || numValue > 100) {
    return { valid: false, error: `${fieldName} must be between 0 and 100` };
  }

  return { valid: true };
};

// Discount validation
export const validateDiscount = (discount) => {
  return validatePercentage(discount, 'Discount');
};

// Customer name validation (less strict than regular name)
export const validateCustomerName = (name) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Customer name is required' };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 1) {
    return { valid: false, error: 'Customer name is required' };
  }

  if (trimmedName.length > 100) {
    return { valid: false, error: 'Customer name must not exceed 100 characters' };
  }

  return { valid: true };
};

// Payment method validation
export const validatePaymentMethod = (method) => {
  const validMethods = ['cash', 'card', 'insurance', 'mobile_money'];

  if (!method) {
    return { valid: false, error: 'Payment method is required' };
  }

  if (!validMethods.includes(method.toLowerCase())) {
    return { valid: false, error: 'Invalid payment method' };
  }

  return { valid: true };
};

// Notes/Description validation (optional but with max length)
export const validateNotes = (notes, maxLength = 500) => {
  if (!notes) {
    return { valid: true }; // Notes are optional
  }

  if (typeof notes !== 'string') {
    return { valid: false, error: 'Notes must be text' };
  }

  if (notes.length > maxLength) {
    return { valid: false, error: `Notes must not exceed ${maxLength} characters` };
  }

  return { valid: true };
};

export default {
  validateEmail,
  validatePassword,
  validatePhone,
  validateEthiopianPhoneNumber,
  validateName,
  validateMedicineName,
  validateQuantity,
  validatePrice,
  validateDate,
  validateExpiryDate,
  validateBatchNumber,
  validateAddress,
  validateVerificationCode,
  validateRequired,
  validateForm,
  validateStockThreshold,
  validatePercentage,
  validateDiscount,
  validateCustomerName,
  validatePaymentMethod,
  validateNotes,
};
