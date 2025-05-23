'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = 'conversations';
    const columnName = 'is_ai_conversation';
    const indexName = `idx_${tableName}_${columnName}`;

    // Check if column already exists
    const [columns] = await queryInterface.sequelize.query(
      `SHOW COLUMNS FROM ${tableName} LIKE '${columnName}';`
    );

    if (columns.length === 0) {
      // Add the column if it doesn't exist
      await queryInterface.addColumn(tableName, 'isAIConversation', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: columnName
      });
      console.log(`Added column ${columnName} to ${tableName}`);
    } else {
      console.log(`Column ${columnName} already exists in ${tableName}`);
    }

    // Check if index exists
    const [[indexResults]] = await queryInterface.sequelize.query(
      `SHOW INDEX FROM ${tableName} WHERE Key_name = '${indexName}';`
    );

    if (!indexResults) {
      // Add index if it doesn't exist
      await queryInterface.addIndex(tableName, ['isAIConversation'], {
        name: indexName,
        fields: ['isAIConversation']
      });
      console.log(`Added index ${indexName} on ${tableName}(${columnName})`);
    } else {
      console.log(`Index ${indexName} already exists on ${tableName}`);
    }
  },

  async down(queryInterface, Sequelize) {
    const tableName = 'conversations';
    const columnName = 'is_ai_conversation';
    const indexName = `idx_${tableName}_${columnName}`;

    // Remove index if it exists
    try {
      await queryInterface.removeIndex(tableName, indexName);
      console.log(`Removed index ${indexName} from ${tableName}`);
    } catch (error) {
      console.log(`Index ${indexName} does not exist on ${tableName}`);
    }

    // Remove column if it exists
    const [columns] = await queryInterface.sequelize.query(
      `SHOW COLUMNS FROM ${tableName} LIKE '${columnName}';`
    );

    if (columns.length > 0) {
      await queryInterface.removeColumn(tableName, 'isAIConversation');
      console.log(`Removed column ${columnName} from ${tableName}`);
    } else {
      console.log(`Column ${columnName} does not exist in ${tableName}`);
    }
  }
};
