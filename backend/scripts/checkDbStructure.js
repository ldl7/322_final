'use strict';

const { sequelize } = require('../models');
const logger = require('../utils/logger');

/**
 * Checks database structure and logs table names and columns
 */
async function checkDbStructure() {
  try {
    // Check database connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Get all table names
    const [tables] = await sequelize.query("SHOW TABLES");
    console.log('\nTables in database:');
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log(tableNames);
    
    // For each table, get column information
    for (const tableName of tableNames) {
      console.log(`\nColumns for table '${tableName}':`);
      const [columns] = await sequelize.query(`DESCRIBE \`${tableName}\``);
      columns.forEach(column => {
        console.log(`- ${column.Field} (${column.Type}, ${column.Null === 'YES' ? 'nullable' : 'NOT NULL'}, ${column.Key ? `key: ${column.Key}` : 'no key'})`);
      });
    }
    
    console.log('\nDatabase inspection complete');
  } catch (error) {
    console.error('Error inspecting database:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the function
checkDbStructure().catch(console.error);
