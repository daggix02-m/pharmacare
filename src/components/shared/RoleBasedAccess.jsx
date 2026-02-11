import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Component to render content based on user role
export const RoleBasedAccess = ({ allowedRoles, children, fallback = null }) => {
  const { userRole } = useAuth();

  if (!userRole) {
    // If user is not authenticated, show fallback
    return fallback;
  }

  // Check if the user's role is in the allowed roles list
  const hasAccess = allowedRoles.includes(userRole.toLowerCase());

  return hasAccess ? children : fallback;
};

// Component to render content based on user permissions
export const PermissionBasedAccess = ({ 
  requiredPermissions, 
  requireAll = true, 
  children, 
  fallback = null 
}) => {
  const { user } = useAuth();
  
  // For now, we'll use role-based as a fallback
  // This would be enhanced with a permission checking API in the future
  const hasAccess = user?.role_id === 1 || user?.role_id === 2; // Admin or Manager
  
  return hasAccess ? children : fallback;
};

// Hook to check if user has specific permissions
export const usePermission = (permissionName) => {
  const { user } = useAuth();
  
  if (!user) return false;

  const isAdmin = user.role_id === 1;
  const isManager = user.role_id === 2;
  
  // Manager-specific permissions
  const managerPermissions = [
    'managers.create',
    'managers.read',
    'managers.update',
    'managers.delete',
    'users.create',
    'users.read',
    'users.update',
    'users.delete',
    'users.assign_role',
  ];
  
  // Admin has all permissions
  if (isAdmin) return true;
  
  // Manager has specific permissions
  if (isManager && managerPermissions.includes(permissionName)) return true;
  
  return false;
};

// Hook to check if user has multiple permissions
export const usePermissions = (permissionNames, requireAll = true) => {
  const { user } = useAuth();
  
  if (!user) return false;

  const isAdmin = user.role_id === 1;
  
  // Admin has all permissions
  if (isAdmin) return true;
  
  // Check each permission
  const permissionResults = permissionNames.map(name => usePermission(name));
  
  if (requireAll) {
    return permissionResults.every(result => result);
  } else {
    return permissionResults.some(result => result);
  }
};

// Hook to check if user has specific role
export const useRoleAccess = (requiredRole) => {
  const { userRole } = useAuth();
  
  if (!userRole) {
    return false;
  }
  
  return userRole.toLowerCase() === requiredRole.toLowerCase();
};

// Hook to check if user has any of the required roles
export const useMultipleRoleAccess = (requiredRoles) => {
  const { userRole } = useAuth();
  
  if (!userRole) {
    return false;
  }
  
  return requiredRoles.some(role => role.toLowerCase() === userRole.toLowerCase());
};

// Hook to check if user can create managers
export const useCanCreateManagers = () => {
  return usePermission('managers.create');
};

// Hook to check if user can delete managers
export const useCanDeleteManagers = () => {
  return usePermission('managers.delete');
};

// Hook to check if user can update managers
export const useCanUpdateManagers = () => {
  return usePermission('managers.update');
};

// Hook to check if user can read managers
export const useCanReadManagers = () => {
  return usePermission('managers.read');
};

// Hook to check if user can manage users
export const useCanManageUsers = () => {
  return usePermissions(['users.create', 'users.read', 'users.update', 'users.delete'], false);
};

// Security utility functions
export const securityUtils = {
  /**
   * Check if current user can perform action
   */
  canPerformAction: (action, targetUser = null) => {
    const { user } = useAuth();
    
    if (!user) return false;

    const rules = {
      create_manager: user.role_id === 2, // Only managers can create managers
      delete_manager: user.role_id === 2 && user.id !== targetUser?.id, // Can't delete self
      modify_manager: user.role_id === 2 && user.id !== targetUser?.id, // Can't modify self
      reset_password: user.role_id === 2 || user.role_id === 1, // Managers and admins
    };

    return rules[action] || false;
  },

  /**
   * Sanitize user input to prevent XSS
   */
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  /**
   * Validate email format
   */
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Check for disposable email domains
   */
  isDisposableEmail: (email) => {
    const disposableDomains = [
      'tempmail.com',
      'throwaway.email',
      '10minutemail.com',
      'guerrillamail.com',
      'mailinator.com',
    ];
    
    const domain = email.split('@')[1]?.toLowerCase();
    return disposableDomains.includes(domain);
  },
};