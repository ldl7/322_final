const express = require('express');
// Ensure mergeParams is true to access :conversationId from parent router
const router = express.Router({ mergeParams: true }); 
const messageController = require('../../controllers/messageController');
const {
    sendMessageRules,
    getMessagesRules,
    markMessagesAsReadRules,
    validateRequest
} = require('../../middleware/validators/messageValidator');
const authMiddleware = require('../../middleware/authMiddleware'); // Assuming this path

// @route   POST /
// @desc    Send a new message in a conversation
// @access  Private
// (Mounted at /api/conversations/:conversationId/messages)
router.post(
    '/',
    authMiddleware,
    sendMessageRules(),
    validateRequest,
    messageController.sendMessageHandler
);

// @route   GET /
// @desc    Get message history for a conversation
// @access  Private
// (Mounted at /api/conversations/:conversationId/messages)
router.get(
    '/',
    authMiddleware,
    getMessagesRules(),
    validateRequest,
    messageController.getMessagesHandler
);

// @route   POST /read
// @desc    Mark messages in a conversation as read
// @access  Private
// (Mounted at /api/conversations/:conversationId/messages/read)
router.post(
    '/read',
    authMiddleware,
    markMessagesAsReadRules(),
    validateRequest,
    messageController.markMessagesAsReadHandler
);

module.exports = router;

