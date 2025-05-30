const { Message, User, Conversation, UserConversation, sequelize } = require('../models');
const logger = require('../utils/logger');
const aiChatService = require('./aiChatService');
const { Op } = require('sequelize');
const { BadRequestError, NotFoundError, UnauthorizedError } = require('../utils/errors');

/**
 * Send a message in a conversation and generate AI response if needed
 * @param {string} senderId - ID of the user sending the message
 * @param {string} conversationId - ID of the conversation
 * @param {string} content - Message content
 * @param {string} type - Message type (e.g., 'text', 'image')
 * @param {Object} metadata - Additional metadata for the message
 * @returns {Promise<Object>} - Object containing user message and AI response (if any)
 */
const sendMessage = async (senderId, conversationId, content, type = 'text', metadata = {}) => {
  logger.info(`SERVICE: sendMessage called by UserID: ${senderId} in ConversationID: ${conversationId} with content: "${content}"`);
  
  // Input validation
  if (!senderId || !conversationId) {
    logger.error(`SERVICE: sendMessage called with invalid senderId (${senderId}) or conversationId (${conversationId})`);
    throw new BadRequestError('Invalid sender ID or conversation ID provided.');
  }

  const transaction = await sequelize.transaction();
  try {
    // Step 1: Validate conversation exists
    const conversation = await Conversation.findByPk(conversationId, { transaction });
    if (!conversation) {
      logger.error(`SERVICE: Conversation with ID ${conversationId} not found.`);
      throw new NotFoundError('Conversation not found.');
    }

    // Step 2: Validate user is part of this conversation
    const userParticipation = await UserConversation.findOne({
      where: {
        userId: senderId,
        conversationId: conversationId
      },
      transaction
    });

    if (!userParticipation) {
      logger.error(`SERVICE: User ${senderId} is not part of conversation ${conversationId}.`);
      throw new UnauthorizedError('User not part of this conversation.');
    }

    logger.info(`SERVICE: User ${senderId} confirmed in conversation ${conversationId}. Creating message.`);
    
    // Create the user's message
    const userMessage = await Message.create({
      content,
      type,
      metadata,
      senderId,
      conversationId,
      status: 'sent',
    }, { transaction });

    // Get the populated message with sender details
    const populatedMessage = await Message.findByPk(userMessage.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'email', 'first_name', 'last_name'],
        },
      ],
      transaction
    });

    logger.info(`SERVICE: User message ${userMessage.id} created. Updating conversation timestamp.`);
    // Update conversation's updatedAt timestamp
    await conversation.update({ updatedAt: new Date() }, { transaction });

    logger.info(`SERVICE: Conversation ${conversationId} timestamp updated. Preparing AI response.`);
    let aiMessage = null;
    const aiUserId = process.env.AI_COACH_USER_ID;

    // Check if this is a conversation with the AI coach
    const participants = await conversation.getParticipants({ 
      attributes: ['id'], 
      transaction 
    });
    
    const isAIChat = participants.some(p => p.id === aiUserId);

    if (isAIChat && senderId !== aiUserId) {
      logger.info(`SERVICE: Generating AI response for conversation ${conversationId}.`);
      const aiResponse = await aiChatService.generateResponse(conversationId, content, senderId, transaction);
      
      if (aiResponse && aiResponse.content) {
        logger.info(`SERVICE: AI response content received: "${aiResponse.content.substring(0, 30)}${aiResponse.content.length > 30 ? '...' : ''}"`);
        
        // Create AI message
        aiMessage = await Message.create({
          content: aiResponse.content,
          type: 'text',
          senderId: aiUserId,
          conversationId,
          metadata: { isAI: true },
          status: 'sent',
        }, { transaction });

        // Get the populated AI message with sender details
        aiMessage = await Message.findByPk(aiMessage.id, {
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'username', 'email', 'first_name', 'last_name'],
            },
          ],
          transaction
        });

        logger.info(`SERVICE: AI message ${aiMessage.id} created. Updating conversation timestamp again.`);
        await conversation.update({ updatedAt: new Date() }, { transaction });
      } else {
        logger.warn(`SERVICE: No AI response content generated for conversation ${conversationId}.`);
      }
    } else {
      logger.info(`SERVICE: Not an AI chat or sender is AI. AI UserID: ${aiUserId}, SenderID: ${senderId}, IsAIChat: ${isAIChat}`);
    }

    await transaction.commit();
    logger.info(`SERVICE: Transaction committed. User message ${userMessage.id} and AI message ${aiMessage?.id || 'N/A'} processed.`);
    return { userMessage: populatedMessage, aiMessage };
  } catch (error) {
    logger.error('SERVICE: Error in MessageService.sendMessage, rolling back transaction.', error);
    await transaction.rollback();
    
    // Re-throw known error types
    if (error instanceof UnauthorizedError || 
        error instanceof BadRequestError || 
        error instanceof NotFoundError) {
      throw error;
    }
    
    // Wrap other errors
    throw new Error(`Failed to send message: ${error.message}`);
  }
};

