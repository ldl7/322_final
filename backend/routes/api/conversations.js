const express = require('express');
const router = express.Router();
const conversationController = require('../../controllers/conversationController');
const { createConversationRules, getConversationByIdRules, validateRequest } = require('../../middleware/validators/conversationValidator');
const authMiddleware = require('../../middleware/authMiddleware'); // Assuming this path for auth middleware

// @route   POST api/conversations
// @desc    Create a new conversation
// @access  Private
router.post(
    '/', 
    authMiddleware, 
    createConversationRules(), 
    validateRequest, 
    conversationController.createConversationHandler
);

// @route   GET api/conversations
// @desc    Get all conversations for the current user
// @access  Private
router.get(
    '/', 
    authMiddleware, 
    conversationController.getUserConversationsHandler
);

// @route   GET api/conversations/:id
// @desc    Get a specific conversation by its ID
// @access  Private
router.get(
    '/:id', 
    authMiddleware, 
    getConversationByIdRules(), 
    validateRequest, 
    conversationController.getConversationByIdHandler
);

// Mount nested routers for messages and participants
const messageRoutes = require('./messages'); // Assuming messages.js is in the same directory
const participantRoutes = require('./participants'); // Assuming participants.js is in the same directory

router.use('/:conversationId/messages', messageRoutes);
router.use('/:conversationId/participants', participantRoutes);

module.exports = router;

