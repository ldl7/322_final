/**
 * Socket.IO event handlers for real-time communication
 */
const logger = require('../utils/logger');
const messageService = require('../services/messageService');

/**
 * Initialize socket event handlers for a connected client
 * @param {Object} io - Socket.IO server instance
 * @param {Object} socket - Socket.IO client socket
 */
const initializeSocketEventHandlers = (io, socket) => {
  const userId = socket.user.id;
  const username = socket.user.username;

  // Join user to their own room for direct messages
  socket.join(userId.toString());

  // Handle joining conversation rooms
  socket.on('joinConversation', (conversationId) => {
    if (!conversationId) return;
    
    logger.info(`User ${username} (${userId}) joining conversation room: ${conversationId}`);
    socket.join(conversationId.toString());
  });

  // Handle leaving conversation rooms
  socket.on('leaveConversation', (conversationId) => {
    if (!conversationId) return;
    
    logger.info(`User ${username} (${userId}) leaving conversation room: ${conversationId}`);
    socket.leave(conversationId.toString());
  });

  // Handle new message from client
  socket.on('sendMessage', async (data) => {
    try {
      const { conversationId, content, type = 'text', metadata = null } = data;
      
      if (!conversationId || !content) {
        logger.warn(`Invalid message data from user ${username}: missing conversationId or content`);
        socket.emit('messageError', { error: 'Conversation ID and content are required' });
        return;
      }

      logger.info(`SOCKET: Processing message from user ${userId} in conversation ${conversationId}`);
      
      // Send message and get both user message and AI response
      const { userMessage, aiMessage } = await messageService.sendMessage(
        userId,
        conversationId,
        content,
        type,
        metadata
      );

      // Broadcast user message to all participants in the conversation
      logger.info(`SOCKET: Broadcasting user message ${userMessage.id} to conversation ${conversationId}`);
      io.to(conversationId.toString()).emit('newMessage', userMessage);

      // Broadcast AI message with slight delay to simulate thinking
      if (aiMessage) {
        logger.info(`SOCKET: Broadcasting AI message ${aiMessage.id} to conversation ${conversationId}`);
        setTimeout(() => {
          io.to(conversationId.toString()).emit('newMessage', aiMessage);
        }, 500); // 500ms delay
      }
    } catch (error) {
      logger.error(`Error processing message from user ${username}:`, error);
      socket.emit('messageError', { 
        error: 'Failed to process message', 
        details: error.message 
      });
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    const { conversationId } = data;
    if (!conversationId) return;
    
    logger.debug(`User ${username} is typing in conversation ${conversationId}`);
    
    // Broadcast typing event to all participants except sender
    socket.to(conversationId.toString()).emit('userTyping', {
      userId,
      username,
      conversationId
    });
  });

  // Handle read receipts
  socket.on('markAsRead', async (data) => {
    try {
      const { conversationId, lastReadMessageId } = data;
      
      if (!conversationId || !lastReadMessageId) {
        logger.warn(`Invalid read receipt data from user ${username}`);
        return;
      }
      
      logger.info(`User ${username} marked messages as read up to ${lastReadMessageId} in conversation ${conversationId}`);
      
      // Update read status in database
      await messageService.markMessagesAsRead(conversationId, userId, lastReadMessageId);
      
      // Broadcast read receipt to all participants
      io.to(conversationId.toString()).emit('messagesRead', {
        userId,
        username,
        conversationId,
        lastReadMessageId
      });
    } catch (error) {
      logger.error(`Error processing read receipt from user ${username}:`, error);
    }
  });
};

module.exports = initializeSocketEventHandlers;