/**
 * Get messages for a conversation with pagination
 * @param {string} conversationId - ID of the conversation
 * @param {Object} options - Options for pagination and filtering
 * @param {string|number} [options.page=1] - Page number (1-based)
 * @param {string|number} [options.limit=20] - Number of messages per page
 * @param {string} [options.beforeMessageId] - Get messages before this message ID
 * @param {string} [options.afterMessageId] - Get messages after this message ID
 * @returns {Promise<Object>} - Object containing messages and pagination info
 */
const getMessages = async (conversationId, userId, options = {}) => {
  try {
    const { page: pageOpt, limit: limitOpt, beforeMessageId, afterMessageId } = options;
    
    // Parse and validate limit
    let effectiveLimit = 20; // Default limit
    if (limitOpt !== undefined) {
      const parsedLimit = parseInt(limitOpt, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        effectiveLimit = parsedLimit;
      }
    }

    const queryOptions = {
      where: { conversationId },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'email', 'first_name', 'last_name'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: effectiveLimit,
    };

    if (beforeMessageId) {
      const cursorMessage = await Message.findByPk(beforeMessageId);
      if (!cursorMessage) {
        throw new Error('beforeMessageId not found');
      }
      queryOptions.where.created_at = { [Op.lt]: cursorMessage.createdAt };
    } else if (afterMessageId) {
      const cursorMessage = await Message.findByPk(afterMessageId);
      if (!cursorMessage) {
        throw new Error('afterMessageId not found');
      }
      queryOptions.where.created_at = { [Op.gt]: cursorMessage.createdAt };
      queryOptions.order = [['created_at', 'ASC']];
    } else {
      // Only apply pagination if not using cursor-based pagination
      let effectivePage = 1; // Default page
      if (pageOpt !== undefined) {
        const parsedPage = parseInt(pageOpt, 10);
        if (!isNaN(parsedPage) && parsedPage > 0) {
          effectivePage = parsedPage;
        }
      }
      queryOptions.offset = (effectivePage - 1) * effectiveLimit;
    }

    const { count, rows } = await Message.findAndCountAll(queryOptions);
    
    // If we're using afterMessageId, we need to reverse the order back to newest first
    const messages = afterMessageId ? [...rows].reverse() : [...rows];

    return {
      messages,
      pagination: {
        currentPage: afterMessageId || beforeMessageId ? undefined : parseInt(pageOpt, 10) || 1,
        totalPages: Math.ceil(count / effectiveLimit),
        totalItems: count,
        itemsPerPage: effectiveLimit,
      },
    };
  } catch (error) {
    logger.error('Error in messageService.getMessages:', error);
    throw error;
  }
};

/**
 * Mark messages as read for a user in a conversation
 * @param {string} userId - ID of the user
 * @param {string} conversationId - ID of the conversation
 * @param {Array<string>} [messageIds] - Optional array of specific message IDs to mark as read
 * @returns {Promise<number>} - Number of messages marked as read
 */
const markMessagesAsRead = async (userId, conversationId, messageIds = null) => {
  try {
    const whereClause = {
      conversationId,
      readAt: null,
    };

    if (messageIds && messageIds.length > 0) {
      whereClause.id = { [Op.in]: messageIds };
    } else {
      whereClause.senderId = { [Op.ne]: userId }; // Don't mark user's own messages as read
    }

    const [updatedCount] = await Message.update(
      { readAt: new Date() },
      {
        where: whereClause,
      }
    );

    return updatedCount;
  } catch (error) {
    logger.error('Error in messageService.markMessagesAsRead:', error);
    throw error;
  }
};

module.exports = {
  sendMessage,
  getMessages,
  markMessagesAsRead,
};
