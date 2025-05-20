'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('conversations', 'isAIConversation', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_ai_conversation'
    });

    // Add an index for better query performance
    await queryInterface.addIndex('conversations', ['isAIConversation']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('conversations', ['isAIConversation']);
    await queryInterface.removeColumn('conversations', 'isAIConversation');
  }
};
