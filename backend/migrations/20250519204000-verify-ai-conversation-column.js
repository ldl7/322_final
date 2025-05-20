'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, let's check if the column exists with a different name
    const [columns] = await queryInterface.sequelize.query(
      `SHOW COLUMNS FROM conversations LIKE '%ai%';`
    );
    
    console.log('Found columns:', columns);
    
    // If no AI-related columns found, add the column
    if (columns.length === 0) {
      console.log('Adding isAIConversation column...');
      await queryInterface.addColumn('conversations', 'isAIConversation', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_ai_conversation'
      });
    } else {
      console.log('AI conversation column already exists:', columns);
    }
  },

  async down(queryInterface, Sequelize) {
    // No need to remove the column in the down migration
    // as we're just verifying its existence
  }
};
