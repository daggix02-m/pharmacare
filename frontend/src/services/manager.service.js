import { makeApiCall } from '../api/apiClient';

export const managerService = {
  async getDashboard() {
    return await makeApiCall('/manager/dashboard', { method: 'GET' });
  },

  // Staff Management
  async getStaff() {
    return await makeApiCall('/manager/staff', { method: 'GET' });
  },

  async createStaff(staffData) {
    return await makeApiCall('/manager/staff', {
      method: 'POST',
      body: JSON.stringify({ ...staffData, temporary_password: null }),
    });
  },

  async verifyStaff(userId, verificationCode) {
    return await makeApiCall('/manager/staff/verify', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        ...(verificationCode && { verification_code: verificationCode }),
      }),
    });
  },

  async updateStaff(userId, staffData) {
    const requestData = { ...staffData };
    if (staffData.role_ids) {
      requestData.role_id = staffData.role_ids[0];
      delete requestData.role_ids;
    }
    
    return await makeApiCall(`/manager/staff/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(requestData),
    });
  },

  async deleteStaff(userId) {
    return await makeApiCall(`/manager/staff/${userId}`, { method: 'DELETE' });
  },

  async resetStaffPassword(userId) {
    return await makeApiCall(`/manager/staff/${userId}/reset-password`, { method: 'POST' });
  },

  // Medicine Management
  async getMedicines(params = {}) {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 50,
      ...(params.search && { search: params.search }),
      ...(params.category_id && { category_id: params.category_id }),
      ...(params.low_stock_only && { low_stock_only: params.low_stock_only }),
    });

    return await makeApiCall(`/manager/medicines?${queryParams}`, { method: 'GET' });
  },

  async getMedicineById(medicineId) {
    return await makeApiCall(`/manager/medicines/${medicineId}`, { method: 'GET' });
  },

  async addMedicine(medicineData) {
    return await makeApiCall('/manager/medicines', {
      method: 'POST',
      body: JSON.stringify(medicineData),
    });
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

  // Branch Management
  async getBranches() {
    return await makeApiCall('/manager/branches', { method: 'GET' });
  },

  async createBranch(branchData) {
    return await makeApiCall('/manager/branches', {
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

  // Sales Management
  async getSales(params = {}) {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 50,
      ...(params.start_date && { start_date: params.start_date }),
      ...(params.end_date && { end_date: params.end_date }),
      ...(params.status && { status: params.status }),
      ...(params.payment_method && { payment_method: params.payment_method }),
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
    });

    return await makeApiCall(`/manager/dashboard/top-selling?${queryParams}`, { method: 'GET' });
  },
};

export default managerService;
