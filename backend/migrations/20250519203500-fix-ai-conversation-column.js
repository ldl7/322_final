'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First check if the column already exists
    const [results] = await queryInterface.sequelize.query(
      "SHOW COLUMNS FROM conversations LIKE 'is_ai_conversation';"
    );

    // If the column doesn't exist, add it
    if (results.length === 0) {
      await queryInterface.addColumn('conversations', 'isAIConversation', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_ai_conversation'
      });
    }

    // Check if the index exists before trying to add it
    const [[indexResults]] = await queryInterface.sequelize.query(
      "SHOW INDEX FROM conversations WHERE Key_name = 'conversations_is_ai_conversation';"
    );

    if (!indexResults) {
      await queryInterface.addIndex('conversations', ['isAIConversation'], {
        name: 'conversations_is_ai_conversation'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove the index if it exists
    const [[indexResults]] = await queryInterface.sequelize.query(
      "SHOW INDEX FROM conversations WHERE Key_name = 'conversations_is_ai_conversation';"
    );
    
    if (indexResults) {
      await queryInterface.removeIndex('conversations', 'conversations_is_ai_conversation');
    }

    // Remove the column if it exists
    const [results] = await queryInterface.sequelize.query(
      "SHOW COLUMNS FROM conversations LIKE 'is_ai_conversation';"
    );
    
    if (results.length > 0) {
      await queryInterface.removeColumn('conversations', 'isAIConversation');
    }
  }
};
