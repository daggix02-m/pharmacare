import { login, logout } from '../api/auth.api';
import { getToken, setToken, isAuthenticated as checkAuth } from '../api/apiClient';

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

export const authService = {
  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} User data and token
   */
  async login(email, password) {
    const response = await login(email, password);

    if (response.success) {
      // The login function from auth.api already handles token storage
      // but we'll ensure the role is properly stored
      if (response.role) {
        setToken('userRole', response.role);
      }
    }

    return response;
  },

  /**
   * Logout user
   * @returns {Promise}
   */
  async logout() {
    return await logout();
  },

  /**
   * Get current user from storage
   * @returns {Object|null} User object or null if not logged in
   */
  getCurrentUser() {
    const token = getToken('accessToken'); // Using the new token storage key
    if (!token) return null;

    return {
      role: getToken('userRole'),
      name: getToken('userName'),
      email: getToken('userEmail'),
    };
  },

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return checkAuth(); // Using the new token storage key
  },

  /**
   * Get user role
   * @returns {string|null}
   */
  getUserRole() {
    return getToken('userRole');
  },
};

export default authService;
