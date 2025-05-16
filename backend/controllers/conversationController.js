// Handles HTTP requests related to conversations and delegates to conversationService
const conversationService = require('../services/conversationService');
const logger = require('../utils/logger'); // Assuming a logger utility

/**
 * @description Create a new conversation or return an existing direct conversation.
 * @route POST /api/conversations
 * @access Private
 */
const createConversationHandler = async (req, res) => {
    // Assuming auth middleware adds user object to request, containing id
    const creatorId = req.user.id;
    const { participantUserIds, type = 'direct', name = null } = req.body;

    if (!participantUserIds || !Array.isArray(participantUserIds) || (type === 'direct' && participantUserIds.length !== 1)) {
        // For direct, participantUserIds should contain the *other* user's ID.
        // The service layer will combine creatorId and this single participantId for a direct chat.
        // Or, if participantUserIds is meant to be an array of all participants *excluding* creator, adjust accordingly.
        // For this implementation, let's assume participantUserIds = [otherUserId] for direct chat.
        let message = 'ParticipantUserIds array is required.';
        if (type === 'direct' && (!participantUserIds || participantUserIds.length !== 1)) {
            message = 'For direct conversations, participantUserIds must be an array containing exactly one other user ID.';
        }
        return res.status(400).json({ message });
    }
    
    // The service expects a list of *all* participants for a direct chat (creator + other)
    // So, if client sends only the other user, we add the creatorId here.
    // If client sends all participants already, ensure creator is one of them (service also does this).
    let allParticipantIdsForService = [];
    if (type === 'direct') {
        allParticipantIdsForService = [creatorId, participantUserIds[0]];
    } else {
        allParticipantIdsForService = Array.from(new Set([creatorId, ...participantUserIds]));
    }

    try {
        const conversation = await conversationService.createConversation(creatorId, allParticipantIdsForService, type, name);
        // Check if it's a newly created conversation or an existing one returned
        // Sequelize's isNewRecord is true only if it was just created. If an existing direct chat was found, it's false.
        const statusCode = conversation.isNewRecord === false ? 200 : 201; 
        res.status(statusCode).json(conversation);
    } catch (error) {
        logger.error('Error in createConversationHandler:', error);
        if (error.message.includes('must have exactly two participants') || error.message.includes('must have a name')) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Failed to create conversation', error: error.message });
    }
};

/**
 * @description Get all conversations for the logged-in user.
 * @route GET /api/conversations
 * @access Private
 */
const getUserConversationsHandler = async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    try {
        const result = await conversationService.getUserConversations(userId, { 
            page: parseInt(page, 10),
            limit: parseInt(limit, 10) 
        });
        res.status(200).json(result);
    } catch (error) {
        logger.error('Error in getUserConversationsHandler:', error);
        res.status(500).json({ message: 'Failed to retrieve conversations', error: error.message });
    }
};

/**
 * @description Get a specific conversation by ID.
 * @route GET /api/conversations/:id
 * @access Private (User must be a participant)
 */
const getConversationByIdHandler = async (req, res) => {
    const userId = req.user.id;
    const { id: conversationId } = req.params;

    try {
        const conversation = await conversationService.getConversationById(conversationId, userId);
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found.' });
        }
        res.status(200).json(conversation);
    } catch (error) {
        logger.error(`Error in getConversationByIdHandler for conversation ${conversationId}:`, error);
        if (error.status === 403) {
            return res.status(403).json({ message: error.message }); // Access denied message from service
        }
        if (error.message.includes('not found')) { // Catch generic not found if not handled by service's null return
             return res.status(404).json({ message: 'Conversation not found.' });
        }
        res.status(500).json({ message: 'Failed to retrieve conversation', error: error.message });
    }
};

module.exports = {
    createConversationHandler,
    getUserConversationsHandler,
    getConversationByIdHandler,
};

