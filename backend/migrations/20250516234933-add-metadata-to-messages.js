'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('messages', 'metadata', { // Ensure table name 'messages' is correct
      type: Sequelize.JSON, // Use Sequelize.JSON for MySQL compatibility
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('messages', 'metadata');
  }
};
