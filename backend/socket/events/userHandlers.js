/**
 * Handles user-related WebSocket events such as typing indicators and presence.
 */
const logger = require('../../utils/logger'); // Assuming logger is in backend/utils/logger

// Store typing users: { conversationId: { userId: socketId, ... } }
// This is a simple in-memory store. For a distributed system, use Redis or similar.
const typingUsersByConversation = {}; 

module.exports = (io, socket) => {
    const userId = socket.user.id;
    const username = socket.user.username;

    /**
     * Handles 'typing_start' event from a client.
     * @param {object} data - Data from the client.
     * Expected structure: { conversationId: string }
     */
    const handleUserTypingStart = (data) => {
        const { conversationId } = data;
        if (!conversationId) {
            logger.warn(`User ${username} (ID: ${userId}) sent 'typing_start' without conversationId.`);
            return;
        }

        // Add user to typing list for this conversation
        if (!typingUsersByConversation[conversationId]) {
            typingUsersByConversation[conversationId] = {};
        }
        typingUsersByConversation[conversationId][userId] = socket.id; // Store socket.id if needed for multi-device scenarios

        // Broadcast to other users in the conversation room that this user is typing.
        // The client sending 'typing_start' should not receive this event back from the server.
        socket.to(conversationId.toString()).emit('userTyping', {
            conversationId,
            userId,
            username,
            isTyping: true
        });
        logger.debug(`User ${username} (ID: ${userId}) started typing in conversation ${conversationId}`);
    };

    /**
     * Handles 'typing_stop' event from a client.
     * @param {object} data - Data from the client.
     * Expected structure: { conversationId: string }
     */
    const handleUserTypingStop = (data) => {
        const { conversationId } = data;
        if (!conversationId) {
            logger.warn(`User ${username} (ID: ${userId}) sent 'typing_stop' without conversationId.`);
            return;
        }

        // Remove user from typing list
        if (typingUsersByConversation[conversationId]) {
            delete typingUsersByConversation[conversationId][userId];
            if (Object.keys(typingUsersByConversation[conversationId]).length === 0) {
                delete typingUsersByConversation[conversationId]; // Clean up empty conversation entry
            }
        }

        // Broadcast to other users in the conversation room that this user stopped typing.
        socket.to(conversationId.toString()).emit('userTyping', {
            conversationId,
            userId,
            username,
            isTyping: false
        });
        logger.debug(`User ${username} (ID: ${userId}) stopped typing in conversation ${conversationId}`);
    };

    /**
     * Placeholder for handling user explicitly setting their status (e.g., 'online', 'away', 'offline').
     * This is distinct from basic WebSocket connection/disconnection presence.
     * @param {object} data - Data from the client, e.g., { status: 'away' }
     */
    const handleUserSetStatus = (data) => {
        const { status } = data;
        logger.info(`User ${username} (ID: ${userId}) set status to: ${status}`);
        // TODO: Update user's status in a presence system (e.g., Redis, database)
        // and broadcast this status change to relevant users (e.g., friends, contacts).
        // io.emit('userStatusChanged', { userId, username, status }); // Example broadcast to all
    };

    // Register event listeners for this socket connection
    socket.on('typing_start', handleUserTypingStart);
    socket.on('typing_stop', handleUserTypingStop);
    socket.on('set_user_status', handleUserSetStatus); // Example for explicit status setting

    // Cleanup logic when this specific socket disconnects.
    // This is in addition to the generic 'disconnect' logger in server.js.
    socket.on('disconnect', (reason) => {
        logger.debug(`User handlers: ${username} (ID: ${userId}, Socket ID: ${socket.id}) disconnected. Reason: ${reason}`);
        // If the user was typing in any conversation, emit 'typing_stop' for them.
        for (const conversationId in typingUsersByConversation) {
            if (typingUsersByConversation[conversationId][userId] === socket.id) {
                delete typingUsersByConversation[conversationId][userId];
                 if (Object.keys(typingUsersByConversation[conversationId]).length === 0) {
                    delete typingUsersByConversation[conversationId];
                }
                socket.to(conversationId.toString()).emit('userTyping', {
                    conversationId,
                    userId,
                    username,
                    isTyping: false
                });
                logger.debug(`Auto-stopped typing for ${username} in ${conversationId} due to disconnect.`);
            }
        }
        // TODO: Add more sophisticated presence management if needed (e.g., user has other active sockets).
        // For a simple setup, you might broadcast 'user_offline' to relevant rooms/users.
    });
};

