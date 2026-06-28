/**
 * API Error Handling Utilities
 * 
 * Provides functions to extract meaningful error messages from API responses
 * and handle different error scenarios gracefully.
 * 
 * @module utils/apiErrors
 */

/**
 * Extracts a user-friendly error message from an axios error
 * @param {Error} error - Axios error object
 * @returns {string} User-friendly error message
 */
export function getErrorMessage(error) {
  if (!error) return "An unexpected error occurred";

  // Network error
  if (error.message === "Network Error" || !error.response) {
    return "Network error. Please check your internet connection.";
  }

  // Server error response
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  // HTTP status codes
  const status = error.response?.status;
  const statusMessages = {
    400: "Invalid request. Please check your input.",
    401: "Session expired. Please log in again.",
    403: "You don't have permission to perform this action.",
    404: "The requested resource was not found.",
    408: "Request timeout. Please try again.",
    429: "Too many requests. Please wait a moment.",
    500: "Server error. Please try again later.",
    502: "Service temporarily unavailable.",
    503: "Service is undergoing maintenance.",
  };

  return statusMessages[status] || error.message || "An error occurred. Please try again.";
}

/**
 * Checks if an error is a network error
 * @param {Error} error - Axios error object
 * @returns {boolean}
 */
export function isNetworkError(error) {
  return !error.response || error.message === "Network Error";
}

/**
 * Checks if an error is an authentication error
 * @param {Error} error - Axios error object
 * @returns {boolean}
 */
export function isAuthError(error) {
  return error.response?.status === 401 || error.response?.status === 403;
}

/**
 * Checks if an error is a validation error
 * @param {Error} error - Axios error object
 * @returns {boolean}
 */
export function isValidationError(error) {
  return error.response?.status === 400;
}

/**
 * Logs error for debugging (can be extended to send to logging service)
 * @param {string} context - Where the error occurred (e.g., "TaskCard.jsx")
 * @param {Error} error - The error to log
 * @param {object} [additional] - Additional context data
 */
export function logError(context, error, additional = {}) {
  if (process.env.NODE_ENV === "development") {
    console.error(`[${context}] Error:`, error, additional);
  }
  // Future: Send to error tracking service (Sentry, etc.)
}

/**
 * Extracts field-level validation errors
 * @param {Error} error - Axios error object
 * @returns {object} Object with field names as keys and error messages as values
 */
export function getValidationErrors(error) {
  if (error.response?.data?.errors) {
    return error.response.data.errors;
  }
  if (error.response?.data?.validation) {
    return error.response.data.validation;
  }
  return {};
}
