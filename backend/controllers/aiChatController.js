const httpStatus = require('http-status-codes');
const AIChatService = require('../services/aiChatService');
const logger = require('../utils/logger');

class AIChatController {
  /**
   * Send a message to the AI coach
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async sendMessage(req, res) {
    try {
      const { content } = req.body;
      const userId = req.user.id;

      if (!content || typeof content !== 'string' || content.trim() === '') {
        return res.status(httpStatus.BAD_REQUEST).json({
          status: 'error',
          message: 'Message content is required'
        });
      }

      const aiMessage = await AIChatService.sendMessageToAI(userId, content);
      
      res.status(httpStatus.CREATED).json({
        status: 'success',
        data: {
          message: aiMessage
        }
      });
    } catch (error) {
      logger.error('Error in sendMessage:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to send message to AI',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get AI conversation history
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getConversation(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 20, offset = 0 } = req.query;

      const result = await AIChatService.getAIConversation(
        userId,
        parseInt(limit),
        parseInt(offset)
      );
      
      res.json({
        status: 'success',
        data: result
      });
    } catch (error) {
      logger.error('Error in getConversation:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to fetch AI conversation',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Clear AI conversation history
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async clearConversation(req, res) {
    try {
      const userId = req.user.id;
      await AIChatService.clearAIConversation(userId);
      
      res.json({
        status: 'success',
        message: 'AI conversation history cleared'
      });
    } catch (error) {
      logger.error('Error in clearConversation:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to clear AI conversation',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = AIChatController;
