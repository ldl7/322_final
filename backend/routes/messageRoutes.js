const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const messageController = require('../controllers/messageController');
const { getMessagesRules, sendMessageRules, markMessagesAsReadRules, validateRequest } = require('../middleware/validators/messageValidator');

// Create a new router instance with mergeParams to access parent route params
const router = express.Router({ mergeParams: true });

// GET /api/conversations/:conversationId/messages
router.get(
  '/',
  authenticateJWT,
  getMessagesRules(),
  validateRequest,
  messageController.getMessagesHandler
);

// POST /api/conversations/:conversationId/messages
router.post(
  '/',
  authenticateJWT,
  sendMessageRules(),
  validateRequest,
  messageController.sendMessageHandler
);

// POST /api/conversations/:conversationId/messages/read
router.post(
  '/read',
  authenticateJWT,
  markMessagesAsReadRules(),
  validateRequest,
  messageController.markMessagesAsReadHandler
);

module.exports = router;
