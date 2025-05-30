const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { Conversation, Message, User } = require('../models');
const logger = require('../utils/logger');
const { authenticateJWT } = require('../middleware/auth');
const OpenAI = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * @route   POST /api/ai/chat
 * @desc    Send a message to the AI coach
 * @access  Private
 */
router.post(
  '/chat',
  [authenticateJWT, 
    [
      check('message', 'Message is required').not().isEmpty(),
      check('conversationId', 'Conversation ID is required').isUUID(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message, conversationId } = req.body;
    const userId = req.user.id;

    try {
      // Check if user is part of the conversation
      const userConversation = await UserConversation.findOne({
        where: {
          userId,
          conversationId,
        },
      });

      if (!userConversation) {
        return res.status(404).json({ msg: 'Conversation not found' });
      }

      // Get conversation history
      const conversation = await Conversation.findByPk(conversationId, {
        include: [
          {
            model: Message,
            as: 'messages',
            include: [
              {
                model: User,
                as: 'sender',
                attributes: ['id', 'firstName', 'lastName', 'email'],
              },
            ],
            order: [['createdAt', 'ASC']],
          },
        ],
      });

      if (!conversation) {
        return res.status(404).json({ msg: 'Conversation not found' });
      }

      // Prepare conversation history for the AI
      const messages = conversation.messages.map((msg) => ({
        role: msg.senderId === process.env.AI_COACH_USER_ID ? 'assistant' : 'user',
        content: msg.content,
      }));

      // Add the new user message
      messages.push({
        role: 'user',
        content: message,
      });

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI coach. Provide supportive, empathetic, and constructive responses.',
          },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const aiResponse = completion.choices[0].message.content;

      // Save user message to database
      const userMsg = await Message.create({
        content: message,
        senderId: userId,
        conversationId,
        isRead: false,
      });

      // Save AI response to database
      const aiMsg = await Message.create({
        content: aiResponse,
        senderId: process.env.AI_COACH_USER_ID,
        conversationId,
        isRead: false,
      });

      // Update conversation's updatedAt
      await Conversation.update(
        { updatedAt: new Date() },
        { where: { id: conversationId } }
      );

      // Get the full message with sender info
      const userMessage = await Message.findByPk(userMsg.id, {
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'],
          },
        ],
      });

      const aiMessage = await Message.findByPk(aiMsg.id, {
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'],
          },
        ],
      });

      // Emit messages to all participants
      const io = req.app.get('io');
      io.to(conversationId).emit('message:created', {
        message: userMessage,
        conversationId,
      });

      io.to(conversationId).emit('message:created', {
        message: aiMessage,
        conversationId,
      });

      res.json({
        userMessage,
        aiMessage,
      });
    } catch (err) {
      logger.error('Error in AI chat:', { error: err.message });
      console.error('Error details:', err);
      res.status(500).json({ error: 'Error processing your request' });
    }
  }
);

module.exports = router;
