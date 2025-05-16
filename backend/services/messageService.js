// Contains business logic and data access for message operations
const { Op } = require('sequelize');
const { Message, User, Conversation, UserConversation } = require('../models'); // Adjust path if your models are elsewhere
const logger = require('../utils/logger'); // Adjust path for your logger

/**
 * Sends a new message in a conversation.
 * @param {string} senderId - The ID of the user sending the message.
 * @param {string} conversationId - The ID of the conversation.
 * @param {string} content - The content of the message.
 * @param {string} type - The type of message (e.g., 'text', 'image'). Defaults to 'text'.
 * @param {object|null} metadata - Additional metadata for the message (e.g., image URL, file info).
 * @returns {Promise<Message>} The created message object with sender details.
 */
const sendMessage = async (senderId, conversationId, content, type = 'text', metadata = null) => {
    logger.info(`Sending message: senderId=${senderId}, conversationId=${conversationId}, type=${type}`);

    if (!senderId || !conversationId || !content) {
        throw new Error('Sender ID, Conversation ID, and Content are required to send a message.');
    }

    try {
        // 1. Verify conversation exists and sender is a participant (important for authorization)
        const conversation = await Conversation.findByPk(conversationId, {
            include: [{
                model: UserConversation,
                as: 'userConversations',
                attributes: ['userId']
            }]
        });

        if (!conversation) {
            throw new Error(`Conversation with ID ${conversationId} not found.`);
        }

        const isParticipant = conversation.userConversations.some(uc => uc.userId === senderId);
        if (!isParticipant) {
            const authError = new Error(`User ${senderId} is not a participant of conversation ${conversationId}.`);
            authError.status = 403; // Forbidden
            throw authError;
        }

        // 2. Create the message
        const message = await Message.create({
            senderId,
            conversationId,
            content,
            type,
            metadata,
            status: 'sent' // Or 'sending' if client confirmation is awaited for 'sent'
        });
        
        // 3. Update the conversation's updatedAt timestamp to mark recent activity
        // This helps in ordering conversations by the latest message.
        await conversation.changed('updatedAt', true); // Mark 'updatedAt' as changed
        await conversation.update({ updatedAt: new Date() }); // Force update, or simply save if no other changes
        // conversation.changed('updatedAt', true) might not be strictly necessary if Sequelize handles it with .save()
        // await conversation.save(); // Alternative way to update timestamps if other fields are also modified

        // 4. Fetch the message again with sender details to return the full object (as expected by WebSocket handlers)
        const newMessageWithSender = await Message.findByPk(message.id, {
            include: [{
                model: User,
                as: 'sender',
                attributes: ['id', 'username', 'email'] // Include necessary sender fields
            }]
        });

        logger.info(`Message ${newMessageWithSender.id} sent successfully by ${senderId} in conversation ${conversationId}`);
        return newMessageWithSender;
    } catch (error) {
        logger.error('Error sending message:', error);
        if (!error.status) error.status = 500; // Default to server error if not set
        throw error;
    }
};

/**
 * Retrieves messages for a specific conversation with pagination.
 * @param {string} conversationId - The ID of the conversation.
 * @param {string} userId - The ID of the user requesting messages (for auth check).
 * @param {object} options - Pagination options.
 * @param {number} options.page - The page number (e.g., 1 for the latest page if ordering DESC).
 * @param {number} options.limit - Number of messages per page (default: 50).
 * @param {string|null} options.beforeMessageId - Fetches messages created before the message with this ID (for older messages).
 * @param {string|null} options.afterMessageId - Fetches messages created after the message with this ID (for newer messages/updates).
 * @returns {Promise<object>} An object containing messages and pagination info.
 */
