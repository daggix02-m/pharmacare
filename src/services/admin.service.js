import { makeApiCall } from '@/api/apiClient';
import { resendVerification, verifyEmail } from '@/api/auth.api';

const getDashboard = async () => {
  return await makeApiCall('/admin/dashboard', { method: 'GET' });
};

const getBranches = async () => {
  return await makeApiCall('/admin/dashboard/branches-list', { method: 'GET' });
};

const getBranchesList = async () => {
  return await makeApiCall('/admin/dashboard/branches-list', { method: 'GET' });
};

const getActiveBranches = async () => {
  return await makeApiCall('/admin/branches/active', { method: 'GET' });
};

const getBranchById = async (branchId) => {
  return await makeApiCall(`/admin/dashboard/branches/${branchId}`, { method: 'GET' });
};

const getManagers = async () => {
  return await makeApiCall('/admin/managers', { method: 'GET' });
};

const getPendingManagers = async () => {
  return await makeApiCall('/admin/managers/pending', { method: 'GET' });
};

const getActivatedManagers = async () => {
  return await makeApiCall('/admin/managers/activated', { method: 'GET' });
};

const activateManager = async (userId) => {
  return await makeApiCall(`/admin/managers/${userId}/activate`, { method: 'PUT' });
};

const deactivateManager = async (userId) => {
  return await makeApiCall(`/admin/managers/${userId}/deactivate`, { method: 'PUT' });
};

const getManagerById = async (userId) => {
  return await makeApiCall(`/admin/managers/${userId}`, { method: 'GET' });
};

const resetManagerPassword = async (userId, passwordData) => {
  return await makeApiCall(`/admin/managers/${userId}/reset-password`, {
    method: 'POST',
    body: JSON.stringify(passwordData),
  });
};

const createBranch = async (branchData) => {
  return await makeApiCall('/admin/branches', {
    method: 'POST',
    body: JSON.stringify(branchData),
  });
};

const updateBranch = async (branchId, branchData) => {
  return await makeApiCall(`/admin/branches/${branchId}`, {
    method: 'PUT',
    body: JSON.stringify(branchData),
  });
};

const deleteBranch = async (branchId) => {
  return await makeApiCall(`/admin/branches/${branchId}`, { method: 'DELETE' });
};

const activateBranch = async (branchId) => {
  return await makeApiCall(`/admin/dashboard/branches/${branchId}/activate`, { method: 'PUT' });
};

const deactivateBranch = async (branchId) => {
  return await makeApiCall(`/admin/dashboard/branches/${branchId}/deactivate`, { method: 'PUT' });
};

const createManager = async (managerData) => {
  return await makeApiCall('/admin/managers', {
    method: 'POST',
    body: JSON.stringify(managerData),
  });
};

const updateManager = async (userId, managerData) => {
  return await makeApiCall(`/admin/managers/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(managerData),
  });
};

const deleteManager = async (userId) => {
  return await makeApiCall(`/admin/managers/${userId}`, { method: 'DELETE' });
};

const getRecentActivity = async () => {
  return await makeApiCall('/admin/dashboard/activity', { method: 'GET' });
};

const sendVerificationCode = async (email) => {
  return await resendVerification(email);
};

const verifyManagerCode = async (email, code) => {
  return await verifyEmail(email, code);
};

export const adminService = {
  getDashboard,
  getBranches,
  getBranchesList,
  getActiveBranches,
  getBranchById,
  getManagers,
  getPendingManagers,
  getActivatedManagers,
  activateManager,
  deactivateManager,
  getManagerById,
  resetManagerPassword,
  createBranch,
  updateBranch,
  deleteBranch,
  activateBranch,
  deactivateBranch,
  createManager,
  updateManager,
  deleteManager,
  getRecentActivity,
  sendVerificationCode,
  verifyManagerCode,
};

export default adminService;
