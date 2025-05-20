/**
 * Conversation Routes
 * 
 * Defines all conversation-related API endpoints.
 * Handles creating, retrieving, updating, and deleting conversations.
 * 
 * @module routes/conversations
 * @requires express
 * @requires ../controllers/conversationController
 * @requires ../middleware/auth
 * @requires ../middleware/validators/conversationValidator
 */

const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const conversationController = require('../controllers/conversationController');
const { createConversationRules, getConversationByIdRules, validateRequest } = require('../middleware/validators/conversationValidator');
const logger = require('../utils/logger');

// Import the message routes (from the api directory)
const messageRoutes = require('./api/messages');

module.exports = function(Router) {
  const router = Router();

  // Apply auth middleware to all routes
  router.use(authenticateJWT);

  /**
   * @route   POST /
   * @desc    Create a new conversation or return existing direct conversation
   * @access  Private
   */
  router.post(
    '/',
    createConversationRules(),
    validateRequest,
    conversationController.createConversationHandler
  );

  /**
   * @route   GET /:id
   * @desc    Get a conversation by ID
   * @access  Private
   */
  router.get(
    '/:id',
    getConversationByIdRules(),
    validateRequest,
    conversationController.getConversationByIdHandler
  );

  /**
   * @route   GET /
   * @desc    Get all conversations for the logged-in user
   * @access  Private
   */
  router.get('/', conversationController.getUserConversationsHandler);
  
  // Mount message routes under /:conversationId/messages
  logger.info('Mounting message routes under /conversations/:conversationId/messages');
  router.use('/:conversationId/messages', messageRoutes);
  
  // Future routes can be added here:
  // router.put('/:id/participants', conversationController.addParticipantsHandler);
  // router.delete('/:id/participants', conversationController.removeParticipantsHandler);
  // router.delete('/:id', conversationController.deleteConversationHandler);

  return router;
};