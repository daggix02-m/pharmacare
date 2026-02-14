import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * ProtectedRoute Component
 * Protects routes based on authentication and user role
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string|string[]} props.allowedRoles - Role(s) allowed to access this route
 * @param {string} props.redirectTo - Path to redirect unauthorized users (default: /login)
 */
export const ProtectedRoute = ({ children, allowedRoles = [], redirectTo = '/login' }) => {
  const { isAuthenticated, loading, role } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to='/login' state={{ from: location }} replace />;
  }

  // Check if user has required role
  if (allowedRoles.length > 0) {
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const hasRequiredRole = role && rolesArray.includes(role);

    if (!hasRequiredRole) {
      // Redirect to user's default page based on their role
      const defaultPath = getDefaultPathForRole(role);
      return <Navigate to={defaultPath} replace />;
    }
  }

  // User is authenticated and has required role
  return <>{children}</>;
};

/**
 * Get default path based on user role
 * @param {string} role - User role
 * @returns {string} Default path for the role
 */
function getDefaultPathForRole(role) {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'manager':
      return '/manager/dashboard';
    case 'pharmacist':
      return '/pharmacist/dashboard';
    case 'cashier':
      return '/cashier/dashboard';
    default:
      return '/login';
  }
}

export default ProtectedRoute;
