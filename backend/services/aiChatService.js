const { Op } = require('sequelize');
const { Conversation, Message, User } = require('../models');
const logger = require('../utils/logger');
const aiService = require('./aiService');

class AIChatService {
  /**
   * Get or create an AI conversation for a user
   * @param {string} userId - The ID of the user
   * @returns {Promise<Object>} The AI conversation
   */
  static async getOrCreateAIConversation(userId) {
    try {
      // Check if user already has an AI conversation
      const existingConversation = await Conversation.findOne({
        where: {
          type: 'direct',
          name: 'AI Coach',
          '$participants.id$': userId
        },
        include: [{
          model: User,
          as: 'participants',
          where: { id: userId },
          attributes: ['id'],
          through: { attributes: [] }
        }]
      });

      if (existingConversation) {
        return existingConversation;
      }

      // Create a new AI conversation
      const conversation = await Conversation.create({
        type: 'direct',
        name: 'AI Coach',
        createdBy: userId,
        isAIConversation: true
      });

      // Add the user to the conversation
      await conversation.addParticipant(userId);

      // Add a welcome message from the AI
      await Message.create({
        content: 'Hello! I\'m your AI Coach. How can I assist you today?',
        senderId: '00000000-0000-0000-0000-000000000000', // System AI user ID
        conversationId: conversation.id,
        isFromAI: true
      });

      return conversation;
    } catch (error) {
      logger.error('Error in getOrCreateAIConversation:', error);
      throw new Error('Failed to get or create AI conversation');
    }
  }

  /**
   * Send a message to the AI coach and get a response
   * @param {string} userId - The ID of the user sending the message
   * @param {string} content - The message content
   * @returns {Promise<Object>} The AI's response message
   */
  static async sendMessageToAI(userId, content) {
    const transaction = await sequelize.transaction();
    
    try {
      // Get or create the AI conversation
      const conversation = await this.getOrCreateAIConversation(userId);
      
      // Save the user's message
      const userMessage = await Message.create({
        content,
        senderId: userId,
        conversationId: conversation.id,
        isFromAI: false
      }, { transaction });

      // Get conversation history (last 10 messages for context)
      const messages = await Message.findAll({
        where: { conversationId: conversation.id },
        order: [['createdAt', 'ASC']],
        limit: 10,
        transaction
      });

      // Format messages for the AI
      const formattedMessages = messages.map(msg => ({
        role: msg.isFromAI ? 'assistant' : 'user',
        content: msg.content
      }));

      // Get AI response
      const aiResponse = await aiService.generateResponse(formattedMessages, userId);

      // Save the AI's response
      const aiMessage = await Message.create({
        content: aiResponse,
        senderId: '00000000-0000-0000-0000-000000000000', // System AI user ID
        conversationId: conversation.id,
        isFromAI: true
      }, { transaction });

      await transaction.commit();
      
      return aiMessage;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error in sendMessageToAI:', error);
      throw new Error('Failed to send message to AI');
    }
  }

  /**
   * Get AI conversation history for a user
   * @param {string} userId - The ID of the user
   * @param {number} limit - Maximum number of messages to return
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Object>} Conversation and messages
   */
  static async getAIConversation(userId, limit = 20, offset = 0) {
    try {
      const conversation = await this.getOrCreateAIConversation(userId);
      
      const { count, rows: messages } = await Message.findAndCountAll({
        where: { conversationId: conversation.id },
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'username', 'email']
          }
        ]
      });

      return {
        conversation: {
          id: conversation.id,
          name: conversation.name,
          type: conversation.type,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt
        },
        messages: messages.reverse(), // Return in chronological order
        total: count,
        hasMore: offset + messages.length < count
      };
    } catch (error) {
      logger.error('Error in getAIConversation:', error);
      throw new Error('Failed to get AI conversation');
    }
  }
}

module.exports = AIChatService;
