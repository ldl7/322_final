const { OpenAI } = require('openai');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      logger.warn('OpenAI API key not configured. AI features will be disabled.');
      this.openai = null;
      this.isConfigured = false; // Add a flag to check if configured
      return;
    }

    // Directly instantiate the OpenAI client
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.isConfigured = true; // Mark as configured
    this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    this.systemPrompt = process.env.COACH_ALLY_SYSTEM_PROMPT ||
      'You are Coach Ally, a supportive and encouraging AI assistant. ' +
      'Help users with their tasks, provide guidance, and offer helpful suggestions.';
    logger.info(`OpenAI Service configured with model: ${this.model}`);
  }

  async generateResponse(messages, userId) {
    if (!this.isConfigured || !this.openai) { // Check the flag
      logger.warn('AIService.generateResponse called but OpenAI service is not configured.');
      throw new Error('OpenAI service is not configured');
    }

    try {
      const conversation = [
        { role: 'system', content: this.systemPrompt },
        ...messages,
      ];

      logger.info(`Generating AI response for user ${userId} with model ${this.model}`);

      // Use the new API structure for chat completions
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: conversation,
        temperature: 0.7,
        max_tokens: 500,
        user: userId, // Associate chat with user for abuse monitoring
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      logger.error('Error generating AI response:', {
        message: error.message,
        name: error.name,
        // Consider logging parts of the error object if it's an APIError from OpenAI
        ...(error.response && error.response.data && { responseData: error.response.data }),
        stack: error.stack
      });
      throw new Error('Failed to generate AI response');
    }
  }

  async generateTaskSuggestions(userTasks, userId) {
    if (!this.isConfigured || !this.openai) { // Check the flag
      logger.warn('AIService.generateTaskSuggestions called but OpenAI service is not configured.');
      throw new Error('OpenAI service is not configured');
    }

    try {
      const taskList = userTasks
        .map((task, index) => `${index + 1}. ${task.title} (${task.priority} priority)`)
        .join('\n');

      const prompt = `The user has the following tasks:\n${taskList}\n\n` +
        'Please provide 3-5 suggestions for organizing or prioritizing these tasks. ' +
        'Consider due dates, priorities, and task relationships. ' +
        'Be encouraging and provide actionable advice.';

      // Assuming generateResponse is updated as above
      const response = await this.generateResponse(
        [{ role: 'user', content: prompt }],
        userId
      );

      return response;
    } catch (error) {
      logger.error('Error generating task suggestions:', error);
      throw new Error('Failed to generate task suggestions');
    }
  }

  async analyzeTask(task, userId) {
    if (!this.isConfigured || !this.openai) { // Check the flag
      logger.warn('AIService.analyzeTask called but OpenAI service is not configured.');
      throw new Error('OpenAI service is not configured');
    }

    try {
      const prompt = `Task: ${task.title}\n` +
        (task.description ? `Description: ${task.description}\n` : '') +
        (task.dueDate ? `Due Date: ${new Date(task.dueDate).toDateString()}\n` : '') +
        `Priority: ${task.priority || 'Not specified'}\n\n` +
        'Please analyze this task and provide suggestions for breaking it down into smaller, ' +
        'more manageable steps. Also, suggest any resources or considerations that might help with completion.';

      // Assuming generateResponse is updated as above
      const response = await this.generateResponse(
        [{ role: 'user', content: prompt }],
        userId
      );

      return response;
    } catch (error) {
      logger.error('Error analyzing task:', error);
      throw new Error('Failed to analyze task');
    }
  }
}

// Export a singleton instance
module.exports = new AIService();
