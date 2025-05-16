/**
 * Authentication Middleware
 * 
 * Middleware functions for authenticating and authorizing requests.
 * Verifies JWT tokens and checks user permissions.
 * 
 * @module middleware/auth
 * @requires jsonwebtoken
 * @requires passport
 * @requires ../models/User
 * @requires ../utils/logger
 * @requires ../utils/errors
 * 
 * @example
 * // Protect a route with JWT authentication
 * router.get('/protected', authenticateJWT, controller.protectedRoute);
 * 
 * // Require specific roles
 * router.get('/admin', authenticateJWT, authorizeRoles('admin'), controller.adminRoute);
 */

const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { User } = require('../models');
const logger = require('../utils/logger');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const httpStatusCodes = require('http-status-codes');

/**
 * Middleware to authenticate requests using JWT.
 * Verifies the token from the Authorization header, and if valid,
 * attaches the user object to req.user.
 */
const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7, authHeader.length); // Extract token from 'Bearer <token>'

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      
      // Find user by ID from token payload
      // Ensure we select only necessary fields, or rely on default scope / toJSON
      const user = await User.findByPk(decoded.sub); // 'sub' is typically used for user ID in JWT

      if (!user) {
        logger.warn(`Authentication failed: User ${decoded.sub} not found.`);
        return next(new UnauthorizedError('Authentication failed: User not found.'));
      }

      // Check if email is verified if necessary for certain routes (can be a separate middleware)
      // For now, just attach user to request object
      req.user = user; // The user model's toJSON should strip sensitive fields
      logger.info(`User authenticated: ${user.email} (ID: ${user.id})`);
      next();
    } catch (error) {
      logger.error('JWT Authentication error:', error.message);
      if (error.name === 'TokenExpiredError') {
        return next(new UnauthorizedError('Authentication failed: Token expired.'));
      }
      if (error.name === 'JsonWebTokenError') {
        return next(new UnauthorizedError('Authentication failed: Invalid token.'));
      }
      // For other errors during verification or user fetching
      return next(new UnauthorizedError('Authentication failed.'));
    }
  } else {
    logger.warn('Authentication attempt without Bearer token.');
    // No token provided or not Bearer scheme
    return next(new UnauthorizedError('Authentication failed: No token provided or invalid format.'));
  }
};

module.exports = {
  authenticateJWT,
  // authorizeRoles will be implemented later if needed
};
