// Contains business logic and data access for conversation operations
const { Op } = require('sequelize');
const { Conversation, User, UserConversation, Message, sequelize } = require('../models');
const logger = require('../utils/logger');

// AI Coach user ID - this should be set in your environment variables
const AI_COACH_USER_ID = process.env.AI_COACH_USER_ID || 'bffc93b4-f1d1-4395-bd7e-aef35648ed4e';

/**
 * Finds the user's AI Coach conversation
 * @param {string} userId - ID of the user
 * @returns {Promise<Conversation|null>} The existing conversation or null
 */
const findUserAICoachConversation = async (userId) => {
    try {
        logger.info(`Finding AI Coach conversation for user ${userId}`);
        const conversation = await Conversation.findOne({
            where: {
                createdBy: userId,
                type: 'direct',
            },
            include: [
                {
                    model: User,
                    as: 'participants',
                    attributes: ['id', 'username'],
                    through: { attributes: [] },
                    where: { id: AI_COACH_USER_ID },
                    required: true
                }
            ]
        });

        if (conversation) {
            // Verify the user is also a participant (should be implied by createdBy and direct type)
            const userIsParticipant = await conversation.hasParticipant(userId);
            if (userIsParticipant) {
                logger.info(`Found existing AI Coach conversation ${conversation.id} for user ${userId}`);
                return conversation;
            }
        }
        logger.info(`No existing AI Coach conversation found for user ${userId} with AI as participant.`);
        return null;
    } catch (error) {
        logger.error(`Error in findUserAICoachConversation for user ${userId}:`, error);
        throw error;
    }
};

/**
 * Creates a new AI conversation for a user
 * @param {string} creatorId - The ID of the user creating the conversation.
 * @param {string[]} participantUserIds - Ignored, as we always use AI_COACH_USER_ID
 * @param {string} type - Type of conversation (defaults to 'direct' for AI conversations)
 * @param {string|null} name - Optional name for the conversation
 * @returns {Promise<Conversation>} The created or existing conversation object
 */
const createConversation = async (creatorId, participantUserIds = [], type = 'direct', name = null) => {
    logger.info(`Creating AI conversation for creatorId=${creatorId}`);

    if (!creatorId) {
        throw new Error('Creator ID is required.');
    }

    if (creatorId === AI_COACH_USER_ID) {
        throw new Error('AI cannot create a conversation with itself');
    }

    // Check if a conversation already exists for this user with the AI Coach
    let conversation = await findUserAICoachConversation(creatorId);
    if (conversation) {
        logger.info(`Returning existing AI conversation ${conversation.id} for user ${creatorId}`);
        return conversation;
    }

    const transaction = await sequelize.transaction();
    try {
        const conversationName = name || `Chat with AI Coach`;

        // Create the conversation with the user and AI coach as participants
        conversation = await Conversation.create({
            type: 'direct',
            name: conversationName,
            createdBy: creatorId,
        }, { transaction });

        // Add both the user and AI coach as participants
        const allParticipantIds = [creatorId, AI_COACH_USER_ID];
        const userConversationEntries = allParticipantIds.map(userId => ({
            userId,
            conversationId: conversation.id,
        }));

        await UserConversation.bulkCreate(userConversationEntries, { transaction });
        await transaction.commit();

        // Fetch the complete conversation with participants
        const newConversationWithDetails = await Conversation.findByPk(conversation.id, {
            include: [
                { 
                    model: User, 
                    as: 'participants', 
                    attributes: ['id', 'username', 'email'], 
                    through: { attributes: [] } 
                },
                { 
                    model: User, 
                    as: 'creator', 
                    attributes: ['id', 'username', 'email'] 
                }
            ]
        });

        logger.info(`AI Conversation ${newConversationWithDetails.id} created successfully for user ${creatorId}.`);
        return newConversationWithDetails;
    } catch (error) {
        await transaction.rollback();
        logger.error('Error creating AI conversation:', error);
        throw error;
    }
};

/**
 * Retrieves the AI conversation for a given user
 * @param {string} userId - The ID of the user
 * @param {object} options - Pagination options (kept for compatibility but not used)
 * @returns {Promise<object>} An object containing the conversation and pagination info
 */
const getUserConversations = async (userId, { page = 1, limit = 1 } = {}) => {
    logger.info(`Fetching AI conversation for user ${userId}`);
    
    // Find the user's AI conversation
    const conversation = await findUserAICoachConversation(userId);

    if (!conversation) {
        return { conversations: [], totalPages: 0, currentPage: 1, totalConversations: 0 };
    }

    // Fetch the last message for this conversation
    const lastMessage = await Message.findOne({
        where: { conversationId: conversation.id },
        order: [['createdAt', 'DESC']],
        include: [{ 
            model: User, 
            as: 'sender', 
            attributes: ['id', 'username'] 
        }]
    });
    
    // Prepare the conversation data
    const convJSON = conversation.toJSON();
    convJSON.lastMessage = lastMessage ? lastMessage.toJSON() : null;

    // Ensure participants are included in the response
    if (!convJSON.participants) {
        const participants = await conversation.getParticipants({ 
            attributes: ['id', 'username', 'email'], 
            raw: true 
        });
        convJSON.participants = participants;
    }

    return {
        conversations: [convJSON],
        totalPages: 1,
        currentPage: 1,
        totalConversations: 1
    };
};

/**
 * Retrieves a specific conversation by its ID, ensuring the requesting user is the creator
 * @param {string} conversationId - The ID of the conversation
 * @param {string} requestingUserId - The ID of the user requesting the conversation
 * @returns {Promise<Conversation>} The conversation object
 * @throws {Error} If conversation not found or user is not authorized
 */
const getConversationById = async (conversationId, requestingUserId) => {
    logger.info(`Fetching AI conversation ${conversationId} for user ${requestingUserId}`);
    
    const conversation = await Conversation.findByPk(conversationId, {
        include: [
            { 
                model: User, 
                as: 'participants', 
                attributes: ['id', 'username', 'email'], 
                through: { attributes: [] } 
            },
            { 
                model: User, 
                as: 'creator', 
                attributes: ['id', 'username', 'email'] 
            }
        ]
    });

    if (!conversation) {
        logger.warn(`AI Conversation ${conversationId} not found.`);
        const error = new Error('Conversation not found');
        error.status = 404;
        throw error;
    }

    // User can only access conversations they created (their AI chat)
    // or if the requestingUserId is the AI_COACH_USER_ID
    if (conversation.createdBy !== requestingUserId && requestingUserId !== AI_COACH_USER_ID) {
        logger.warn(`User ${requestingUserId} is not authorized to view AI conversation ${conversationId}.`);
        const error = new Error('Access denied: You are not authorized to view this conversation.');
        error.status = 403;
        throw error;
    }
    
    return conversation;
};

module.exports = {
    createConversation,
    getUserConversations,
    getConversationById,
    findUserAICoachConversation // Export if needed by other services
};

