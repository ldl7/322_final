const OpenAI = require('openai');
const logger = require('../utils/logger');
const { Conversation, Message, User } = require('../models');

// Initialize OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate a response from the AI coach
 * @param {string} conversationId - ID of the conversation
 * @param {string} userMessage - The user's message
 * @param {string} userId - ID of the user
 * @returns {Promise<Object>} - The AI's response
 */
const generateResponse = async (conversationId, userMessage, userId) => {
  try {
    // Get conversation history (last 10 messages)
    const messages = await Message.findAll({
      where: { conversationId },
      order: [['createdAt', 'ASC']],
      limit: 10,
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'first_name', 'last_name'],
        },
      ],
    });

    // Format messages for the AI
    const formattedMessages = messages.map((msg) => ({
      role: msg.senderId === process.env.AI_COACH_USER_ID ? 'assistant' : 'user',
      content: msg.content,
      name: msg.senderId === process.env.AI_COACH_USER_ID ? 'AI_Coach' : msg.sender.username || 'User',
    }));

    // Add the new user message
    formattedMessages.push({
      role: 'user',
      content: userMessage,
      name: 'User',
    });

    // Get user info for personalization
    const user = await User.findByPk(userId, {
      attributes: ['first_name', 'last_name', 'username'],
    });

    const userName = user?.first_name || user?.username || 'there';

    // System message to set the AI's behavior
    const systemMessage = {
      role: 'system',
      content: `You are an AI health and wellness coach named Coach Ally. You are having a conversation with ${userName}. ` +
        'Your goal is to provide supportive, empathetic, and helpful guidance on health, fitness, nutrition, and general wellness. ' +
        'Keep your responses concise, friendly, and professional. ' +
        'If asked about medical advice, always recommend consulting with a healthcare professional. ' +
        'Be encouraging and positive in your responses.'
    };

    // Prepare the messages array for the API call
    const apiMessages = [systemMessage, ...formattedMessages];

    // Call the OpenAI API with v4+ syntax
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiResponse = completion.choices[0].message.content;

    return {
      content: aiResponse,
      metadata: {
        model: 'gpt-3.5-turbo',
        tokens: completion.usage?.total_tokens || 0,
      },
    };
  } catch (error) {
    logger.error('Error in aiChatService.generateResponse:', error);
    
    // Return a friendly error message if the API call fails
    return {
      content: "I'm sorry, I'm having trouble generating a response right now. Please try again later.",
      metadata: {
        error: error.message,
      },
    };
  }
};

module.exports = {
  generateResponse,
};
