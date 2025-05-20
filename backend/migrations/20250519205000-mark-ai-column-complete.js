'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // This migration is a no-op since the column already exists
    console.log('The isAIConversation column already exists in the conversations table');
  },

  async down(queryInterface, Sequelize) {
    // This is a no-op since we don't want to remove the column
  }
};
