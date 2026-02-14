import { makeApiCall } from '@/api/apiClient';
import { resendVerification, verifyEmail } from '@/api/auth.api';

/**
 * Admin Service
 * Handles all admin-related API calls
 * Object-based export pattern for consistency with other services
 */
export const adminService = {
  // ============ DASHBOARD ENDPOINTS ============

  /**
   * Get admin dashboard data
   * @returns {Promise<Object>} Dashboard data
   */
  async getDashboard() {
    return await makeApiCall('/admin/dashboard', { method: 'GET' });
  },

  /**
   * Get recent activity
   * @returns {Promise<Object>} Activity data
   */
  async getRecentActivity() {
    return await makeApiCall('/admin/dashboard/activity', { method: 'GET' });
  },

  // ============ BRANCH MANAGEMENT ENDPOINTS ============

  /**
   * Get all branches
   * @returns {Promise<Object>} Branches list
   */
  async getBranches() {
    return await makeApiCall('/admin/dashboard/branches-list', { method: 'GET' });
  },

  /**
   * Get branches list (alias for consistency)
   * @returns {Promise<Object>} Branches list
   */
  async getBranchesList() {
    return await makeApiCall('/admin/dashboard/branches-list', { method: 'GET' });
  },

  /**
   * Get active branches
   * @returns {Promise<Object>} Active branches
   */
  async getActiveBranches() {
    return await makeApiCall('/admin/branches/active', { method: 'GET' });
  },

  /**
   * Get branch by ID
   * @param {number} branchId - Branch ID
   * @returns {Promise<Object>} Branch details
   */
  async getBranchById(branchId) {
    return await makeApiCall(`/admin/dashboard/branches/${branchId}`, { method: 'GET' });
  },

  /**
   * Create a new branch
   * @param {Object} branchData - Branch data
   * @returns {Promise<Object>} Created branch
   */
  async createBranch(branchData) {
    return await makeApiCall('/admin/branches', {
      method: 'POST',
      body: JSON.stringify(branchData),
    });
  },

  /**
   * Update branch
   * @param {number} branchId - Branch ID
   * @param {Object} branchData - Branch data
   * @returns {Promise<Object>} Updated branch
   */
  async updateBranch(branchId, branchData) {
    return await makeApiCall(`/admin/branches/${branchId}`, {
      method: 'PUT',
      body: JSON.stringify(branchData),
    });
  },

  /**
   * Delete branch
   * @param {number} branchId - Branch ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteBranch(branchId) {
    return await makeApiCall(`/admin/branches/${branchId}`, { method: 'DELETE' });
  },

  /**
   * Activate branch
   * @param {number} branchId - Branch ID
   * @returns {Promise<Object>} Activation result
   */
  async activateBranch(branchId) {
    return await makeApiCall(`/admin/dashboard/branches/${branchId}/activate`, { method: 'PUT' });
  },

  /**
   * Deactivate branch
   * @param {number} branchId - Branch ID
   * @returns {Promise<Object>} Deactivation result
   */
  async deactivateBranch(branchId) {
    return await makeApiCall(`/admin/dashboard/branches/${branchId}/deactivate`, { method: 'PUT' });
  },

  // ============ MANAGER MANAGEMENT ENDPOINTS ============

  /**
   * Get all managers
   * @returns {Promise<Object>} Managers list
   */
  async getManagers() {
    return await makeApiCall('/admin/managers', { method: 'GET' });
  },

  /**
   * Get pending managers
   * @returns {Promise<Object>} Pending managers
   */
  async getPendingManagers() {
    return await makeApiCall('/admin/managers/pending', { method: 'GET' });
  },

  /**
   * Get activated managers
   * @returns {Promise<Object>} Activated managers
   */
  async getActivatedManagers() {
    return await makeApiCall('/admin/managers/activated', { method: 'GET' });
  },

  /**
   * Get manager by ID
   * @param {number} userId - Manager user ID
   * @returns {Promise<Object>} Manager details
   */
  async getManagerById(userId) {
    return await makeApiCall(`/admin/managers/${userId}`, { method: 'GET' });
  },

  /**
   * Create a new manager
   * @param {Object} managerData - Manager data
   * @returns {Promise<Object>} Created manager
   */
  async createManager(managerData) {
    return await makeApiCall('/admin/managers', {
      method: 'POST',
      body: JSON.stringify(managerData),
    });
  },

  /**
   * Update manager
   * @param {number} userId - Manager user ID
   * @param {Object} managerData - Manager data
   * @returns {Promise<Object>} Updated manager
   */
  async updateManager(userId, managerData) {
    return await makeApiCall(`/admin/managers/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(managerData),
    });
  },

  /**
   * Delete manager
   * @param {number} userId - Manager user ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteManager(userId) {
    return await makeApiCall(`/admin/managers/${userId}`, { method: 'DELETE' });
  },

  /**
   * Activate manager
   * @param {number} userId - Manager user ID
   * @returns {Promise<Object>} Activation result
   */
  async activateManager(userId) {
    return await makeApiCall(`/admin/managers/${userId}/activate`, { method: 'PUT' });
  },

  /**
   * Deactivate manager
   * @param {number} userId - Manager user ID
   * @returns {Promise<Object>} Deactivation result
   */
  async deactivateManager(userId) {
    return await makeApiCall(`/admin/managers/${userId}/deactivate`, { method: 'PUT' });
  },

  /**
   * Reset manager password
   * @param {number} userId - Manager user ID
   * @param {Object} passwordData - Password data
   * @returns {Promise<Object>} Reset result
   */
  async resetManagerPassword(userId, passwordData) {
    return await makeApiCall(`/admin/managers/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  },

  // ============ VERIFICATION ENDPOINTS ============

  /**
   * Send verification code to manager
   * @param {string} email - Manager email
   * @returns {Promise<Object>} Send result
   */
  async sendVerificationCode(email) {
    return await resendVerification(email);
  },

  /**
   * Verify manager code
   * @param {string} email - Manager email
   * @param {string} code - Verification code
   * @returns {Promise<Object>} Verification result
   */
  async verifyManagerCode(email, code) {
    return await verifyEmail(email, code);
  },
};

export default adminService;
