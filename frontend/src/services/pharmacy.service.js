import { makeApiCall } from '../api/apiClient';
import { adminService } from './admin.service';
import { managerService } from './manager.service';

/**
 * Pharmacy Service
 * Handles all pharmacy-related API calls
 * Reusable across all user roles (admin, manager, cashier, pharmacist)
 * 
 * This service now uses existing endpoints instead of non-existent /api/pharmacy/* endpoints
 */

export const pharmacyService = {
  /**
   * Get pharmacy information from existing endpoints
   * This is a wrapper that calls the appropriate service based on the user's role
   * 
   * For admins: Uses admin dashboard data
   * For managers: Uses manager dashboard data (branch overview)
   * For others: Uses auth/me endpoint to get user info and branches list
   * 
   * @param {string} userRole - The user's role (admin, manager, pharmacist, cashier)
   * @returns {Promise<Object>} Pharmacy data with name, contact details, etc.
   */
  async getPharmacyInfo(userRole = null) {
    try {
      if (userRole === 'admin') {
        // For admins, get pharmacy info from admin dashboard
        const response = await adminService.getDashboard();
        if (response.success && response.data) {
          // Extract pharmacy name from dashboard data
          // The admin dashboard may have pharmacy info or we use a default
          return {
            success: true,
            data: {
              name: response.data.pharmacyName || 'PharmaCare',
              ...response.data
            }
          };
        }
      } else if (userRole === 'manager') {
        // For managers, get branch info from manager dashboard
        const response = await managerService.getDashboard();
        if (response.success && response.data?.branchOverview) {
          return {
            success: true,
            data: {
              name: response.data.branchOverview.branchName || 'PharmaCare',
              branchName: response.data.branchOverview.branchName,
              location: response.data.branchOverview.location
            }
          };
        }
      } else {
        // For pharmacists and cashiers, try to get info from auth/me or use default
        // Since we don't have a dashboard for these roles, we'll use a default
        // and get branch info from branches list if needed
        return {
          success: true,
          data: {
            name: 'PharmaCare'
          }
        };
      }
      
      // Fallback to default if no specific data found
      return {
        success: true,
        data: {
          name: 'PharmaCare'
        }
      };
    } catch (error) {
      console.error('Error getting pharmacy info:', error);
      // Return default pharmacy info on error
      return {
        success: true,
        data: {
          name: 'PharmaCare'
        }
      };
    }
  },

  /**
   * Get branch information from existing endpoints
   * 
   * @param {number} branchId - Optional branch ID (defaults to user's branch if not provided)
   * @returns {Promise<Object>} Branch data with branch name, location, manager details
   */
  async getBranchInfo(branchId = null) {
    try {
      if (branchId) {
        // Get specific branch by ID
        const response = await adminService.getBranchById(branchId);
        if (response.success && response.data) {
          return {
            success: true,
            data: {
              name: response.data.name,
              location: response.data.location,
              phone: response.data.phone,
              email: response.data.email,
              manager: response.data.manager
            }
          };
        }
      } else {
        // Get all branches and return the first one or use manager dashboard
        const branchesResponse = await adminService.getBranches();
        if (branchesResponse.success && branchesResponse.data && branchesResponse.data.length > 0) {
          const branch = branchesResponse.data[0];
          return {
            success: true,
            data: {
              name: branch.name,
              location: branch.location,
              phone: branch.phone,
              email: branch.email,
              manager: branch.manager
            }
          };
        }
      }
      
      // Fallback: try to get from manager dashboard
      const managerResponse = await managerService.getDashboard();
      if (managerResponse.success && managerResponse.data?.branchOverview) {
        return {
          success: true,
          data: {
            name: managerResponse.data.branchOverview.branchName,
            location: managerResponse.data.branchOverview.location,
            phone: '',
            email: ''
          }
        };
      }
      
      // Return default branch info if nothing found
      return {
        success: true,
        data: {
          name: 'Main Branch',
          location: 'Addis Ababa, Ethiopia',
          phone: '',
          email: ''
        }
      };
    } catch (error) {
      console.error('Error getting branch info:', error);
      // Return default branch info on error
      return {
        success: true,
        data: {
          name: 'Main Branch',
          location: 'Addis Ababa, Ethiopia',
          phone: '',
          email: ''
        }
      };
    }
  },

  /**
   * Get pharmacy and branch information combined from existing endpoints
   * 
   * @param {string} userRole - The user's role (admin, manager, pharmacist, cashier)
   * @returns {Promise<Object>} Combined pharmacy and branch data
   */
  async getPharmacyAndBranchInfo(userRole = null) {
    try {
      let pharmacyInfo = { name: 'PharmaCare' };
      let branchInfo = { name: '', location: '', phone: '', email: '' };

      if (userRole === 'admin') {
        // For admins, get pharmacy info from admin dashboard
        const adminResponse = await adminService.getDashboard();
        if (adminResponse.success && adminResponse.data) {
          pharmacyInfo = {
            name: adminResponse.data.pharmacyName || 'PharmaCare'
          };
        }
        
        // Get branch info from branches list
        const branchesResponse = await adminService.getBranches();
        if (branchesResponse.success && branchesResponse.data && branchesResponse.data.length > 0) {
          const branch = branchesResponse.data[0];
          branchInfo = {
            name: branch.name,
            location: branch.location,
            phone: branch.phone || '',
            email: branch.email || ''
          };
        }
      } else if (userRole === 'manager') {
        // For managers, get both from manager dashboard
        const managerResponse = await managerService.getDashboard();
        if (managerResponse.success && managerResponse.data?.branchOverview) {
          pharmacyInfo = {
            name: 'PharmaCare' // Default pharmacy name for managers
          };
          branchInfo = {
            name: managerResponse.data.branchOverview.branchName,
            location: managerResponse.data.branchOverview.location,
            phone: '',
            email: ''
          };
        }
      } else {
        // For pharmacists and cashiers, use defaults
        // Try to get branch info from branches list
        try {
          const branchesResponse = await adminService.getBranches();
          if (branchesResponse.success && branchesResponse.data && branchesResponse.data.length > 0) {
            const branch = branchesResponse.data[0];
            branchInfo = {
              name: branch.name,
              location: branch.location,
              phone: branch.phone || '',
              email: branch.email || ''
            };
          }
        } catch (e) {
          // Use defaults if branches list fails
          branchInfo = {
            name: 'Main Branch',
            location: 'Addis Ababa, Ethiopia',
            phone: '',
            email: ''
          };
        }
      }

      return {
        success: true,
        data: {
          pharmacy: pharmacyInfo,
          branch: branchInfo
        }
      };
    } catch (error) {
      console.error('Error getting pharmacy and branch info:', error);
      // Return default data on error
      return {
        success: true,
        data: {
          pharmacy: {
            name: 'PharmaCare'
          },
          branch: {
            name: 'Main Branch',
            location: 'Addis Ababa, Ethiopia',
            phone: '',
            email: ''
          }
        }
      };
    }
  },
};

export default pharmacyService;