const getMessages = async (conversationId, userId, { page, limit = 30, beforeMessageId, afterMessageId } = {}) => {
    logger.info(`Fetching messages for conversation ${conversationId}, user ${userId}, options: ${JSON.stringify({ page, limit, beforeMessageId, afterMessageId })}`);

    try {
        // 1. Verify conversation exists and user is a participant
        const conversation = await Conversation.findByPk(conversationId, {
            include: [{
                model: UserConversation,
                as: 'userConversations',
                attributes: ['userId']
            }]
        });

        if (!conversation) {
            throw new Error(`Conversation with ID ${conversationId} not found.`);
        }

        const isParticipant = conversation.userConversations.some(uc => uc.userId === userId);
        if (!isParticipant) {
            const authError = new Error(`User ${userId} is not a participant of conversation ${conversationId}.`);
            authError.status = 403; // Forbidden
            throw authError;
        }

        // 2. Construct query options for messages
        const queryOptions = {
            where: { conversationId },
            include: [{
                model: User,
                as: 'sender',
                attributes: ['id', 'username', 'email']
            }],
            order: [['createdAt', 'DESC']], // Get newest messages first
            limit
        };

        if (beforeMessageId) {
            const cursorMessage = await Message.findByPk(beforeMessageId, { attributes: ['createdAt'] });
            if (cursorMessage) {
                queryOptions.where.createdAt = { [Op.lt]: cursorMessage.createdAt };
            }
        } else if (afterMessageId) {
             const cursorMessage = await Message.findByPk(afterMessageId, { attributes: ['createdAt'] });
            if (cursorMessage) {
                queryOptions.where.createdAt = { [Op.gt]: cursorMessage.createdAt };
                queryOptions.order = [['createdAt', 'ASC']]; // For polling new messages, get oldest of the new ones first, then reverse on client
            }
        } else if (page) {
            queryOptions.offset = (page - 1) * limit;
        }
        // If no pagination option (page, beforeMessageId, afterMessageId) is provided, it fetches the latest 'limit' messages.

        const { count, rows: messages } = await Message.findAndCountAll(queryOptions);
        
        // If using afterMessageId, reverse the order to be chronological for the client
        if (afterMessageId) {
            messages.reverse();
        }

        // Calculate totalPages only if using page-based pagination
        const totalPages = page ? Math.ceil(await Message.count({ where: { conversationId } }) / limit) : undefined;

        return {
            messages,
            // totalMessages: count, // This count is for the current query, not total in conversation if paginating
            totalPages, // Only relevant for page-based pagination
            currentPage: page, // Only relevant for page-based pagination
            hasNextPage: page && (page * limit < await Message.count({ where: { conversationId } })), // simplified hasNextPage
            hasPreviousPage: page && page > 1, // simplified hasPreviousPage
        };

    } catch (error) {
        logger.error(`Error fetching messages for conversation ${conversationId}:`, error);
        if (!error.status) error.status = 500; // Default to server error if not set
        throw error;
    }
};

/**
 * Marks messages in a conversation as read by a user.
 * (Placeholder - Full implementation would involve updating message statuses or a UserMessageRead table).
 * @param {string} conversationId - The ID of the conversation.
 * @param {string} userId - The ID of the user who read the messages.
 * @param {string|null} lastReadMessageId - ID of the last message read by the user. If null, could mark all.
 * @returns {Promise<object>} A success status or details of messages marked as read.
 */
const markMessagesAsRead = async (conversationId, userId, lastReadMessageId = null) => {
    logger.info(`Marking messages as read: conversationId=${conversationId}, userId=${userId}, lastReadMessageId=${lastReadMessageId}`);
    // TODO: Implement actual logic
    // 1. Verify user is participant of conversationId.
    // 2. If lastReadMessageId is provided, find all messages up to that ID (and possibly timestamp).
    // 3. Update their status to 'read' for this specific user.
    //    - This could mean updating a join table (e.g., MessageReadBy) or individual message records if status is per user.
    //    - Or, more commonly, update a UserConversation record with `lastReadMessageTimestamp` or `lastReadMessageId`.
    // 4. Potentially broadcast an event via WebSockets to notify other clients of read status update.
    
    // Example (Conceptual - requires UserConversation model to have lastReadMessageId field):
    /*
    const userConv = await UserConversation.findOne({ where: { userId, conversationId } });
    if (userConv) {
        userConv.lastReadMessageId = lastReadMessageId || userConv.lastReadMessageId; // Update if new one is provided
        // userConv.lastReadTimestamp = new Date(); // Alternative or complementary
        await userConv.save();
        return { status: 'success', message: 'Messages marked as read.' };
    } else {
        throw new Error('User or conversation not found for marking messages as read.');
    }
    */
    return { status: 'pending_implementation', message: 'Mark as read functionality is not fully implemented.' };
};

module.exports = {
    sendMessage,
    getMessages,
    markMessagesAsRead,
};

