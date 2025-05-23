'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if the column exists before trying to remove it
    const tableDescription = await queryInterface.describeTable('conversations');
    if (tableDescription.is_ai_conversation) {
      await queryInterface.removeColumn('conversations', 'is_ai_conversation');
      console.log("Removed column 'is_ai_conversation' from 'conversations' table.");
    } else {
      console.log("Column 'is_ai_conversation' does not exist in 'conversations' table. No action taken.");
    }
  },

  async down(queryInterface, Sequelize) {
    // Re-add the column if rolling back
    await queryInterface.addColumn('conversations', 'is_ai_conversation', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true, // If re-adding, assume existing convos were AI
      comment: 'Indicates if this is a conversation with an AI coach (re-added)'
    });
    console.log("Re-added column 'is_ai_conversation' to 'conversations' table.");
  }
};
