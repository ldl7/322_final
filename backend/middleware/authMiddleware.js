// backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const { User } = require('../models'); // Adjust path if necessary
const config = require('../config/config'); // Ensure this path is correct and loads your jwt.secret
const { UnauthorizedError } = require('../utils/errors');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
    let token;
    // Log the entire authorization header
    logger.info(`AUTH_MIDDLEWARE: Authorization Header: [${req.headers.authorization}]`);

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // Check for common invalid token string values
            if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
                logger.warn(`AUTH_MIDDLEWARE: Invalid token string extracted: [${token}]`);
                return next(new UnauthorizedError('Not authorized, malformed token.'));
            }

            logger.info(`AUTH_MIDDLEWARE: Token to verify: [${token}]`);

            const decoded = jwt.verify(token, config.jwt.secret); // Error happens here if token is bad
            logger.info(`AUTH_MIDDLEWARE: Token decoded successfully for user ID: ${decoded.id}`);

            const user = await User.findByPk(decoded.id, {
                attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetTokenExpires', 'emailVerificationToken', 'emailVerificationTokenExpires', 'refreshTokenHash'] }
            });

            if (!user) {
                logger.warn(`AUTH_MIDDLEWARE: User not found for token ID: ${decoded.id}`);
                return next(new UnauthorizedError('Not authorized, user not found.'));
            }

            req.user = user.get({ plain: true }); // Attach plain user object
            logger.info(`AUTH_MIDDLEWARE: User ${req.user.username} authenticated.`);
            next();
        } catch (error) {
            logger.error('AUTH_MIDDLEWARE: JWT Verification or User Fetch Error:', {
                message: error.message,
                name: error.name,
                tokenProvided: token, // Log the token that caused the error
            });
            if (error.name === 'JsonWebTokenError') {
                return next(new UnauthorizedError('Not authorized, token failed verification (malformed or invalid signature).'));
            } else if (error.name === 'TokenExpiredError') {
                return next(new UnauthorizedError('Not authorized, token expired.'));
            }
            return next(new UnauthorizedError('Not authorized, an unexpected error occurred with token.'));
        }
    } else {
        logger.warn('AUTH_MIDDLEWARE: No Bearer token in authorization header.');
        return next(new UnauthorizedError('Not authorized, no token in header.'));
    }
};

module.exports = authMiddleware;
