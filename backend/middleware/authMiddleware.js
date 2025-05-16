// backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const { User } = require('../models'); // Adjust path if necessary
const config = require('../config/config');
const { UnauthorizedError } = require('../utils/errors');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            if (!token) {
                logger.warn('Auth middleware: No token found after Bearer prefix');
                return next(new UnauthorizedError('Not authorized, no token provided.'));
            }

            const decoded = jwt.verify(token, config.jwt.secret);
            
            // Find user by ID from token, excluding password and sensitive fields
            const user = await User.findByPk(decoded.id, {
                attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetTokenExpires', 'emailVerificationToken', 'emailVerificationTokenExpires', 'refreshTokenHash'] }
            });

            if (!user) {
                logger.warn(`Auth middleware: User not found for token ID: ${decoded.id}`);
                return next(new UnauthorizedError('Not authorized, user not found.'));
            }
            
            // Check if user is active or not banned if you have such fields
            // if (!user.isActive) { return next(new UnauthorizedError('User account is inactive.')); }

            req.user = user; // Attach user object to request
            next();
        } catch (error) {
            logger.error('Auth middleware error:', error);
            if (error.name === 'JsonWebTokenError') {
                return next(new UnauthorizedError('Not authorized, token failed verification.'));
            } else if (error.name === 'TokenExpiredError') {
                return next(new UnauthorizedError('Not authorized, token expired.'));
            }
            return next(new UnauthorizedError('Not authorized, an unexpected error occurred with token.'));
        }
    } else {
        logger.warn('Auth middleware: No Bearer token in authorization header.');
        // Allow access for development/testing if explicitly set, otherwise deny
        // For MVP, let's keep it strict to test the auth flow.
        // if ((process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') && !req.headers.authorization) {
        //     logger.warn('Auth middleware: Allowing request without token in DEV/TEST mode. Consider if this is intended.');
        //     req.user = { id: 'dev-user-id', username: 'developer', email: 'dev@example.com' }; // Mock user
        //     return next();
        // }
        return next(new UnauthorizedError('Not authorized, no token in header.'));
    }
};

module.exports = authMiddleware;
