/**
 * Centralized Error Handler Utility
 * Parses API and runtime errors into user-friendly messages
 */

export const parseError = (error) => {
  // If it's already a string, return it
  if (typeof error === 'string') return error;

  // Handle Axios/Fetch errors with response data
  if (error.response && error.response.data) {
    const data = error.response.data;
    return data.message || data.error || 'An unexpected server error occurred';
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return 'The request timed out. Please check your connection.';
    }
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Network error. Please check your internet connection.';
    }
    return error.message;
  }

  return 'An unknown error occurred. Please try again later.';
};

/**
 * Log error to external service (Mock)
 */
export const logError = (error, context = {}) => {
  console.error('[GLOBAL ERROR LOG]', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
  // In production, you would send this to Sentry, LogRocket, etc.
};

export default {
  parseError,
  logError,
};
