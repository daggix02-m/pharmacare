import React, { createContext, useContext, useState, useEffect } from 'react';
import { getProfile, logout as apiLogout } from '@/api/auth.api';
import { getToken, removeToken } from '@/api/apiClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = getToken('accessToken');
      if (token) {
        try {
          const response = await getProfile();
          if (response.success) {
            setUser({
              id: response.user?.id,
              email: response.user?.email,
              full_name: response.user?.full_name,
              role_id: response.user?.role_id,
              branch_id: response.user?.branch_id,
              role: getToken('userRole') || 'user'
            });
            setIsAuthenticated(true);
          } else {
            // Token is invalid, clear it
            removeToken('accessToken');
            removeToken('refreshToken');
            removeToken('userRole');
            removeToken('userId');
            removeToken('userName');
            removeToken('userEmail');
            removeToken('roleId');
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Error checking auth status:', error);
          // Clear invalid token
          removeToken('accessToken');
          removeToken('refreshToken');
          removeToken('userRole');
          removeToken('userId');
          removeToken('userName');
          removeToken('userEmail');
          removeToken('roleId');
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setLoading(false);
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      removeToken('accessToken');
      removeToken('refreshToken');
      removeToken('userRole');
      removeToken('userId');
      removeToken('userName');
      removeToken('userEmail');
      removeToken('roleId');
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    role: user?.role,
    userId: user?.id,
    userEmail: user?.email,
    userRole: user?.role,
    roleId: user?.role_id,
    branchId: user?.branch_id
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};