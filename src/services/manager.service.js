import { makeApiCall } from '../api/apiClient';
import { resendVerification } from '../api/auth.api';

export const managerService = {
  // ==================== DASHBOARD ENDPOINTS ====================

  async getDashboardBranch(params = {}) {
    const queryParams = new URLSearchParams({
      ...(params.branch_id && { branch_id: params.branch_id }),
    });
    return await makeApiCall(`/manager/dashboard/branch?${queryParams}`, { method: 'GET' });
  },

  async getDashboardInventory(params = {}) {
    const queryParams = new URLSearchParams({
      ...(params.branch_id && { branch_id: params.branch_id }),
    });
    return await makeApiCall(`/manager/dashboard/inventory?${queryParams}`, { method: 'GET' });
  },

  async getDashboardSales(params = {}) {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 50,
      ...(params.start_date && { start_date: params.start_date }),
      ...(params.end_date && { end_date: params.end_date }),
      ...(params.status && { status: params.status }),
      ...(params.payment_method && { payment_type: params.payment_method }),
      ...(params.branch_id && { branch_id: params.branch_id }),
      ...(params.year && { year: params.year }),
    });
    return await makeApiCall(`/manager/dashboard/sales?${queryParams}`, { method: 'GET' });
  },

  async getDashboardNotifications(params = {}) {
    const queryParams = new URLSearchParams({
      ...(params.branch_id && { branch_id: params.branch_id }),
    });
    return await makeApiCall(`/manager/dashboard/notifications?${queryParams}`, { method: 'GET' });
  },

  async getDashboardTopSelling(params = {}) {
    const queryParams = new URLSearchParams({
      period: params.period || 'week',
      limit: params.limit || 10,
      ...(params.branch_id && { branch_id: params.branch_id }),
    });
    return await makeApiCall(`/manager/dashboard/top-selling?${queryParams}`, { method: 'GET' });
  },

  // Legacy method for backward compatibility
  async getDashboard(params = {}) {
    return await makeApiCall('/manager/dashboard', { method: 'GET' });
  },

  // ==================== STAFF (USERS) ENDPOINTS ====================

  async getStaff(params = {}) {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 50,
      ...(params.status && { status: params.status }),
      ...(params.search && { search: params.search }),
    });
    return await makeApiCall(`/manager/staff?${queryParams}`, { method: 'GET' });
  },

  async createStaff(staffData) {
    return await makeApiCall('/manager/staff', {
      method: 'POST',
      body: JSON.stringify(staffData),
    });
  },

  async verifyStaff(userId, verificationCode) {
    console.log('[MANAGER SERVICE] verifyStaff called with:', { userId, verificationCode });
    return await makeApiCall('/manager/staff/verify', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        verification_code: verificationCode,
      }),
    });
  },

  async updateStaff(staffId, staffData) {
    const requestData = { ...staffData };
    if (staffData.role_ids) {
      requestData.role_id = staffData.role_ids[0];
      delete requestData.role_ids;
    }

    return await makeApiCall(`/manager/staff/${staffId}`, {
      method: 'PUT',
      body: JSON.stringify(requestData),
    });
  },

  async deleteStaff(staffId) {
    // Use PUT to deactivate/delete staff
    return await makeApiCall(`/manager/staff/${staffId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'deleted' }),
    });
  },

  async deactivateStaff(staffId) {
    // Deactivate by updating is_active flag via PUT
    return await makeApiCall(`/manager/staff/${staffId}`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: false }),
    });
  },

  async activateStaff(staffId) {
    // Activate by updating is_active flag via PUT
    return await makeApiCall(`/manager/staff/${staffId}`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: true }),
    });
  },

  async resetStaffPassword(staffId) {
    // Use the update endpoint to trigger password reset
    return await makeApiCall(`/manager/staff/${staffId}`, {
      method: 'PUT',
      body: JSON.stringify({ reset_password: true }),
    });
  },

  // ==================== MEDICINE MANAGEMENT ENDPOINTS ====================

  async getMedicines(params = {}) {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 50,
      ...(params.search && { search: params.search }),
      ...(params.category_id && { category_id: params.category_id }),
      ...(params.low_stock_only && { low_stock_only: params.low_stock_only }),
      ...(params.branch_id && { branch_id: params.branch_id }),
    });

    return await makeApiCall(`/manager/medicines?${queryParams}`, { method: 'GET' });
  },

  async addMedicine(medicineData) {
    return await makeApiCall('/manager/medicines', {
      method: 'POST',
      body: JSON.stringify(medicineData),
    });
  },

  /**
   * Import medicines from a file (CSV, Excel, etc.)
   * @param {File} file - The file to import
   * @returns {Promise<Object>} Import result with success status and details
   */
  async importMedicines(file) {
    const formData = new FormData();
    formData.append('file', file);

    return await makeApiCall('/manager/medicines/import-excel', {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData - let browser set it with boundary
        // makeApiCall will handle this
      },
    });
  },

  /**
   * Import medicines from a batch of data (JSON array)
   * @param {Array} medicines - Array of medicine objects
   * @returns {Promise<Object>} Import result with success status and details
   */
  async importMedicinesBatch(medicines) {
    try {
      const response = await makeApiCall('/manager/medicines/import-batch', {
        method: 'POST',
        body: JSON.stringify({ medicines }),
      });

      // If batch endpoint is not found, fallback to individual creation
      if (response.status === 404 || response.message?.includes('not found')) {
        console.warn('[MANAGER SERVICE] Batch import endpoint not found, falling back to individual creation');
        
        let imported = 0;
        let failed = 0;
        const errors = [];

        for (const medicine of medicines) {
          const res = await this.addMedicine(medicine);
          if (res.success) {
            imported++;
          } else {
            failed++;
            errors.push({ name: medicine.name, error: res.message });
          }
        }

        return {
          success: true,
          data: {
            imported,
            failed,
            errors
          }
        };
      }

      return response;
    } catch (error) {
      console.error('[MANAGER SERVICE] Error in batch import:', error);
      return { success: false, message: error.message };
    }
  },

  async getMedicineById(medicineId) {
    try {
      const response = await makeApiCall(`/manager/medicines/${medicineId}`, { method: 'GET' });
      if (response.success) return response;
      
      // Try pharmacist endpoint if manager one fails
      // Note: This might still fail with 403 if RBAC is strict, but it's a valid fallback attempt
      return await makeApiCall(`/pharmacist/medicines/${medicineId}`, { method: 'GET' });
    } catch (error) {
      return await makeApiCall(`/pharmacist/medicines/${medicineId}`, { method: 'GET' });
    }
  },

  async updateMedicineStock(medicineId, stockData) {
    return await makeApiCall(`/manager/medicines/${medicineId}/stock`, {
      method: 'PUT',
      body: JSON.stringify(stockData),
    });
  },

  async deleteMedicine(medicineId) {
    return await makeApiCall(`/manager/medicines/${medicineId}`, { method: 'DELETE' });
  },

  // ==================== BRANCH MANAGEMENT ENDPOINTS ====================

  async getBranches(params = {}) {
    const queryParams = new URLSearchParams({
      ...(params.status && { status: params.status }),
    });
    return await makeApiCall('/manager/branches', { method: 'GET' });
  },

  async createBranch(branchData) {
    return await makeApiCall('/manager/branches', {
      method: 'POST',
      body: JSON.stringify(branchData),
    });
  },

  async requestBranch(branchData) {
    return await makeApiCall('/manager/branches/request', {
      method: 'POST',
      body: JSON.stringify(branchData),
    });
  },

  async updateBranch(branchId, branchData) {
    return await makeApiCall(`/manager/branches/${branchId}`, {
      method: 'PUT',
      body: JSON.stringify(branchData),
    });
  },

  async deleteBranch(branchId) {
    return await makeApiCall(`/manager/branches/${branchId}`, { method: 'DELETE' });
  },

  async activateBranch(branchId) {
    return await makeApiCall(`/manager/branches/${branchId}/activate`, { method: 'PUT' });
  },

  async deactivateBranch(branchId) {
    return await makeApiCall(`/manager/branches/${branchId}/deactivate`, { method: 'PUT' });
  },

  // ==================== SALES MANAGEMENT ENDPOINTS ====================

  async getSales(params = {}) {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 50,
      ...(params.start_date && { start_date: params.start_date }),
      ...(params.end_date && { end_date: params.end_date }),
      ...(params.status && { status: params.status }),
      ...(params.payment_method && { payment_type: params.payment_method }),
      ...(params.branch_id && { branch_id: params.branch_id }),
    });

    return await makeApiCall(`/manager/dashboard/sales?${queryParams}`, { method: 'GET' });
  },

  async getSaleById(saleId) {
    return await makeApiCall(`/manager/dashboard/sales/${saleId}`, { method: 'GET' });
  },

  async getTopSellingMedicines(params = {}) {
    const queryParams = new URLSearchParams({
      period: params.period || 'week',
      limit: params.limit || 10,
      ...(params.branch_id && { branch_id: params.branch_id }),
    });

    return await makeApiCall(`/manager/dashboard/top-selling?${queryParams}`, { method: 'GET' });
  },

  // ============ PAYMENT PROCESSING ============

  async createSale(saleData) {
    return await makeApiCall('/manager/sales', {
      method: 'POST',
      body: JSON.stringify(saleData),
    });
  },

  async processPayment(saleId, paymentData) {
    return await makeApiCall(`/manager/sales/${saleId}/payment`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  async processRefund(saleId, refundData) {
    return await makeApiCall(`/manager/sales/${saleId}/refund`, {
      method: 'POST',
      body: JSON.stringify(refundData),
    });
  },

  async getAuditTrail(params = {}) {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 50,
      ...(params.start_date && { start_date: params.start_date }),
      ...(params.end_date && { end_date: params.end_date }),
      ...(params.staff_id && { staff_id: params.staff_id }),
      ...(params.payment_method && { payment_type: params.payment_method }),
      ...(params.transaction_type && { transaction_type: params.transaction_type }),
    });

    return await makeApiCall(`/manager/audit-trail?${queryParams}`, { method: 'GET' });
  },

  async getTransactionById(transactionId) {
    return await makeApiCall(`/manager/audit-trail/${transactionId}`, { method: 'GET' });
  },

  async getRefundPolicy() {
    return await makeApiCall('/manager/settings/refund-policy', { method: 'GET' });
  },

  async updateRefundPolicy(policyData) {
    return await makeApiCall('/manager/settings/refund-policy', {
      method: 'PUT',
      body: JSON.stringify(policyData),
    });
  },

  // ============ MANAGER MANAGEMENT ============

  async getManagers(params = {}) {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 20,
      ...(params.branch_id && { branch_id: params.branch_id }),
      ...(params.status && { status: params.status }),
      ...(params.search && { search: params.search }),
    });

    return await makeApiCall(`/manager/managers?${queryParams}`, { method: 'GET' });
  },

  async createManager(managerData) {
    return await makeApiCall('/manager/managers', {
      method: 'POST',
      body: JSON.stringify(managerData),
    });
  },

  async verifyManager(userId, verificationCode) {
    return await makeApiCall('/manager/managers/verify', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        verification_code: verificationCode,
      }),
    });
  },

  async updateManager(managerId, managerData) {
    return await makeApiCall(`/manager/managers/${managerId}`, {
      method: 'PUT',
      body: JSON.stringify(managerData),
    });
  },

  async deleteManager(managerId) {
    return await makeApiCall(`/manager/managers/${managerId}`, {
      method: 'DELETE',
    });
  },

  async resetManagerPassword(managerId) {
    return await makeApiCall(`/manager/managers/${managerId}/reset-password`, {
      method: 'POST',
    });
  },

  async getAuditLogs(params = {}) {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 20,
      ...(params.action && { action: params.action }),
      ...(params.actor_id && { actor_id: params.actor_id }),
      ...(params.start_date && { start_date: params.start_date }),
      ...(params.end_date && { end_date: params.end_date }),
    });

    return await makeApiCall(`/admin/audit-logs?${queryParams}`, { method: 'GET' });
  },
};

export default managerService;
