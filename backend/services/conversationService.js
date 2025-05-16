// Contains business logic and data access for conversation operations
const { Op } = require('sequelize');
const { Conversation, User, UserConversation, Message, sequelize } = require('../models'); // Adjust path if your models are elsewhere
const logger = require('../utils/logger'); // Adjust path for your logger

/**
 * Checks if a direct conversation already exists between two users.
 * @param {string} userId1 - ID of the first user.
 * @param {string} userId2 - ID of the second user.
 * @returns {Promise<Conversation|null>} The existing conversation or null.
 */
const findExistingDirectConversation = async (userId1, userId2) => {
    try {
        // Find conversations involving userId1
        const conversationsOfUser1 = await UserConversation.findAll({
            where: { userId: userId1 },
            attributes: ['conversationId'],
        });

        if (!conversationsOfUser1.length) return null;

        const conversationIdsOfUser1 = conversationsOfUser1.map(uc => uc.conversationId);

        // Find direct conversations among these that also involve userId2
        const directConversation = await Conversation.findOne({
            where: {
                id: { [Op.in]: conversationIdsOfUser1 },
                type: 'direct',
            },
            include: [{
                model: UserConversation,
                as: 'userConversations',
                attributes: ['userId'],
                where: { userId: userId2 }, // Ensure the other user is part of this conversation
                required: true // This makes it an INNER JOIN on this include
            }],
        });
        
        // Further check to ensure ONLY these two users are in the direct conversation
        if (directConversation) {
            const participants = await directConversation.getParticipants({ attributes: ['id'] });
            if (participants.length === 2 && participants.some(p => p.id === userId1) && participants.some(p => p.id === userId2)) {
                return directConversation;
            }
        }
        return null;

    } catch (error) {
        logger.error('Error finding existing direct conversation:', error);
        throw error; // Re-throw to be handled by the caller
    }
};

/**
 * Creates a new conversation.
 * @param {string} creatorId - The ID of the user creating the conversation.
 * @param {string[]} participantUserIds - An array of user IDs to be included in the conversation.
 * @param {string} type - Type of conversation ('direct' or 'group'). Defaults to 'direct'.
 * @param {string|null} name - Name of the conversation, primarily for group chats.
 * @returns {Promise<Conversation>} The created conversation object with participants.
 */
const createConversation = async (creatorId, participantUserIds, type = 'direct', name = null) => {
    logger.info(`Creating conversation: type=${type}, creatorId=${creatorId}, participants=${participantUserIds.join(',')}, name=${name}`);
    
    if (!creatorId || !participantUserIds || participantUserIds.length === 0) {
        throw new Error('Creator ID and at least one participant are required.');
    }

    // Ensure creator is also part of the participant list for simplicity in UserConversation entries
    const allParticipantIds = Array.from(new Set([creatorId, ...participantUserIds]));

    if (type === 'direct') {
        if (allParticipantIds.length !== 2) {
            throw new Error('Direct conversations must have exactly two participants (including the creator).');
        }
        const existingConversation = await findExistingDirectConversation(allParticipantIds[0], allParticipantIds[1]);
        if (existingConversation) {
            logger.info(`Returning existing direct conversation ${existingConversation.id} for users ${allParticipantIds.join(', ')}`);
            // Optionally, load participants if not already loaded correctly
            return Conversation.findByPk(existingConversation.id, { include: [{ model: User, as: 'participants', attributes: ['id', 'username', 'email'] }] });
        }
    } else if (type === 'group' && !name) {
        throw new Error('Group conversations must have a name.');
    }

    const transaction = await sequelize.transaction();
    try {
        const conversation = await Conversation.create({
            type,
            name: type === 'group' ? name : null, // Name is typically for group chats
            createdBy: creatorId,
        }, { transaction });

        const userConversationEntries = allParticipantIds.map(userId => ({
            userId,
            conversationId: conversation.id,
        }));

        await UserConversation.bulkCreate(userConversationEntries, { transaction });

        await transaction.commit();

        // Fetch the conversation again with participants to return the full object
        const newConversationWithParticipants = await Conversation.findByPk(conversation.id, {
            include: [
                { model: User, as: 'participants', attributes: ['id', 'username', 'email'], through: { attributes: [] } },
                { model: User, as: 'creator', attributes: ['id', 'username', 'email'] }
            ]
        });
        logger.info(`Conversation ${newConversationWithParticipants.id} created successfully.`);
        return newConversationWithParticipants;
    } catch (error) {
        await transaction.rollback();
        logger.error('Error creating conversation:', error);
        throw error; // Re-throw to be handled by controller/error handler
    }
};

