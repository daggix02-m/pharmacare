const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://pharmacare-api.onrender.com';

// Log the API_BASE_URL for debugging
console.log('[API CLIENT DEBUG] Environment variables:', {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  API_BASE_URL: API_BASE_URL,
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE
});

const normalizeUrl = (baseUrl, endpoint) => {
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  const normalizedUrl = `${cleanBaseUrl}/${cleanEndpoint}`;
  console.log('[API CLIENT DEBUG] URL normalization:', {
    baseUrl,
    endpoint,
    cleanBaseUrl,
    cleanEndpoint,
    normalizedUrl
  });
  return normalizedUrl;
};

const isStorageAvailable = () => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

const fetchWithTimeout = (url, options = {}, timeoutMs = 60000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
};

const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const fetchWithRetry = async (url, options = {}, maxRetries = 3) => {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      lastError = error;

      if (error.name === 'AbortError' || attempt === maxRetries - 1) {
        throw error;
      }

      const backoffTime = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, backoffTime));
    }
  }

  throw lastError;
};

export const apiClient = async (endpoint, options = {}) => {
  const url = normalizeUrl(API_BASE_URL, endpoint);
  const currentToken = getToken('accessToken');

  const shouldAddContentType = options.skipContentType !== true && options.body;
  const shouldAddAuth = options.skipAuth !== true && !!currentToken;

  const config = {
    headers: {
      ...(shouldAddContentType && { 'Content-Type': 'application/json' }),
      ...(shouldAddAuth && { Authorization: `Bearer ${currentToken}` }),
      ...options.headers,
    },
    ...options,
  };

  delete config.skipContentType;
  delete config.skipAuth;

  // Log API request details for debugging
  console.log('[API CLIENT] Request Details:', {
    endpoint,
    fullUrl: url,
    method: config.method || 'GET',
    hasAuth: shouldAddAuth,
    hasBody: !!options.body,
    apiBaseUrl: API_BASE_URL
  });

  try {
    let response = await fetchWithTimeout(url, config);

    // Log response details for debugging
    console.log('[API CLIENT] Response Details:', {
      endpoint,
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    });

    if (!response.ok && response.status === 0) {
      throw new Error(
        'CORS error: The API may not be configured to accept requests from this domain. Contact the administrator to ensure proper CORS configuration.'
      );
    }

    if (response.status === 401) {
      const publicEndpoints = [
        '/auth/login',
        '/auth/register',
        '/auth/forgot-password',
        '/auth/reset-password',
        '/auth/verify-email',
        '/auth/resend-verification',
        '/auth/change-password',
      ];

      const isPublicAuthEndpoint = publicEndpoints.some(
        (publicEndpoint) => endpoint === publicEndpoint || endpoint.endsWith(publicEndpoint)
      );

      if (!isPublicAuthEndpoint) {
        if (isStorageAvailable()) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userRole');
          localStorage.removeItem('userId');
          localStorage.removeItem('userName');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('roleId');
          localStorage.removeItem('branchId');
        } else {
          try {
            sessionStorage.clear();
          } catch (e) {
            console.error(e);
          }
        }

        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }

        throw new Error('Session expired. Please login again.');
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('[API CLIENT] Error Data:', errorData);
      console.log('[API CLIENT] Full Error Details:', JSON.stringify(errorData, null, 2));
      let errorMessage = errorData.message;

      const isPostgreSQLError = errorMessage?.includes('function year') ||
                               errorData.errorCode === '42883' ||
                               errorMessage?.includes('timestamp without time zone');
      
      if (isPostgreSQLError) {
        errorMessage = 'Database query error: The backend is using incompatible SQL syntax. Please contact the backend team.';
      }

      switch (response.status) {
        case 400:
          errorMessage = errorMessage || 'Invalid request. Please check your input.';
          break;
        case 403:
          errorMessage = errorMessage || "You don't have permission for this action.";
          break;
        case 404:
          errorMessage = errorMessage || 'Resource not found.';
          break;
        case 409:
          errorMessage = errorMessage || 'This action conflicts with existing data.';
          break;
        case 422:
          errorMessage = errorMessage || 'Validation error. Please check your input.';
          break;
        case 429:
          errorMessage = errorMessage || 'Too many requests. Please try again later.';
          break;
        case 500:
          errorMessage = errorMessage || 'Server error. Please try again later.';
          break;
        case 502:
        case 503:
        case 504:
          errorMessage = errorMessage || 'Service temporarily unavailable. Please try again.';
          break;
        default:
          errorMessage = errorMessage || `HTTP error! status: ${response.status}`;
      }

      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(
        'Request to the server took too long and was cancelled. Please check that the backend is reachable at ' +
          API_BASE_URL +
          ' and try again.'
      );
    }

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
        throw new Error(
          'CORS error: The API may not be configured to accept requests from this domain. Contact the administrator to ensure proper CORS configuration.'
        );
      }
      throw new Error('Network error. Please check your internet connection or backend URL.');
    }

    throw error;
  }
};

export const makeApiCall = async (endpoint, options = {}) => {
  try {
    const response = await apiClient(endpoint, options);
    return { success: true, ...response };
  } catch (error) {
    return { success: false, message: error.message || 'An error occurred during the API call' };
  }
};

export const getAccessToken = () => {
  if (isStorageAvailable()) {
    return localStorage.getItem('accessToken');
  }
  return null;
};

export const isAuthenticated = () => {
  if (isStorageAvailable()) {
    return !!localStorage.getItem('accessToken');
  }
  return false;
};

export const setToken = (key, value) => {
  if (isStorageAvailable()) {
    localStorage.setItem(key, value);
  } else {
    try {
      sessionStorage.setItem(key, value);
    } catch (e) {
      console.error('Storage is not available:', e);
    }
  }
};

export const getToken = (key) => {
  if (isStorageAvailable()) {
    return localStorage.getItem(key);
  } else {
    try {
      return sessionStorage.getItem(key);
    } catch (e) {
      console.error('Storage is not available:', e);
      return null;
    }
  }
};

export const removeToken = (key) => {
  if (isStorageAvailable()) {
    localStorage.removeItem(key);
  } else {
    try {
      sessionStorage.removeItem(key);
    } catch (e) {
      console.error('Storage is not available:', e);
    }
  }
};
