'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add the 'type' column
    await queryInterface.addColumn('conversations', 'type', {
      type: Sequelize.ENUM('direct', 'group'),
      defaultValue: 'direct',
      allowNull: false
    });

    // Add the 'name' column
    await queryInterface.addColumn('conversations', 'name', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Add the 'createdBy' column
    await queryInterface.addColumn('conversations', 'createdBy', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Add index for better performance
    await queryInterface.addIndex('conversations', ['createdBy']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('conversations', 'type');
    await queryInterface.removeColumn('conversations', 'name');
    await queryInterface.removeIndex('conversations', ['createdBy']);
    await queryInterface.removeColumn('conversations', 'createdBy');
  }
};
