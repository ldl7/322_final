/**
 * WebSocket authentication middleware
 * Verifies JWT tokens for WebSocket connections
 * Attaches user information to socket for authorization
 */
const jwt = require('jsonwebtoken');
const { User } = require('../../models'); 
const config = require('../../config/config'); 
const logger = require('../../utils/logger'); 

const socketAuthMiddleware = async (socket, next) => {
    // Token can be sent in handshake query or auth headers (e.g., socket.handshake.auth.token)
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
        logger.warn('WebSocket connection attempt without token.');
        // Create a custom error object that Socket.IO can send to the client
        const err = new Error('Authentication error: Token not provided');
        err.data = { content: 'Token not provided for WebSocket connection.' }; // additional details for client
        return next(err);
    }

    try {
        // Ensure you are using the correct secret key from your config
        const jwtSecret = process.env.JWT_SECRET || config.development.jwt_secret;
        if (!jwtSecret) {
            logger.error('JWT_SECRET is not defined. WebSocket authentication cannot proceed.');
            const err = new Error('Authentication error: Server configuration issue');
            err.data = { content: 'Server configuration error for JWT.' };
            return next(err);
        }
        const decoded = jwt.verify(token, jwtSecret);
        
        // Assuming your JWT payload has an 'id' field for the user's primary key
        const user = await User.findByPk(decoded.id);

        if (!user) {
            logger.warn(`WebSocket authentication failed: User not found for ID ${decoded.id}`);
            const err = new Error('Authentication error: User not found');
            err.data = { content: 'User associated with token not found.' };
            return next(err);
        }

        // Attach user to the socket object for use in event handlers
        socket.user = {
            id: user.id,
            username: user.username,
            email: user.email
            // Add other relevant non-sensitive user fields if needed
        };
        logger.info(`WebSocket authenticated for user: ${socket.user.username} (ID: ${socket.user.id}) (Socket ID: ${socket.id})`);
        next(); // Proceed to the next middleware or connection handler
    } catch (error) {
        logger.error('WebSocket authentication error:', error.message);
        let authError = new Error('Authentication error: Could not verify token');
        if (error.name === 'TokenExpiredError') {
            authError = new Error('Authentication error: Token expired');
            authError.data = { content: 'Access token has expired.' };
        } else if (error.name === 'JsonWebTokenError') {
            authError = new Error('Authentication error: Invalid token');
            authError.data = { content: 'Access token is invalid.' };
        }
        return next(authError);
    }
};

module.exports = socketAuthMiddleware;
