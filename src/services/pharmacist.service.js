import { makeApiCall } from '../api/apiClient';

/**
 * Pharmacist Service
 * Handles all pharmacist-related API calls
 */

export const pharmacistService = {
  // ============ MEDICINE MANAGEMENT ============

  /**
   * Get medicines with filters and pagination
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Medicines list
   */
  async getMedicines(params = {}) {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 50,
      ...(params.search && { search: params.search }),
      ...(params.category_id && { category_id: params.category_id }),
      ...(params.stock_status && { stock_status: params.stock_status }),
    });

    return await makeApiCall(`/api/pharmacist/medicines?${queryParams}`, {
      method: 'GET',
    });
  },

  /**
   * Get medicine by ID
   * @param {number} medicineId - Medicine ID
   * @returns {Promise<Object>} Medicine details
   */
  async getMedicineById(medicineId) {
    try {
      const response = await makeApiCall(`/api/pharmacist/medicines/${medicineId}`, {
        method: 'GET',
      });
      if (response.success) return response;

      // Try manager endpoint if pharmacist one fails
      return await makeApiCall(`/api/manager/medicines/${medicineId}`, {
        method: 'GET',
      });
    } catch (error) {
      return await makeApiCall(`/api/manager/medicines/${medicineId}`, {
        method: 'GET',
      });
    }
  },

  /**
   * Add a new medicine
   * @param {Object} medicineData - Medicine data
   * @returns {Promise<Object>} Created medicine
   */
  async addMedicine(medicineData) {
    return await makeApiCall('/api/pharmacist/medicines', {
      method: 'POST',
      body: JSON.stringify(medicineData),
    });
  },

  /**
   * Update medicine stock
   * @param {number} medicineId - Medicine ID
   * @param {Object} stockData - Stock update data
   * @returns {Promise<Object>} Updated medicine
   */
  async updateMedicineStock(medicineId, stockData) {
    return await makeApiCall(`/api/pharmacist/medicines/${medicineId}/stock`, {
      method: 'PUT',
      body: JSON.stringify(stockData),
    });
  },

  /**
   * Delete medicine
   * @param {number} medicineId - Medicine ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteMedicine(medicineId) {
    return await makeApiCall(`/api/pharmacist/medicines/${medicineId}`, {
      method: 'DELETE',
    });
  },

  // ============ SALES MANAGEMENT ============

  /**
   * Handoff a sale to the cashier
   * @param {Object} handoffData - Handoff data
   * @param {number} handoffData.sale_id - Sale ID
   * @param {string} handoffData.notes - Additional notes
   * @returns {Promise<Object>} Handoff result
   */
  async handoffToCashier(handoffData) {
    return await makeApiCall('/api/pharmacist/handoff-to-cashier', {
      method: 'POST',
      body: JSON.stringify(handoffData),
    });
  },

  /**
   * Create a new sale
   * @param {Object} saleData - Sale data
   * @param {Array} saleData.items - Array of items
   * @param {string} saleData.customer_name - Customer name
   * @param {string} saleData.payment_method - Payment method (cash, card, insurance)
   * @returns {Promise<Object>} Created sale
   */
  async createSale(saleData) {
    return await makeApiCall('/api/pharmacist/sales', {
      method: 'POST',
      body: JSON.stringify(saleData),
    });
  },

  /**
   * Get sales list
   * @returns {Promise<Object>} Sales list
   */
  async getSales() {
    return await makeApiCall('/api/pharmacist/sales', {
      method: 'GET',
    });
  },

  /**
   * Get sale by ID
   * @param {number} saleId - Sale ID
   * @returns {Promise<Object>} Sale details
   */
  async getSaleById(saleId) {
    return await makeApiCall(`/api/pharmacist/sales/${saleId}`, {
      method: 'GET',
    });
  },

  // ============ INVENTORY MANAGEMENT ============

  /**
   * Request restock
   * @param {Object} restockData - Restock request data
   * @param {number} restockData.medicine_id - Medicine ID
   * @param {number} restockData.requested_quantity - Requested quantity
   * @param {string} restockData.priority - Priority (low, medium, high, urgent)
   * @param {string} restockData.notes - Additional notes
   * @returns {Promise<Object>} Restock request result
   */
  async requestRestock(restockData) {
    return await makeApiCall('/api/pharmacist/inventory/request-restock', {
      method: 'POST',
      body: JSON.stringify(restockData),
    });
  },

  /**
   * Mark medicines as low stock
   * @param {Object} data - Low stock data
   * @returns {Promise<Object>} Result
   */
  async markLowStock(data) {
    return await makeApiCall('/api/pharmacist/inventory/mark-low-stock', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get stock history
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Stock history
   */
  async getStockHistory(params = {}) {
    const queryParams = new URLSearchParams({
      ...(params.medicine_id && { medicine_id: params.medicine_id }),
      ...(params.start_date && { start_date: params.start_date }),
      ...(params.end_date && { end_date: params.end_date }),
      ...(params.action_type && { action_type: params.action_type }),
    });

    return await makeApiCall(`/api/pharmacist/inventory/stock-history?${queryParams}`, {
      method: 'GET',
    });
  },

  /**
   * Get restock requests
   * @returns {Promise<Object>} Restock requests list
   */
  async getRestockRequests() {
    return await makeApiCall('/api/pharmacist/inventory/restock-requests', {
      method: 'GET',
    });
  },

  // ============ REPORTS ============

  /**
   * Get low stock report
   * @returns {Promise<Object>} Low stock medicines
   */
  async getLowStockReport() {
    return await makeApiCall('/api/pharmacist/reports/low-stock', {
      method: 'GET',
    });
  },

  /**
   * Get expiry report
   * @param {number} days - Days until expiry
   * @returns {Promise<Object>} Expiring medicines
   */
  async getExpiryReport(days = 30) {
    return await makeApiCall(`/api/pharmacist/reports/expiry?days=${days}`, {
      method: 'GET',
    });
  },

  /**
   * Get inventory summary
   * @returns {Promise<Object>} Inventory summary statistics
   */
  async getInventorySummary() {
    return await makeApiCall('/api/pharmacist/reports/inventory-summary', {
      method: 'GET',
    });
  },

  // ============ DASHBOARD ============

  /**
   * Get pharmacist dashboard data
   * @returns {Promise<Object>} Dashboard data including inventory, sales, and alerts
   */
  async getDashboard() {
    return await makeApiCall('/api/pharmacist/dashboard', {
      method: 'GET',
    });
  },
};

export default pharmacistService;
