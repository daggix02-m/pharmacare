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

// Hook to check if user has specific permissions
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