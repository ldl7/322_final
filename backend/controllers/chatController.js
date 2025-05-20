/**
 * Chat Controller
 * 
 * Manages chat conversations including creating, listing, and updating conversations.
 * Handles both direct messages and group chats.
 * 
 * @module controllers/chatController
 * @requires ../models/Conversation
 * @requires ../models/User
 * @requires ../models/Message
 * @requires ../services/chatService
 * @requires ../utils/logger
 * @requires ../models - Sequelize models
 * 
 * @example
 * // Example routes that use this controller:
 * GET    /api/conversations - List user's conversations
 * POST   /api/conversations - Create new conversation
 * GET    /api/conversations/:id - Get conversation details
 * PUT    /api/conversations/:id - Update conversation
 * DELETE /api/conversations/:id - Delete conversation
 */
const { sequelize, User, UserConversation, Conversation, Message } = require('../models');
const { Op } = require('sequelize'); // <--- ADD THIS LINE
const logger = require('../utils/logger');
// File will be implemented with:
// 1. Create new conversations (direct or group)
// 2. List user's conversations with pagination
// 3. Get conversation details and participants
// 4. Update conversation (add/remove participants, change title, etc.)
// 5. Delete or archive conversations

// Implementation will include proper authorization and validation

/**
 * Get or create a direct conversation between two users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getOrCreateConversation = async (req, res) => {
  logger.info('=== START getOrCreateConversation ===');
  logger.info('Request body:', JSON.stringify(req.body, null, 2));
  logger.info('Authenticated user:', JSON.stringify(req.user, null, 2));
  
  let { participantUserIds } = req.body;
  const currentUserId = req.user?.id;
  let participantId;
  
  if (!currentUserId) {
    const errorMsg = 'Current user ID is missing';
    logger.error(errorMsg);
    return res.status(401).json({ status: 'error', message: 'Authentication required' });
  }
  
  // Extract participantId from participantUserIds array if provided
  if (participantUserIds && Array.isArray(participantUserIds) && participantUserIds.length > 0) {
    participantId = participantUserIds[0]; // Take the first one for a direct chat
    logger.info(`Extracted participantId from participantUserIds array: ${participantId}`);
  }
  
  logger.info(`Current User ID: ${currentUserId}, Requested Participant ID: ${participantId}`);
  
  // If no participant ID is provided or it's invalid, find another valid user
  if (!participantId || participantId === currentUserId) {
    logger.info('Finding a valid participant as none was provided or invalid one was supplied');
    try {
      const otherUser = await User.findOne({
        where: {
          id: { [Op.ne]: currentUserId } // Using Op from sequelize import
        },
        attributes: ['id', 'username', 'email']
      })
      if (otherUser) {
        participantId = otherUser.id;
        logger.info(`Using alternate participant: ${otherUser.username} (${otherUser.id})`);
      } else {
        // Create a chatbot user if no other users exist
        logger.info('No other users found, creating a chatbot user');
        const chatbot = await User.findOrCreate({
          where: { email: 'chatbot@example.com' },
          defaults: {
            id: sequelize.literal('UUID()'),
            username: 'chatbot',
            email: 'chatbot@example.com',
            password: 'chatbotpassword123',
            first_name: 'Chat',
            last_name: 'Bot',
            role: 'system',
            is_email_verified: true
          }
        });
        participantId = chatbot[0].id;
        logger.info(`Created and using chatbot as participant: ${participantId}`);
      }
    } catch (error) {
      logger.error('Error finding alternative participant:', error);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Failed to find a valid conversation participant' 
      });
    }
  }
  
  logger.info(`Using participant ID: ${participantId}`);
  
  if (participantId === currentUserId) {
    const errorMsg = 'Cannot create a conversation with yourself';
    logger.error(errorMsg);
    return res.status(400).json({ status: 'error', message: errorMsg });
  }

  let transaction;
  
  try {
    // Start a transaction
    transaction = await sequelize.transaction();
    
    logger.info('Transaction started');
    
    try {
      // Log the users table for debugging
      const allUsers = await User.findAll({ transaction });
      logger.info('All users in database:', JSON.stringify(allUsers.map(u => ({
        id: u.id,
        email: u.email,
        username: u.username
      })), null, 2));
      
      // Debug the transaction condition
      logger.info('Transaction exists:', !!transaction);
      logger.info('Transaction finished type:', typeof transaction.finished);
      logger.info('Transaction finished value:', transaction.finished);
      logger.info('🔍 DEBUG - Point 1: After user debug logs');
    } catch (debugError) {
      logger.error('❌ Error in debug logging section:', debugError);
      throw debugError;
    }
    
    // Simplified condition - we only need to check if transaction exists
    logger.info('🔍 DEBUG - Point 2: About to enter main transaction block');
    if (transaction) { 
      logger.info('✅ Inside transaction block!');
      logger.info(`Looking for participant with ID: ${participantId}`);
      // Declare participant variable outside the try block so it's available in the outer scope
      let participant;
      try {
        participant = await User.findByPk(participantId, { transaction });
        logger.info('🔍 DEBUG - Point 3: After findByPk');
        if (!participant) {
          const errorMsg = `Participant with ID ${participantId} not found`;
          logger.error(errorMsg);
          await transaction.rollback();
          return res.status(404).json({ status: 'error', message: errorMsg });
        }
        // Successfully found participant
        logger.info(`Found participant: ${participant.username} (${participant.email})`);
      } catch (participantError) {
        logger.error('❌ Error finding participant:', participantError);
        throw participantError;
      }
      

      logger.info('🔍 DEBUG - Point 4: About to create conversation');
      // Create a new conversation with explicit timestamps
      logger.info('Creating new conversation...');
      const now = new Date();
      let conversationId;
      try {
        // Generate UUID on the JavaScript side for better control
        conversationId = require('uuid').v4();
        logger.info('🔍 DEBUG - Point 5: Generated UUID');
      } catch (uuidError) {
        logger.error('❌ Error generating UUID:', uuidError);
        throw uuidError;
      }
      logger.info(`Generated conversation ID: ${conversationId}`);
      
      // Create conversation with pre-generated ID
      const newConversation = await Conversation.create({
        id: conversationId,
        type: 'direct',
        name: null, // Can be null for direct conversations
        createdBy: currentUserId, // This matches the exact column name in the database (camelCase)
        created_at: now,
        updated_at: now
      }, { 
        transaction,
        // Specify exact field names with correct case sensitivity
        fields: ['id', 'type', 'name', 'createdBy', 'created_at', 'updated_at']
      });
      
      logger.info(`Created conversation with ID: ${newConversation.id}`);
      
      logger.info(`Created conversation with ID: ${newConversation.id}`);

      // Add participants to the conversation using the association method
      logger.info(`Adding participants: [${currentUserId}, ${participantId}]`);
      
      try {
        // Create UserConversation records manually with the correct structure
        // Ensure we're using the actual conversation ID string, not an object
        const conversationIdString = newConversation.id.toString();
        logger.info(`Adding user ${currentUserId} to conversation ${conversationIdString}`);
        await UserConversation.create({
          user_id: currentUserId,
          conversation_id: conversationIdString,
          created_at: new Date(),
          updated_at: new Date()
        }, { transaction });
        
        logger.info(`Adding user ${participantId} to conversation ${conversationIdString}`);
        await UserConversation.create({
          user_id: participantId,
          conversation_id: conversationIdString,
          created_at: new Date(),
          updated_at: new Date()
        }, { transaction });
        
        logger.info('Participants added successfully');
      } catch (error) {
        logger.error('Error adding participants:', error.message);
        logger.error('Error details:', JSON.stringify({
          name: error.name,
          stack: error.stack.split('\n').slice(0, 3).join('\n'),
          code: error.code,
          sql: error.sql
        }, null, 2));
        throw error; // This will be caught by the outer try-catch
      }

      try {
        // Fetch conversation with participants using proper associations
        logger.info(`Fetching conversation with ID: ${conversationId}`);
        const conversation = await Conversation.findByPk(conversationId, {
          include: [
            {
              model: User,
              as: 'participants',
              through: { attributes: [] }, // Exclude join table attributes
              attributes: ['id', 'username', 'email', 'first_name', 'last_name']
            },
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'username', 'email', 'first_name', 'last_name']
            }
          ],
          transaction
        });
        
        if (!conversation) {
          logger.error(`Failed to fetch conversation with ID: ${conversationId}`);
          throw new Error('Failed to fetch the created conversation');
        }
        
        // Convert to plain object and format the response
        const conversationData = conversation.get({ plain: true });
        logger.info('Conversation fetched successfully');
        
        // Log participants for debugging
        const participants = conversationData.participants || [];
        logger.info(`Found ${participants.length} participants for conversation: ${participants.map(p => p.id).join(', ')}`);
        
        logger.info('Preparing conversationDetails for response...');
        const participantDetails = conversation.participants.map(p => ({
          id: p.id,
          username: p.username,
        }));
        logger.info('Participant details mapped.');

        const creatorDetails = conversation.creator ? {
          id: conversation.creator.id,
          username: conversation.creator.username,
        } : null;
        logger.info('Creator details mapped.');

        const conversationDetails = {
          id: conversation.id,
          type: conversation.type,
          name: conversation.name,
          createdBy: conversation.createdBy,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
          participants: participantDetails,
          creator: creatorDetails,
        };
        logger.info('Conversation details object created:', conversationDetails);

        logger.info('Successfully prepared conversationDetails. Preparing to add welcome message and commit transaction...');
        
        // Create a welcome message from the system or participant
        logger.info('Creating welcome message for the conversation...');
        try {
          // Get message sender - using the participant or system user
          const welcomeMessageSender = participantId;
          const welcomeContent = `Hello Test, How are you feeling today?`;
          
          // Create welcome message using the Message model
          logger.info('Creating welcome message with Message model...');
          try {
            // Generate UUID for the message
            const messageId = require('uuid').v4();
            logger.info(`Generated message ID: ${messageId}`);
            
            // Create message with minimal required fields and let Sequelize handle the rest
            const welcomeMessage = await Message.create({
              id: messageId,
              content: welcomeContent,
              type: 'text',
              status: 'sent',
              senderId: welcomeMessageSender,
              conversationId: conversationId
              // Let Sequelize handle timestamps automatically
              // Let parentMessageId and metadata default to null
            }, { transaction });
            
            logger.info(`Welcome message created with ID: ${welcomeMessage.id}`);
          } catch (messageDetailedError) {
            // Log detailed error information to diagnose exactly what's wrong
            logger.error('Detailed message creation error:', messageDetailedError);
            logger.error('Error name:', messageDetailedError.name);
            logger.error('Error message:', messageDetailedError.message);
            if (messageDetailedError.parent) {
              logger.error('Parent error:', messageDetailedError.parent);
              logger.error('SQL error:', messageDetailedError.parent.sqlMessage);
              logger.error('SQL code:', messageDetailedError.parent.code);
            }
            throw messageDetailedError; // Re-throw to be caught by the outer catch
          }
        } catch (messageError) {
          // Log error but don't fail the conversation creation if message fails
          logger.error('Error creating welcome message:', messageError);
          logger.error('Continuing with conversation creation despite welcome message failure');
        }
        
        // Now commit the transaction with all changes (conversation, participants, welcome message)
        logger.info('Attempting to commit transaction...');
        await transaction.commit();
        logger.info('Transaction committed successfully');
        
        logger.info('Conversation created successfully:');
        
        // Format the response following best practices with consistent naming
        logger.info('Sending success response to client.');
        res.status(201).json({
          status: 'success',
          message: 'Conversation created successfully',
          data: {
            id: conversationDetails.id,
            type: conversationDetails.type,
            name: conversationDetails.name,
            createdBy: conversationDetails.createdBy,
            participants: conversationDetails.participants,
            creator: conversationDetails.creator,
            participantCount: conversationDetails.participants.length,
            createdAt: conversationDetails.createdAt,
            updatedAt: conversationDetails.updatedAt,
            isNew: true
          }
        });
      } catch (fetchError) {
        logger.error('--- INNER CATCH BLOCK ---');
        logger.error('Type of fetchError:', typeof fetchError);
        logger.error('fetchError raw value:', fetchError);
        try {
          logger.error('fetchError JSON.stringify (simple):', JSON.stringify(fetchError, null, 2));
          logger.error('fetchError JSON.stringify (w/ props):', JSON.stringify(fetchError, Object.getOwnPropertyNames(fetchError), 2));
        } catch (stringifyError) {
          logger.error('Failed to stringify fetchError:', stringifyError);
        }

        if (fetchError instanceof Error) {
          logger.error('fetchError is an instance of Error.');
          logger.error('Error message:', fetchError.message);
          logger.error('Error stack:', fetchError.stack);
          if (fetchError.original) {
            logger.error('Original Sequelize error:', fetchError.original);
          }
        } else {
          logger.error('fetchError is NOT a standard Error instance.');
        }
        throw fetchError; // Re-throw to be caught by the outer catch block
      }
    }
  } catch (error) {
    logger.error('--- OUTER CATCH BLOCK ---');
    logger.error('Type of error in getOrCreateConversation:', typeof error);
    logger.error('Error in getOrCreateConversation (raw):', error);
    try {
        logger.error('Error in getOrCreateConversation (JSON.stringify simple):', JSON.stringify(error, null, 2));
        logger.error('Error in getOrCreateConversation (JSON.stringify w/ props):', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    } catch (stringifyError) {
        logger.error('Failed to stringify error in outer catch:', stringifyError);
    }

    if (error instanceof Error) {
        logger.error('Error message:', error.message);
        logger.error('Error stack:', error.stack);
        if (error.original) { // For Sequelize errors
            logger.error('Original Sequelize error:', error.original);
        }
    } else {
        logger.error('Error is not an instance of Error object.');
    }

    // Attempt to rollback transaction if it exists and hasn't been finished
    if (transaction && typeof transaction.finished === 'boolean' && !transaction.finished) {
        try {
            logger.info('Attempting to rollback transaction due to error in outer catch block...');
            await transaction.rollback();
            logger.info('Transaction rolled back successfully from outer catch.');
        } catch (rollbackError) {
            logger.error('Failed to rollback transaction from outer catch:', rollbackError);
        }
    }

    if (res.headersSent) {
        logger.error('Headers already sent, cannot send error response from outer catch.');
        return; // Exit if headers are already sent
    }

    // Handle specific Sequelize error types
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
        const errors = error.errors?.map(err => ({ field: err.path, message: err.message }));
        return res.status(400).json({
            status: 'error',
            message: 'Validation error.',
            errors: errors,
            ...(process.env.NODE_ENV === 'development' && {
                errorDetails: { name: error.name, message: error.message, stack: error.stack, original: error.original }
            })
        });
    }
    
    if (error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid reference. One or more users may not exist or related data is missing.',
            ...(process.env.NODE_ENV === 'development' && {
                errorDetails: { name: error.name, message: error.message, stack: error.stack, original: error.original }
            })
        });
    }

    // Default error response for other errors
    const errorMessageString = (error instanceof Error ? error.message : String(error)) || 'Failed to create or retrieve conversation due to an unexpected server error.';
    const errorResponse = {
        message: errorMessageString,
        status: 'error',
    };
    if (process.env.NODE_ENV === 'development') {
        errorResponse.errorDetails = {
            name: error instanceof Error ? error.name : typeof error,
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            original: error instanceof Error ? error.original : undefined
        };
    }
    res.status(500).json(errorResponse);
  } finally {
    logger.info('=== END getOrCreateConversation ===');
  }
};

/**
 * Get a conversation by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getConversation = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const conversation = await Conversation.findOne({
      where: { id },
      include: [
        {
          model: User,
          as: 'participants',
          attributes: ['id', 'username', 'email', 'firstName', 'lastName', 'profilePicture'],
          through: { attributes: [] }
        },
        {
          model: Message,
          as: 'messages',
          limit: 50, // Limit to 50 most recent messages
          order: [['createdAt', 'DESC']],
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'username', 'profilePicture']
            }
          ]
        }
      ]
    });

    if (!conversation) {
      return res.status(404).json({ status: 'error', message: 'Conversation not found' });
    }

    // Check if the user is a participant in this conversation
    const isParticipant = conversation.participants.some(p => p.id === userId);
    if (!isParticipant) {
      return res.status(403).json({ status: 'error', message: 'Not authorized to view this conversation' });
    }

    res.status(200).json({
      status: 'success',
      data: { conversation }
    });
  } catch (error) {
    logger.error('Error in getConversation:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get conversation' });
  }
};

module.exports = {
  getOrCreateConversation,
  getConversation
};
