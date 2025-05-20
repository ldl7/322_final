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
const authMiddleware = require('../../middleware/authMiddleware'); // Use the real auth middleware
const logger = require('../../utils/logger');

logger.info('MESSAGE ROUTER FILE LOADED'); // Confirm this file is loaded by Node

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
    (req, res, next) => {
        logger.info(`MESSAGE ROUTE: Initial entry for GET / (convId: ${req.params.conversationId})`);
        next();
    },
    authMiddleware,
    (req, res, next) => {
        logger.info(`MESSAGE ROUTE: After authMiddleware for GET / (user: ${req.user ? req.user.id : 'null'})`);
        next();
    },
    getMessagesRules(),
    (req, res, next) => {
        logger.info('MESSAGE ROUTE: After getMessagesRules for GET /');
        next();
    },
    validateRequest,
    (req, res, next) => {
        logger.info('MESSAGE ROUTE: After validateRequest for GET /');
        next();
    },
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

