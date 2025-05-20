'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('messages', 'parent_message_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'messages', // Self-referencing
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL', // Or 'CASCADE' if you want replies deleted with parent
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('messages', 'parent_message_id');
  }
};
