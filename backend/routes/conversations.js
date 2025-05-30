const express = require('express');
const router = express.Router();
const { check, validationResult, body } = require('express-validator');
const { Conversation, Message, User, UserConversation } = require('../models');
const logger = require('../utils/logger');
const { authenticateJWT } = require('../middleware/auth');
const messageRoutes = require('./messageRoutes');

/**
 * @route   POST /api/conversations
 * @desc    Create a new conversation
 * @access  Private
 */
router.post(
  '/',
  [
    authenticateJWT,
    [
      check('participantUserIds', 'At least one participant is required')
        .isArray({ min: 1 }),
      check('participantUserIds.*', 'Invalid participant ID').isUUID(),
      check('name')
        .if(body('type').equals('group'))
        .notEmpty().withMessage('Name is required for group conversations.')
        .isString().withMessage('Name must be a string.'),
      check('type')
        .optional()
        .isIn(['direct', 'group'])
        .withMessage("Type must be 'direct' or 'group'.")
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { participantUserIds, name, type = 'direct' } = req.body;

    try {
      // Create conversation
      const conversation = await Conversation.create({
        name: type === 'group' ? name : null,
        type,
        createdBy: req.user.id,
      });

      // Add participants to the conversation (including the creator)
      const allParticipantIds = Array.from(new Set([...participantUserIds, req.user.id]));
      
      const conversationUsers = allParticipantIds.map((userId) => ({
        userId,
        conversationId: conversation.id,
      }));

      await UserConversation.bulkCreate(conversationUsers);

      // Fetch the created conversation with participants
      const createdConversation = await Conversation.findByPk(conversation.id, {
        include: [
          {
            model: User,
            as: 'participants',
            attributes: ['id', 'username', 'email', 'first_name', 'last_name'],
            through: { attributes: [] },
          },
        ],
      });

      // Emit new conversation event to all participants
      req.app.get('io').to(conversation.id).emit('conversation:created', {
        conversation: createdConversation,
      });

      res.status(201).json(createdConversation);
    } catch (err) {
      logger.error('Server error in conversations/ POST', { error: err.message });
      res.status(500).send('Server Error');
    }
  }
);

/**
 * @route   GET /api/conversations
 * @desc    Get all conversations for the current user
 * @access  Private
 */
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const userConversations = await UserConversation.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Conversation,
          as: 'conversation',
          include: [
            {
              model: User,
              as: 'participants',
              attributes: ['id', 'username', 'email', 'first_name', 'last_name'],
              through: { attributes: [] },
            },
            {
              model: Message,
              as: 'messages',
              limit: 1,
              order: [['createdAt', 'DESC']],
              include: [
                {
                  model: User,
                  as: 'sender',
                  attributes: ['id', 'firstName', 'lastName', 'avatar'],
                },
              ],
            },
          ],
        },
      ],
      order: [[{ model: Conversation, as: 'conversation' }, 'updatedAt', 'DESC']],
    });

    // Extract and format conversations
    const conversations = userConversations.map((uc) => ({
      ...uc.conversation.toJSON(),
      unreadCount: uc.unreadCount || 0,
    }));

    res.json(conversations);
  } catch (err) {
    logger.error('Server error in conversations/ GET', { error: err.message });
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET /api/conversations/:id
 * @desc    Get conversation by ID with messages
 * @access  Private
 */
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    // Check if user is a participant in the conversation
    const userConversation = await UserConversation.findOne({
      where: {
        userId: req.user.id,
        conversationId: req.params.id,
      },
    });

    if (!userConversation) {
      return res.status(404).json({ msg: 'Conversation not found' });
    }

    // Mark messages as read
    await Message.update(
      { isRead: true },
      {
        where: {
          conversationId: req.params.id,
          senderId: { $ne: req.user.id },
          isRead: false,
        },
      }
    );

    // Reset unread count
    await userConversation.update({ unreadCount: 0 });

    // Get conversation with messages and participants
    const conversation = await Conversation.findByPk(req.params.id, {
      include: [
        {
          model: Message,
          as: 'messages',
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'firstName', 'lastName', 'avatar'],
            },
          ],
          order: [['createdAt', 'ASC']],
        },
        {
          model: User,
          as: 'participants',
          attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'],
          through: { attributes: [] },
        },
      ],
    });

    if (!conversation) {
      return res.status(404).json({ msg: 'Conversation not found' });
    }

    res.json(conversation);
  } catch (err) {
    logger.error('Server error in conversations/:id GET', { error: err.message });
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Conversation not found' });
    }
    res.status(500).send('Server Error');
  }
});

/**
 * @route   PUT /api/conversations/:id
 * @desc    Update conversation (e.g., title, participants)
 * @access  Private
 */
router.put(
  '/:id',
  [
    authenticateJWT,
    [
      check('title', 'Title is required').optional().not().isEmpty(),
      check('participants', 'Participants must be an array')
        .optional()
        .isArray(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Check if user is a participant in the conversation
      const userConversation = await UserConversation.findOne({
        where: {
          userId: req.user.id,
          conversationId: req.params.id,
        },
      });

      if (!userConversation) {
        return res.status(404).json({ msg: 'Conversation not found' });
      }

      const { title, participants } = req.body;
      const updates = {};

      // Update title if provided
      if (title) {
        updates.title = title;
      }


      // Update participants if provided
      if (participants && Array.isArray(participants)) {
        // Remove all participants except the current user
        await UserConversation.destroy({
          where: {
            conversationId: req.params.id,
            userId: { $ne: req.user.id },
          },
        });

        // Add new participants
        const newParticipants = participants
          .filter((userId) => userId !== req.user.id)
          .map((userId) => ({
            userId,
            conversationId: req.params.id,
          }));

        if (newParticipants.length > 0) {
          await UserConversation.bulkCreate(newParticipants);
        }
      }

      // Update conversation
      if (Object.keys(updates).length > 0) {
        await Conversation.update(updates, {
          where: { id: req.params.id },
        });
      }

      // Get updated conversation
      const updatedConversation = await Conversation.findByPk(req.params.id, {
        include: [
          {
            model: User,
            as: 'participants',
            attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'],
            through: { attributes: [] },
          },
        ],
      });

      // Emit update event to all participants
      req.app.get('io').to(req.params.id).emit('conversation:updated', {
        conversation: updatedConversation,
      });

      res.json(updatedConversation);
    } catch (err) {
      logger.error('Server error in conversations/:id PUT', { error: err.message });
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Conversation not found' });
      }
      res.status(500).send('Server Error');
    }
  }
);

/**
 * @route   DELETE /api/conversations/:id
 * @desc    Delete a conversation
 * @access  Private
 */
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    // Check if user is a participant in the conversation
    const userConversation = await UserConversation.findOne({
      where: {
        userId: req.user.id,
        conversationId: req.params.id,
      },
    });

    if (!userConversation) {
      return res.status(404).json({ msg: 'Conversation not found' });
    }

    // Delete the conversation (this will cascade to messages and user_conversations)
    await Conversation.destroy({
      where: { id: req.params.id },
    });

    // Emit delete event to all participants
    req.app.get('io').to(req.params.id).emit('conversation:deleted', {
      conversationId: req.params.id,
    });

    res.json({ msg: 'Conversation removed' });
  } catch (err) {
    logger.error('Server error in conversations/:id DELETE', { error: err.message });
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Conversation not found' });
    }
    res.status(500).send('Server Error');
  }
});

// Mount message routes under /:conversationId/messages
router.use('/:conversationId/messages', messageRoutes);

// Export the router with the routes attached
module.exports = router;
