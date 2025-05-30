/**
 * Custom Error Classes
 * 
 * This module exports custom error classes for consistent error handling
 * across the application. These errors can be used to provide more specific
 * error information and to handle different types of errors in a consistent way.
 */

/**
 * Base error class for application-specific errors
 * @extends Error
 */
class AppError extends Error {
  /**
   * Create an AppError
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Application-specific error code
   * @param {Object} details - Additional error details
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // This is used to distinguish operational errors from programming errors
    
    // Capture stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error class for authentication related errors
 * @extends AppError
 */
class AuthenticationError extends AppError {
  /**
   * Create an AuthenticationError
   * @param {string} message - Error message
   * @param {Object} details - Additional error details
   */
  constructor(message = 'Authentication failed', details = {}) {
    super(message, 401, 'AUTHENTICATION_FAILED', details);
  }
}

/**
 * Error class for authorization related errors
 * @extends AppError
 */
class AuthorizationError extends AppError {
  /**
   * Create an AuthorizationError
   * @param {string} message - Error message
   * @param {Object} details - Additional error details
   */
  constructor(message = 'Not authorized', details = {}) {
    super(message, 403, 'UNAUTHORIZED', details);
  }
}

/**
 * Error class for not found errors
 * @extends AppError
 */
class NotFoundError extends AppError {
  /**
   * Create a NotFoundError
   * @param {string} resource - Name of the resource that was not found
   * @param {Object} details - Additional error details
   */
  constructor(resource = 'Resource', details = {}) {
    super(`${resource} not found`, 404, 'NOT_FOUND', details);
  }
}

/**
 * Error class for validation errors
 * @extends AppError
 */
class ValidationError extends AppError {
  /**
   * Create a ValidationError
   * @param {string} message - Error message
   * @param {Array|Object} errors - Validation errors
   * @param {Object} details - Additional error details
   */
  constructor(message = 'Validation failed', errors = [], details = {}) {
    super(message, 400, 'VALIDATION_ERROR', { ...details, errors });
  }
}

/**
 * Error class for database errors
 * @extends AppError
 */
class DatabaseError extends AppError {
  /**
   * Create a DatabaseError
   * @param {string} message - Error message
   * @param {Object} details - Additional error details
   */
  constructor(message = 'Database error occurred', details = {}) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

/**
 * Error class for rate limiting
 * @extends AppError
 */
class RateLimitError extends AppError {
  /**
   * Create a RateLimitError
   * @param {string} message - Error message
   * @param {number} retryAfter - Number of seconds to wait before retrying
   * @param {Object} details - Additional error details
   */
  constructor(message = 'Too many requests', retryAfter = 60, details = {}) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', { ...details, retryAfter });
  }
}

/**
 * Error class for service unavailability
 * @extends AppError
 */
class ServiceUnavailableError extends AppError {
  /**
   * Create a ServiceUnavailableError
   * @param {string} message - Error message
   * @param {Object} details - Additional error details
   */
  constructor(message = 'Service temporarily unavailable', details = {}) {
    super(message, 503, 'SERVICE_UNAVAILABLE', details);
  }
}

/**
 * Error class for bad requests
 * @extends AppError
 */
class BadRequestError extends AppError {
  /**
   * Create a BadRequestError
   * @param {string} message - Error message
   * @param {Object} details - Additional error details
   */
  constructor(message = 'Bad request', details = {}) {
    super(message, 400, 'BAD_REQUEST', details);
  }
}

module.exports = {
  AppError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  DatabaseError,
  RateLimitError,
  ServiceUnavailableError,
  BadRequestError
};
