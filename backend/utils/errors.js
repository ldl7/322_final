/**
 * Custom Error Classes
 * 
 * Defines custom error classes for different types of application errors.
 * Provides consistent error handling and formatting.
 * 
 * @module utils/errors
 * @requires http-status-codes
 * 
 * @example
 * // Example usage:
 * const { NotFoundError, ValidationError, BadRequestError } = require('../utils/errors');
 * throw new NotFoundError('User not found');
 * throw new ValidationError('Invalid input', { field: 'email' });
 * throw new BadRequestError('Invalid request');
 */

// File implemented with custom error classes:
// 1. ApiError - Base error class
// 2. NotFoundError - 404 errors
// 3. ValidationError - 400 errors
// 4. UnauthorizedError - 401 errors
// 5. ForbiddenError - 403 errors
// 6. ConflictError - 409 errors
// 7. BadRequestError - 400 errors

// Implementation includes proper error serialization and status codes

const httpStatus = require('http-status-codes');

/**
 * Base API Error class that all other error classes extend.
 * Sets up common properties for all API errors.
 */
class ApiError extends Error {
  constructor(
    message = 'An error occurred',
    statusCode = httpStatus.INTERNAL_SERVER_ERROR,
    isOperational = true,
    stack = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * 400 Bad Request Error
 * Used when the server cannot process the request due to client error.
 */
class BadRequestError extends ApiError {
  constructor(message = 'Bad Request') {
    super(message, httpStatus.BAD_REQUEST);
  }
}

/**
 * 401 Unauthorized Error
 * Used when authentication is required but has failed or not been provided.
 */
class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(message, httpStatus.UNAUTHORIZED);
  }
}

/**
 * 403 Forbidden Error
 * Used when the user doesn't have permission to access a resource.
 */
class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(message, httpStatus.FORBIDDEN);
  }
}

/**
 * 404 Not Found Error
 * Used when a requested resource is not found.
 */
class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(message, httpStatus.NOT_FOUND);
  }
}

/**
 * 409 Conflict Error
 * Used when a request conflicts with the current state of the server.
 */
class ConflictError extends ApiError {
  constructor(message = 'Conflict') {
    super(message, httpStatus.CONFLICT);
  }
}

/**
 * 422 Validation Error
 * Used when request data fails validation.
 */
class ValidationError extends ApiError {
  constructor(message = 'Validation Error', errors = []) {
    super(message, httpStatus.UNPROCESSABLE_ENTITY);
    this.errors = errors;
  }
}

module.exports = {
  ApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError
};
