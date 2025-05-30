const messageService = require('../services/messageService');
const logger = require('../utils/logger');
const httpStatusCodes = require('http-status-codes');

/**
 * @description Send a new message in a conversation and generate AI response.
 * @route POST /api/conversations/:conversationId/messages
 * @access Private
 */
const sendMessageHandler = async (req, res, next) => {
    try {
        const senderId = req.user.id;
        const { conversationId } = req.params;
        const { content, type, metadata } = req.body;

        if (!content) {
            return res.status(httpStatusCodes.BAD_REQUEST).json({ message: 'Message content is required.' });
        }

        logger.info(`MESSAGE CONTROLLER: Processing message from user ${senderId} in conversation ${conversationId}`);
        
        // Get both user message and AI response
        const { userMessage, aiMessage } = await messageService.sendMessage(
            senderId,
            conversationId,
            content,
            type,
            metadata
        );

        // Get Socket.IO instance
        const io = req.app.get('io');
        
        // Emit user message via WebSocket
        if (io && userMessage) {
            logger.info(`MESSAGE CONTROLLER: Emitting user message ${userMessage.id} via WebSocket`);
            io.to(conversationId.toString()).emit('newMessage', userMessage);
        }

        // Emit AI message via WebSocket (with slight delay to simulate thinking)
        if (io && aiMessage) {
            logger.info(`MESSAGE CONTROLLER: Emitting AI message ${aiMessage.id} via WebSocket`);
            // Optional delay to simulate AI thinking
            setTimeout(() => {
                io.to(conversationId.toString()).emit('newMessage', aiMessage);
            }, 500); // 500ms delay
        }

        // Respond to HTTP request with the user's message
        res.status(httpStatusCodes.CREATED).json(userMessage);
    } catch (error) {
        logger.error('Error in sendMessageHandler:', error);
        // Pass to global error handler or handle specific errors
        if (error.status) { // If error has a status (like from service layer)
             return res.status(error.status).json({ message: error.message });
        }
        next(error); // For generic error handling middleware
    }
};

/**
 * @description Get message history for a conversation.
 * @route GET /api/conversations/:conversationId/messages
 * @access Private
 */
const getMessagesHandler = async (req, res, next) => {
    logger.info(`MESSAGE CONTROLLER: Entered getMessagesHandler for convId: ${req.params.conversationId}`);
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;
        const { page, limit, beforeMessageId, afterMessageId } = req.query;

        // Log the incoming query parameters for debugging
        logger.info('MESSAGE CONTROLLER: Query params:', { 
            page, 
            limit, 
            beforeMessageId, 
            afterMessageId 
        });

        const messagesResult = await messageService.getMessages(
            conversationId,
            userId,
            {
                page,
                limit,
                beforeMessageId,
                afterMessageId
            }
        );
        
        res.status(httpStatusCodes.OK).json(messagesResult);
    } catch (error) {
        logger.error('Error in getMessagesHandler:', error);
        if (error.status) {
             return res.status(error.status).json({ message: error.message });
        }
        next(error);
    }
};

/**
 * @description Mark messages in a conversation as read.
 * @route POST /api/conversations/:conversationId/messages/read
 * @access Private
 */
const markMessagesAsReadHandler = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;
        const { lastReadMessageId } = req.body; // Or however you identify what's been read

        // This service function is a placeholder in your code, you'll need to implement its logic
        const result = await messageService.markMessagesAsRead(conversationId, userId, lastReadMessageId);
        
        // const io = req.app.get('io');
        // if (io) {
        //    io.to(conversationId.toString()).emit('messagesRead', { conversationId, readerId: userId, lastReadMessageId });
        // }

        res.status(httpStatusCodes.OK).json(result);
    } catch (error) {
        logger.error('Error in markMessagesAsReadHandler:', error);
         if (error.status) {
             return res.status(error.status).json({ message: error.message });
        }
        next(error);
    }
};


module.exports = {
    sendMessageHandler,
    getMessagesHandler,
    markMessagesAsReadHandler,
    // Add other handlers as you implement them (update, delete, etc.)
};