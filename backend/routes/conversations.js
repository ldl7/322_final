/**
 * Conversation Routes
 * 
 * Defines all conversation-related API endpoints.
 * Handles creating, retrieving, updating, and deleting conversations.
 * 
 * @module routes/conversations
 * @requires express
 * @requires ../controllers/chatController
 * @requires ../middleware/auth
 */

const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const chatController = require('../controllers/chatController');

module.exports = function(Router) {
  const router = Router();

  // Apply auth middleware to all routes
  router.use(authenticateJWT);

  /**
   * @route   POST /
   * @desc    Get or create a conversation
   * @access  Private
   */
  router.post('/', chatController.getOrCreateConversation);

  /**
   * @route   GET /:id
   * @desc    Get a conversation by ID
   * @access  Private
   */
  router.get('/:id', chatController.getConversation);

  // Future routes can be added here:
  // router.get('/', chatController.getUserConversations);
  // router.post('/group', chatController.createGroupConversation);
  // router.put('/:id/participants', chatController.addParticipants);
  // router.delete('/:id/participants', chatController.removeParticipants);
  // router.delete('/:id', chatController.deleteConversation);

  return router;
};