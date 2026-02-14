import { apiClient, makeApiCall, setToken } from './apiClient';

export const login = async (email, password) => {
  const response = await makeApiCall('/auth/login', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ email, password }),
  });

  if (response.success) {
    if (response.token) {
      setToken('accessToken', response.token);
    }
    if (response.refreshToken) {
      setToken('refreshToken', response.refreshToken);
    }

    let userRole = 'user';
    const userData = response.user || response.users;

    if (userData) {
      switch (userData.role_id) {
        case 1:
          userRole = 'admin';
          break;
        case 2:
          userRole = 'manager';
          break;
        case 3:
          userRole = 'pharmacist';
          break;
        case 4:
          userRole = 'cashier';
          break;
        default:
          userRole = 'user';
      }
    }

    if (userRole) {
      setToken('userRole', userRole);
      response.role = userRole;
    }

    if (userData) {
      setToken('userId', userData.id || userData.user_id || '');
      setToken('userName', userData.full_name || userData.name || '');
      setToken('userEmail', userData.email || '');
      setToken('roleId', userData.role_id || '');
      setToken('branchId', userData.branch_id || '');
    }

    if (
      response.requiresPasswordChange ||
      response.mustChangePassword ||
      (userData && userData.must_change_password)
    ) {
      response.requiresPasswordChange = true;
    }
  }

  return response;
};

export const signup = async (full_name, email, password, role_id, branch_id) => {
  return await makeApiCall('/auth/register', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({
      full_name,
      email,
      password,
      role_id,
      branch_id,
    }),
  });
};

export const signupManager = async (managerData) => {
  const result = await makeApiCall('/auth/register', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify(managerData),
  });
  return result;
};

export const resendVerification = async (email) => {
  return await makeApiCall('/auth/resend-verification', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ email }),
  });
};

export const resetPassword = async (token, newPassword) => {
  const response = await makeApiCall('/auth/reset-password', {
    method: 'POST',
    skipAuth: true,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, newPassword }),
  });

  return response;
};

export const logout = async () => {
  try {
    const token = localStorage.getItem('accessToken');
    if (token) {
      await apiClient('/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    console.warn('Server logout failed:', error.message);
  } finally {
    import('./apiClient')
      .then(({ removeToken }) => {
        removeToken('accessToken');
        removeToken('refreshToken');
        removeToken('userRole');
        removeToken('userId');
        removeToken('userName');
        removeToken('userEmail');
        removeToken('roleId');
        removeToken('branchId');
      })
      .catch(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('roleId');
        localStorage.removeItem('branchId');
      });
  }
};

/**
 * Refresh access token using refresh token
 * SECURITY WARNING: Refresh tokens stored in localStorage are vulnerable to XSS attacks.
 * Production implementation should use httpOnly cookies with SameSite=Strict/Lax.
 */
export const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await makeApiCall('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });

  if (response.success && response.token) {
    import('./apiClient')
      .then(({ setToken }) => {
        setToken('accessToken', response.token);
      })
      .catch(() => {
        localStorage.setItem('accessToken', response.token);
      });
    return response.token;
  } else {
    import('./apiClient')
      .then(({ removeToken }) => {
        removeToken('accessToken');
        removeToken('refreshToken');
      })
      .catch(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      });
    throw new Error(response.message || 'Token refresh failed');
  }
};

export const verifyEmail = async (email, verificationCode) => {
  return await makeApiCall('/auth/verify-email', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ email, verification_code: verificationCode }),
  });
};

export const forgotPassword = async (email) => {
  const response = await makeApiCall('/auth/forgot-password', {
    method: 'POST',
    skipAuth: true,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  return response;
};

export const verifyToken = async () => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return { success: false, message: 'No token available' };
  }

  try {
    const response = await apiClient('/auth/verify', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      success: true,
      ...response,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const getBranches = async () => {
  return await makeApiCall('/branches', {
    method: 'GET',
  });
};

export const createBranch = async (branchData) => {
  return await makeApiCall('/branches', {
    method: 'POST',
    body: JSON.stringify(branchData),
  });
};

export const getUsers = async () => {
  return await makeApiCall('/users', {
    method: 'GET',
  });
};

export const createUser = async (userData) => {
  return await makeApiCall('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

export const changePassword = async (currentPassword, newPassword) => {
  const token = localStorage.getItem('accessToken');

  const response = await makeApiCall('/auth/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: newPassword,
    }),
  });

  return response;
};

export const getProfile = async () => {
  return await makeApiCall('/auth/me', {
    method: 'GET',
  });
};

export const updateProfile = async (profileData) => {
  const isFormData = profileData instanceof FormData;
  
  return await makeApiCall('/auth/profile', {
    method: 'PUT',
    body: isFormData ? profileData : JSON.stringify(profileData),
    skipContentType: isFormData,
  });
};
