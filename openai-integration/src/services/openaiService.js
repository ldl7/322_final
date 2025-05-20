/**
 * Core service for communicating with the OpenAI API.
 * Manages API requests, response handling, and error management.
 * Implements best practices for token optimization and request batching.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../backend/.env') });
const { OpenAI } = require('openai');
const logger = require('../../../backend/utils/logger');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generates a response from OpenAI based on conversation history
 * @param {Array} conversationHistory - Array of message objects with role and content
 * @param {string} userMessage - The latest user message
 * @returns {Promise<string>} - The AI response text
 */
async function generateReply(conversationHistory, userMessage) {
  try {
    logger.info('OpenAI Service: Generating reply for message:', userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : ''));
    
    // Format conversation history for OpenAI API
    const messages = [
      // System message to set the AI's behavior
      {
        role: 'system',
        content: 'You are an AI Coach named Coach Ally. You are helpful, empathetic, and concise. Your goal is to provide thoughtful guidance and support to the user.'
      },
      // Include previous conversation history
      ...conversationHistory,
      // Add the latest user message
      { role: 'user', content: userMessage }
    ];

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    // Extract and return the AI's response text
    const aiReply = response.choices[0].message.content.trim();
    logger.info('OpenAI Service: Generated reply successfully');
    return aiReply;
  } catch (error) {
    logger.error('OpenAI Service Error:', error);
    throw new Error(`Failed to generate AI response: ${error.message}`);
  }
}

module.exports = {
  generateReply
};
