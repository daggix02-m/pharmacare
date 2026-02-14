import { removeToken } from '@/api/apiClient';

/**
 * Get the redirect path based on user role
 * @param {string} role - User role (admin, manager, pharmacist, cashier)
 * @returns {string} Redirect path
 */
export const getRoleBasedRedirect = (role) => {
  const roleRedirects = {
    admin: '/admin/dashboard',
    manager: '/manager/dashboard',
    pharmacist: '/pharmacist/inventory',
    cashier: '/cashier/payments',
  };

  return roleRedirects[role] || '/auth/login';
};

/**
 * Clear all authentication data from storage
 */
export const clearAuthData = () => {
  removeToken('accessToken');
  removeToken('refreshToken');
  removeToken('userRole');
  removeToken('userId');
  removeToken('userName');
  removeToken('userEmail');
  removeToken('roleId');
  removeToken('branchId');
  removeToken('requiresPasswordChange');
};

/**
 * Decode JWT token payload safely (handles URL-safe Base64)
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded payload or null if invalid
 */
const decodeJWTPayload = (token) => {
  if (!token || typeof token !== 'string') return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const base64Payload = parts[1];
    if (!base64Payload) return null;

    // Convert URL-safe Base64 to standard Base64
    const base64 = base64Payload
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    // Add padding if needed
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    const paddedBase64 = base64 + padding;

    // Decode Base64 and handle UTF-8 characters properly
    const binaryString = atob(paddedBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Decode UTF-8 bytes to string
    const decodedString = new TextDecoder('utf-8').decode(bytes);
    const payload = JSON.parse(decodedString);

    return payload;
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
};

/**
 * Check if JWT token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if expired or invalid
 */
export const isTokenExpired = (token) => {
  if (!token) return true;

  const payload = decodeJWTPayload(token);
  if (!payload) return true;

  try {
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= expirationTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

/**
 * Validate password against requirements
 * @param {string} password - Password to validate
 * @returns {object} Validation result with errors and strength
 */
export const validatePassword = (password) => {
  const errors = [];
  const checks = {
    minLength: password.length >= 6,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };

  if (!checks.minLength) errors.push('Password must be at least 6 characters');
  if (!checks.hasUppercase) errors.push('Password must contain at least one uppercase letter');
  if (!checks.hasLowercase) errors.push('Password must contain at least one lowercase letter');
  if (!checks.hasNumber) errors.push('Password must contain at least one number');

  const passedChecks = Object.values(checks).filter(Boolean).length;
  const strength = (passedChecks / 4) * 100;

  return {
    isValid: errors.length === 0,
    errors,
    checks,
    strength,
    strengthLabel: getPasswordStrengthLabel(strength),
  };
};

/**
 * Get password strength label and color
 * @param {number} strength - Strength percentage (0-100)
 * @returns {object} Label and color
 */
export const getPasswordStrengthLabel = (strength) => {
  if (strength === 0) return { label: '', color: '' };
  if (strength < 50) return { label: 'Weak', color: 'bg-red-500' };
  if (strength < 75) return { label: 'Fair', color: 'bg-yellow-500' };
  if (strength < 100) return { label: 'Good', color: 'bg-blue-500' };
  return { label: 'Strong', color: 'bg-green-500' };
};

/**
 * Handle authentication errors with user-friendly messages
 * @param {object} error - Error object
 * @returns {string} User-friendly error message
 */
export const handleAuthError = (error) => {
  const message = error.message || error.toString();
  const lowerMessage = message.toLowerCase();

  // CORS errors
  if (lowerMessage.includes('cors') || lowerMessage.includes('cross-origin')) {
    return 'Connection error: Unable to reach the authentication server. This may be due to network restrictions or browser security settings.';
  }

  // Network errors
  if (lowerMessage.includes('network error') || lowerMessage.includes('failed to fetch')) {
    return 'Network error: Unable to connect to the server. Please check your internet connection and try again.';
  }

  // Timeout errors
  if (
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('took too long') ||
    lowerMessage.includes('cancelled')
  ) {
    return 'Connection timeout: The server is taking too long to respond. Please check your internet connection and try again.';
  }

  // Rate limiting
  if (lowerMessage.includes('too many') || lowerMessage.includes('rate limit')) {
    return 'Too many login attempts. Please wait 15 minutes before trying again.';
  }

  // Account status errors
  if (lowerMessage.includes('pending admin activation')) {
    return 'Your account is pending approval from an administrator. You will receive an email once your account is activated.';
  }

  if (lowerMessage.includes('not activated') || lowerMessage.includes('verify your email')) {
    return 'Your account is not yet active. Please verify your email or contact your manager for assistance.';
  }

  if (lowerMessage.includes('inactive account') || lowerMessage.includes('account is inactive')) {
    return 'Your account has been deactivated. Please contact your administrator for assistance.';
  }

  // Default to original message
  return message;
};
