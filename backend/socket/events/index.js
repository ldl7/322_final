/**
 * Centralized event handlers for WebSocket connections.
 * This function is called when a new authenticated client connects.
 * It registers various event handlers (for messages, user status, etc.) for that client's socket.
 */
const messageHandlers = require('./messageHandlers');
const userHandlers = require('./userHandlers');
const logger = require('../../utils/logger'); // Assuming logger is in 'backend/utils/logger.js'

const onConnection = (io, socket) => {
    // This function is called for each authenticated socket connection
    logger.info(`Setting up event handlers for connected user: ${socket.user.username} (Socket ID: ${socket.id})`);

    // Register message-related event handlers from messageHandlers.js
    messageHandlers(io, socket);

    // Register user-related event handlers (e.g., typing, online status) from userHandlers.js
    userHandlers(io, socket);

    // Example: Generic error handler for this specific socket, if not handled by global io error handler
    // socket.on('error', (error) => {
    //     logger.error(`Socket-specific error for user ${socket.user.username} (Socket ID: ${socket.id}):`, error);
    // });

    // You can also register other general purpose handlers here if needed
    // For example, a custom ping/pong for keep-alive or latency checks
    socket.on('custom_ping', (callback) => {
        logger.debug(`Received custom_ping from ${socket.user.username}, sending custom_pong.`);
        if (typeof callback === 'function') {
            callback({ status: 'ok', timestamp: new Date().toISOString(), fromServer: true });
        }
    });

    // Note: The main 'disconnect' event is typically handled where the 'connection' event is defined (e.g., server.js)
    // to ensure it's always attached. However, specific cleanup related to these handlers can be done here if needed.
};

module.exports = onConnection;
