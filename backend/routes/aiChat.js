const express = require('express');
const { body, query } = require('express-validator');
const { authenticateJWT } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validators/commonValidator');
const AIChatController = require('../controllers/aiChatController');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

/**
 * @route   POST /api/ai/chat
 * @desc    Send a message to the AI coach
 * @access  Private
 */
router.post(
  '/chat',
  [
    body('content')
      .trim()
      .notEmpty()
      .withMessage('Message content is required')
      .isLength({ max: 2000 })
      .withMessage('Message must be less than 2000 characters'),
  ],
  validateRequest,
  AIChatController.sendMessage
);

/**
 * @route   GET /api/ai/conversation
 * @desc    Get AI conversation history
 * @access  Private
 */
router.get(
  '/conversation',
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt(),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be a positive integer')
      .toInt(),
  ],
  validateRequest,
  AIChatController.getConversation
);

/**
 * @route   DELETE /api/ai/conversation
 * @desc    Clear AI conversation history
 * @access  Private
 */
router.delete(
  '/conversation',
  AIChatController.clearConversation
);

module.exports = router;
