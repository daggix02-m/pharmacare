import { makeApiCall } from '../api/apiClient';

/**
 * Cashier Service
 * Handles all cashier-related API calls
 * Strictly implements only the endpoints specified in the API specification
 */

export const cashierService = {
  // ============ DASHBOARD & CORE VIEWS ============

  /**
   * Get cashier dashboard data
   * @returns {Promise<Object>} Dashboard data including performance, payments and transactions
   */
  async getDashboard() {
    return await makeApiCall('/cashier/dashboard', {
      method: 'GET',
    });
  },

  /**
   * Get cashier sales data
   * @returns {Promise<Object>} Sales data
   */
  async getSales() {
    return await makeApiCall('/cashier/sales', {
      method: 'GET',
    });
  },

  /**
   * Get available products
   * @returns {Promise<Object>} Available products
   */
  async getProducts() {
    return await makeApiCall('/cashier/products', {
      method: 'GET',
    });
  },

  /**
   * Get cashier session info
   * @returns {Promise<Object>} Session information
   */
  async getSessions() {
    return await makeApiCall('/cashier/sessions', {
      method: 'GET',
    });
  },

  // ============ PAYMENTS ============

  /**
   * Get pending payments notifications
   * @returns {Promise<Object>} List of pending payments
   */
  async getNotifications() {
    return await makeApiCall('/cashier/notifications', {
      method: 'GET',
    });
  },

  /**
   * Get payment details by payment ID
   * @param {number} id - Payment ID
   * @returns {Promise<Object>} Payment details / history
   */
  async getPaymentDetails(id) {
    return await makeApiCall(`/cashier/payments/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Accept payment for a sale (cash / reference)
   * @param {number} id - Payment ID
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Payment result
   */
  async acceptPayment(id, paymentData) {
    return await makeApiCall(`/cashier/payments/${id}/accept`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  // ============ RECEIPTS ============

  /**
   * Get receipt by sale ID
   * @param {number} id - Sale ID
   * @returns {Promise<Object>} Receipt details
   */
  async getReceiptById(id) {
    return await makeApiCall(`/cashier/receipts/${id}`, {
      method: 'GET',
    });
  },

  // ============ RETURNS ============

  /**
   * Process return
   * @param {Object} returnData - Return data
   * @returns {Promise<Object>} Return result
   */
  async processReturn(returnData) {
    return await makeApiCall('/cashier/returns', {
      method: 'POST',
      body: JSON.stringify(returnData),
    });
  },

  /**
   * Get return details by receipt number
   * @param {number} receiptNumber - Receipt number
   * @returns {Promise<Object>} Return details
   */
  async getReturnByReceipt(receiptNumber) {
    return await makeApiCall(`/cashier/returns/receipt/${receiptNumber}`, {
      method: 'GET',
    });
  },

  // ============ REPORTS ============

  /**
   * Get sold medicines report
   * @returns {Promise<Object>} Sold medicines report
   */
  async getSoldMedicinesReport() {
    return await makeApiCall('/cashier/reports/sold-medicines', {
      method: 'GET',
    });
  },

  /**
   * Get returns report
   * @returns {Promise<Object>} Returns report
   */
  async getReturnReports() {
    return await makeApiCall('/cashier/reports/returns', {
      method: 'GET',
    });
  },
};

export default cashierService;