/**
 * Retrieves all conversations for a given user, with pagination and last message.
 * @param {string} userId - The ID of the user.
 * @param {object} options - Pagination options.
 * @param {number} options.page - The page number (default: 1).
 * @param {number} options.limit - Number of conversations per page (default: 20).
 * @returns {Promise<object>} An object containing conversations and pagination info.
 */
const getUserConversations = async (userId, { page = 1, limit = 20 } = {}) => {
    logger.info(`Fetching conversations for user ${userId}, page=${page}, limit=${limit}`);
    const offset = (page - 1) * limit;

    try {
        const { count, rows: userConversations } = await UserConversation.findAndCountAll({
            where: { userId },
            include: [{
                model: Conversation,
                as: 'conversation',
                include: [
                    { model: User, as: 'participants', attributes: ['id', 'username', 'email'], through: { attributes: [] } },
                    {
                        model: Message,
                        as: 'messages',
                        attributes: ['id', 'content', 'senderId', 'createdAt', 'type'],
                        limit: 1, // Get only the last message
                        order: [['createdAt', 'DESC']],
                        include: [{model: User, as: 'sender', attributes: ['id', 'username']}]
                    }
                ]
            }],
            order: [[{model: Conversation, as: 'conversation'}, 'updatedAt', 'DESC']], // Order conversations by recent activity
            limit,
            offset,
            distinct: true, // Important for count when using includes
        });

        const conversations = userConversations.map(uc => {
            const conv = uc.conversation.toJSON(); // Work with plain object
            // Simplify the last message structure
            conv.lastMessage = conv.messages && conv.messages.length > 0 ? conv.messages[0] : null;
            delete conv.messages; // Remove the array of messages as we only needed the last one
            return conv;
        });

        return {
            conversations,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            totalConversations: count
        };
    } catch (error) {
        logger.error(`Error fetching conversations for user ${userId}:`, error);
        throw error;
    }
};

/**
 * Retrieves a specific conversation by its ID, ensuring the requesting user is a participant.
 * @param {string} conversationId - The ID of the conversation.
 * @param {string} userId - The ID of the user requesting the conversation (for auth check).
 * @returns {Promise<Conversation|null>} The conversation object or null if not found or user is not a participant.
 */
const getConversationById = async (conversationId, userId) => {
    logger.info(`Fetching conversation ${conversationId} for user ${userId}`);
    try {
        const conversation = await Conversation.findByPk(conversationId, {
            include: [
                { 
                    model: User, 
                    as: 'participants', 
                    attributes: ['id', 'username', 'email'], 
                    through: { attributes: [] } // Don't need join table attributes here
                },
                { model: User, as: 'creator', attributes: ['id', 'username', 'email'] },
                // Optionally include last few messages or other relevant details
            ]
        });

        if (!conversation) {
            logger.warn(`Conversation ${conversationId} not found.`);
            return null;
        }

        // Check if the requesting user is a participant
        const isParticipant = conversation.participants.some(participant => participant.id === userId);
        if (!isParticipant) {
            logger.warn(`User ${userId} is not a participant of conversation ${conversationId}. Access denied.`);
            // Throw an error or return null based on how you want to handle unauthorized access
            const error = new Error('Access denied: You are not a participant of this conversation.');
            error.status = 403; // Forbidden
            throw error;
        }
        
        logger.info(`Conversation ${conversationId} fetched successfully for user ${userId}`);
        return conversation;
    } catch (error) {
        logger.error(`Error fetching conversation ${conversationId} for user ${userId}:`, error);
        if (!error.status) error.status = 500; // Default to server error if not set
        throw error;
    }
};

module.exports = {
    createConversation,
    getUserConversations,
    getConversationById,
    // findExistingDirectConversation, // Not typically exported unless needed elsewhere directly
};

