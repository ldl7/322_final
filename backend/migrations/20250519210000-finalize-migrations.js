'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if the column already exists
    const [results] = await queryInterface.sequelize.query(
      "SHOW COLUMNS FROM conversations LIKE 'isAIConversation';"
    );

    if (results.length === 0) {
      // If column doesn't exist, add it
      await queryInterface.addColumn('conversations', 'isAIConversation', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_ai_conversation'
      });
      
      // Add index for better performance
      await queryInterface.addIndex('conversations', ['isAIConversation']);
    } else {
      console.log('isAIConversation column already exists');
    }
  },

  async down(queryInterface, Sequelize) {
    // This is a no-op since we don't want to remove the column
  }
};
