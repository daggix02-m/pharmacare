import { makeApiCall } from '../api/apiClient';

/**
 * Cashier Service
 * Handles all cashier-related API calls
 */

export const cashierService = {
  // ============ PAYMENT MANAGEMENT ============

  /**
   * Get pending payments
   * @returns {Promise<Object>} List of pending payments
   */
  async getPendingPayments() {
    return await makeApiCall('/cashier/payments/pending', {
      method: 'GET',
    });
  },

  /**
   * Get payment details by sale ID
   * @param {number} saleId - Sale ID
   * @returns {Promise<Object>} Payment details
   */
  async getPaymentDetails(saleId) {
    return await makeApiCall(`/cashier/payments/${saleId}`, {
      method: 'GET',
    });
  },

  /**
   * Accept payment for a sale
   * @param {number} saleId - Sale ID
   * @param {Object} paymentData - Payment data
   * @param {string} paymentData.payment_method - Payment method (cash, card)
   * @param {number} paymentData.amount_paid - Amount paid
   * @param {number} paymentData.change - Change to give
   * @returns {Promise<Object>} Payment result
   */
  async acceptPayment(saleId, paymentData) {
    return await makeApiCall(`/cashier/payments/${saleId}/accept`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  // ============ RECEIPTS ============

  /**
   * Get receipts with filters
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Receipts list
   */
  async getReceipts(params = {}) {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 50,
      ...(params.start_date && { start_date: params.start_date }),
      ...(params.end_date && { end_date: params.end_date }),
      ...(params.customer_name && { customer_name: params.customer_name }),
      ...(params.sale_id && { sale_id: params.sale_id }),
    });

    return await makeApiCall(`/cashier/receipts?${queryParams}`, {
      method: 'GET',
    });
  },

  /**
   * Get receipt by sale ID
   * @param {number} saleId - Sale ID
   * @returns {Promise<Object>} Receipt details
   */
  async getReceiptById(saleId) {
    return await makeApiCall(`/cashier/receipts/${saleId}`, {
      method: 'GET',
    });
  },

  /**
   * Email receipt to customer
   * @param {number} saleId - Sale ID
   * @param {Object} emailData - Email data
   * @param {string} emailData.email - Customer email
   * @param {boolean} emailData.include_details - Include detailed receipt
   * @returns {Promise<Object>} Email result
   */
  async emailReceipt(saleId, emailData) {
    return await makeApiCall(`/cashier/receipts/${saleId}/email`, {
      method: 'POST',
      body: JSON.stringify(emailData),
    });
  },

  // ============ RETURNS ============

  /**
   * Get sales eligible for return
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Sales list
   */
  async getSalesForReturn(params = {}) {
    const queryParams = new URLSearchParams({
      ...(params.start_date && { start_date: params.start_date }),
    });

    return await makeApiCall(`/cashier/returns/sales?${queryParams}`, {
      method: 'GET',
    });
  },

  /**
   * Get sale items for return
   * @param {number} saleId - Sale ID
   * @returns {Promise<Object>} Sale items
   */
  async getSaleItems(saleId) {
    return await makeApiCall(`/cashier/returns/sales/${saleId}/items`, {
      method: 'GET',
    });
  },

  /**
   * Process return
   * @param {Object} returnData - Return data
   * @param {number} returnData.sale_id - Sale ID
   * @param {Array} returnData.items - Items to return
   * @returns {Promise<Object>} Return result
   */
  async processReturn(returnData) {
    return await makeApiCall('/cashier/returns', {
      method: 'POST',
      body: JSON.stringify(returnData),
    });
  },

  // ============ REPORTS ============

  /**
   * Get payment reports
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Payment reports
   */
  async getPaymentReports(params = {}) {
    const queryParams = new URLSearchParams({
      ...(params.start_date && { start_date: params.start_date }),
      ...(params.end_date && { end_date: params.end_date }),
      ...(params.payment_method && { payment_method: params.payment_method }),
    });

    return await makeApiCall(`/cashier/reports/payments?${queryParams}`, {
      method: 'GET',
    });
  },

  /**
   * Get return reports
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Return reports
   */
  async getReturnReports(params = {}) {
    const queryParams = new URLSearchParams({
      ...(params.start_date && { start_date: params.start_date }),
      ...(params.end_date && { end_date: params.end_date }),
    });

    return await makeApiCall(`/cashier/reports/returns?${queryParams}`, {
      method: 'GET',
    });
  },

  /**
   * Get cashier performance report
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Performance report
   */
  async getPerformanceReport(params = {}) {
    const queryParams = new URLSearchParams({
      ...(params.start_date && { start_date: params.start_date }),
      ...(params.end_date && { end_date: params.end_date }),
    });

    return await makeApiCall(`/cashier/reports/performance?${queryParams}`, {
      method: 'GET',
    });
  },

  // ============ DASHBOARD ============

  /**
   * Get cashier dashboard data
   * @returns {Promise<Object>} Dashboard data including performance, payments, and transactions
   */
  async getDashboard() {
    return await makeApiCall('/cashier/dashboard', {
      method: 'GET',
    });
  },
};

export default cashierService;
