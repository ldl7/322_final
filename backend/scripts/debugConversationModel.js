'use strict';

const { Conversation, User, UserConversation, sequelize } = require('../models');
const logger = require('../utils/logger');

/**
 * Debug script to test conversation fetching
 */
async function debugConversationModel() {
  try {
    console.log('Starting Conversation model debugging...');
    
    // Check database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Find all conversations
    console.log('\nFetching all conversations:');
    const conversations = await Conversation.findAll({
      raw: true
    });
    console.log(`Found ${conversations.length} conversations:`);
    conversations.forEach(conv => {
      console.log(`ID: ${conv.id}, Type: ${conv.type}, CreatedBy: ${conv.createdBy}`);
    });
    
    if (conversations.length === 0) {
      console.log('No conversations found.');
      return;
    }
    
    // Get the first conversation ID to test
    const testConversationId = conversations[0].id;
    console.log(`\nTesting conversation fetching with ID: ${testConversationId}`);
    
    // Try to fetch a single conversation
    try {
      const singleConversation = await Conversation.findByPk(testConversationId);
      console.log('Conversation found:');
      console.log(JSON.stringify(singleConversation && singleConversation.toJSON(), null, 2));
    } catch (error) {
      console.error('Error fetching conversation by ID:', error.message);
      console.error('SQL Error:', error.sql || 'No SQL available');
    }
    
    // Fetch all participants for the conversation
    try {
      console.log('\nFetching participants for conversation:');
      const participants = await UserConversation.findAll({
        where: { conversation_id: testConversationId },
        raw: true
      });
      console.log(`Found ${participants.length} participants:`);
      console.log(JSON.stringify(participants, null, 2));
      
      // Get user details for each participant
      if (participants.length > 0) {
        const userIds = participants.map(p => p.user_id);
        const users = await User.findAll({
          where: { id: userIds },
          attributes: ['id', 'username', 'email'],
          raw: true
        });
        console.log('\nUser details:');
        console.log(JSON.stringify(users, null, 2));
      }
    } catch (error) {
      console.error('Error fetching participants:', error.message);
    }
    
    console.log('\nDebug complete');
  } catch (error) {
    console.error('Error in debug script:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the debug function
debugConversationModel().catch(console.error);
