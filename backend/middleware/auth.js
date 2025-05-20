/**
 * Authentication Middleware (Development Version)
 * 
 * For development purposes only - automatically authenticates as a test user
 * In production, use proper JWT authentication
 */

const { User } = require('../models');
const logger = require('../utils/logger');
const { UnauthorizedError } = require('../utils/errors');

/**
 * Middleware that automatically authenticates as the test user
 * Skips JWT verification for development purposes
 */
const authenticateJWT_DevMode = async (req, res, next) => {
  logger.info('DEV_AUTH_MIDDLEWARE: Bypassing JWT, authenticating as test@example.com');
  try {
    const testUser = await User.findOne({
      where: { email: 'test@example.com' },
      attributes: ['id', 'email', 'username', 'role'] // Fetch necessary fields
    });

    if (!testUser) {
      logger.error('DEV_AUTH_MIDDLEWARE: Test user (test@example.com) not found!');
      return res.status(500).json({ message: 'Developer setup error: Test user not found.' });
    }
    req.user = testUser.get({ plain: true });
    logger.info(`DEV_AUTH_MIDDLEWARE: Authenticated as ${req.user.username}`);
    next();
  } catch (error) {
    logger.error('DEV_AUTH_MIDDLEWARE: Error fetching test user:', error);
    next(error);
  }
};

/**
 * Middleware to check if user has required roles
 * @param {...string} roles - Roles that are allowed to access the route
 * @returns {Function} Middleware function
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return next(new UnauthorizedError('Insufficient permissions'));
    }
    
    next();
  };
};

module.exports = {
  authenticateJWT: authenticateJWT_DevMode, // Exporting the dev mode version
  authorizeRoles
};
