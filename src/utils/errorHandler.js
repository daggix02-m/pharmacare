/**
 * Centralized Error Handler Utility
 * Parses API and runtime errors into user-friendly messages
 */

export const parseError = (error) => {
  // Handle null or undefined errors
  if (error === null || error === undefined) {
    return 'An unknown error occurred. Please try again later.';
  }

  // If it's already a string, return it
  if (typeof error === 'string') return error;

  // Handle standard Error objects first (check specific error types)
  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return 'The request timed out. Please check your connection.';
    }
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Network error. Please check your internet connection.';
    }
    return error.message;
  }

  // Handle the error object returned by makeApiCall/apiClient
  if (error && typeof error === 'object') {
    if (error.message) return error.message;
    if (error.error) return error.error;
    
    // Handle Axios/Fetch errors with response data
    if (error.response && error.response.data) {
      const data = error.response.data;
      return data.message || data.error || 'An unexpected server error occurred';
    }
  }

  return 'An unknown error occurred. Please try again later.';
};

/**
 * Log error to external service (Mock)
 */
export const logError = (error, context = {}) => {
  const errorData = {
    context,
    timestamp: new Date().toISOString(),
  };
  
  // Only add message and stack if error is an object with those properties
  if (error && typeof error === 'object' && error !== null) {
    errorData.message = error.message;
    errorData.stack = error.stack;
  } else if (error !== null && error !== undefined) {
    // For strings or other primitives
    errorData.message = String(error);
  } else if (error === null) {
    // For null, explicitly set message to null
    errorData.message = null;
  } else {
    // For undefined, explicitly set message to undefined
    errorData.message = undefined;
  }
  
  console.error('[GLOBAL ERROR LOG]', errorData);
  // In production, you would send this to Sentry, LogRocket, etc.
};

export default {
  parseError,
  logError,
};
