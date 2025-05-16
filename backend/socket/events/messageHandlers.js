/**
 * Handles all message-related WebSocket events.
 * Processes incoming messages, saves them to the database, and broadcasts to recipients.
 * Manages message status updates (e.g., sent, delivered, read).
 */
const { Message, Conversation, User } = require('../../models'); // Assuming models are in backend/models
const logger = require('../../utils/logger'); // Assuming logger is in backend/utils/logger
// const { Op } = require('sequelize'); // Uncomment if needed for complex queries

module.exports = (io, socket) => {
    /**
     * Handles incoming messages from clients.
     * @param {object} data - The message data from the client.
     * Expected structure: { conversationId: string, content: string }
     * @param {function} callback - Acknowledgment callback to the client.
     * Called with { status: 'ok', messageId: string, sentAt: Date } or { status: 'error', message: string }.
     */
    const sendMessage = async (data, callback) => {
        try {
            const { conversationId, content } = data;
            const senderId = socket.user.id; // User ID from authenticated socket (socket.user set by auth middleware)

            if (!conversationId || !content || String(content).trim() === '') {
                logger.warn(`sendMessage: Missing conversationId or content from user ${senderId}. Data: ${JSON.stringify(data)}`);
                if (typeof callback === 'function') callback({ status: 'error', message: 'Conversation ID and content are required.' });
                return;
            }

            // 1. Verify the conversation exists and the user is a participant.
            // This check is crucial for security and data integrity.
            const conversation = await Conversation.findByPk(conversationId, {
                include: [{
                    model: User,
                    as: 'participants',
                    attributes: ['id'],
                    through: { attributes: [] } // We only need to know if the user is a participant.
                }]
            });

            if (!conversation) {
                logger.warn(`sendMessage: Conversation ${conversationId} not found. Attempt by user ${senderId}.`);
                if (typeof callback === 'function') callback({ status: 'error', message: 'Conversation not found.' });
                return;
            }

            const isParticipant = conversation.participants.some(p => p.id === senderId);
            if (!isParticipant) {
                logger.warn(`sendMessage: User ${senderId} (${socket.user.username}) is not a participant of conversation ${conversationId}.`);
                if (typeof callback === 'function') callback({ status: 'error', message: 'Access denied: You are not a participant of this conversation.' });
                return;
            }

            // 2. Create and save the message to the database.
            const message = await Message.create({
                content: String(content).trim(), // Ensure content is a string and trimmed
                senderId,
                conversationId,
                // timestamp: new Date() // Sequelize automatically adds createdAt and updatedAt
            });

            // 3. Fetch the newly created message along with sender details to broadcast.
            // This ensures the broadcasted message has all necessary info for clients to render it.
            const messageWithSender = await Message.findByPk(message.id, {
                include: [{
                    model: User,
                    as: 'sender', // Make sure this alias matches your Message model association
                    attributes: ['id', 'username', 'email'] // Send only necessary, non-sensitive sender info
                }]
            });

            // 4. Broadcast the new message to all clients in the specific conversation room.
            // It's assumed that clients join a room named after the conversationId when they select a conversation.
            const roomName = conversationId.toString();
            io.to(roomName).emit('newMessage', messageWithSender);
            logger.info(`Message from ${socket.user.username} (ID: ${senderId}) sent to conversation ${conversationId}: "${message.content.substring(0, 50)}..."`);

            // 5. Send an acknowledgment callback to the sender.
            if (typeof callback === 'function') {
                callback({ 
                    status: 'ok', 
                    messageId: message.id, 
                    tempId: data.tempId, // Optionally echo back a temporary client-side ID for UI updates
                    sentAt: message.createdAt 
                });
            }

        } catch (error) {
            logger.error(`sendMessage error for user ${socket.user?.id} in conversation ${data?.conversationId}:`, error);
            if (typeof callback === 'function') {
                callback({ status: 'error', message: 'Failed to send message due to a server error.' });
            }
        }
    };

    /**
     * Handles requests to mark messages as read within a conversation.
     * @param {object} data - Data from the client.
     * Expected structure: { conversationId: string, messageId: string (optional, for specific message) or lastReadTimestamp: Date (optional) }
     * @param {function} callback - Acknowledgment callback.
     */
    const markAsRead = async (data, callback) => {
        // Placeholder for 'mark as read' functionality.
        // This would typically involve:
        // 1. Identifying which messages to mark as read (e.g., all messages up to messageId or timestamp).
        // 2. Updating database records (e.g., a 'readBy' field in Message or a separate ReadReceipts table).
        // 3. Broadcasting an event like 'messagesRead' to participants in the conversation,
        //    so their UIs can update read statuses.
        logger.info(`markAsRead event received from ${socket.user.username} for conversation ${data?.conversationId}`, data);
        // Example: io.to(data.conversationId.toString()).emit('messagesRead', { conversationId: data.conversationId, readerId: socket.user.id, messageId: data.messageId });
        if (typeof callback === 'function') callback({ status: 'info', message: 'Read status handling is under development.' });
    };

    // Register event listeners for this socket connection
    socket.on('sendMessage', sendMessage);
    socket.on('markAsRead', markAsRead);

    // TODO: Add handlers for other message-related events such as:
    // socket.on('editMessage', editMessageHandler);
    // socket.on('deleteMessage', deleteMessageHandler);
    // socket.on('messageDelivered', messageDeliveredHandler); // If implementing custom delivery receipts
};

