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
const authenticateJWT = async (req, res, next) => {
  logger.info('=== AUTHENTICATE JWT (DEV MODE) ===');
  
  try {
    // Log all users for debugging
    const allUsers = await User.findAll({
      attributes: ['id', 'email', 'username', 'role'],
      raw: true
    });
    logger.info(`Found ${allUsers.length} users in database:`, JSON.stringify(allUsers, null, 2));
    
    // Always use the test user in development
    const testUser = await User.findOne({ 
      where: { email: 'test@example.com' }
    });
    
    if (!testUser) {
      const errorMsg = 'Test user not found in database. Please run database migrations and seed data.';
      logger.error(errorMsg);
      return res.status(401).json({ 
        status: 'error', 
        message: errorMsg,
        availableUsers: allUsers
      });
    }
    
    // Store the test user ID in global app state for easy access
    global.testUserId = testUser.id;
    logger.info(`Set global testUserId to: ${global.testUserId}`);
    
    // Ensure we have all required user properties
    const userData = {
      id: testUser.id,
      email: testUser.email,
      username: testUser.username,
      role: testUser.role || 'user',
      isAuthenticated: true
    };
    
    // Attach the test user to the request
    req.user = userData;
    logger.info(`Authenticated as test user: ${JSON.stringify(userData, null, 2)}`);
    
    return next();
  } catch (error) {
    logger.error('Authentication error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    return res.status(500).json({ 
      status: 'error',
      message: 'Authentication failed',
      ...(process.env.NODE_ENV === 'development' && { 
        error: error.message,
        stack: error.stack 
      })
    });
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
  authenticateJWT,
  authorizeRoles
};
