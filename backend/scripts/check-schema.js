const { Sequelize } = require('sequelize');
const config = require('../config/config');

async function checkSchema() {
  // Use the same config as the rest of the app
  const env = process.env.NODE_ENV || 'development';
  const dbConfig = config[env];
  
  // Create a new connection
  const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      dialect: dbConfig.dialect,
      logging: console.log
    }
  );

  try {
    // Test the connection
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // Check if conversations table exists
    const [tables] = await sequelize.query(
      "SHOW TABLES LIKE 'conversations';"
    );
    
    if (tables.length === 0) {
      console.log('conversations table does not exist');
      return;
    }

    // Describe the conversations table
    const [columns] = await sequelize.query('DESCRIBE conversations;');
    console.log('\nColumns in conversations table:');
    console.table(columns);

    // Check for AI-related columns
    const aiColumns = columns.filter(col => 
      col.Field.toLowerCase().includes('ai') || 
      col.Field.toLowerCase().includes('conversation')
    );
    
    console.log('\nAI-related columns:');
    console.table(aiColumns);

  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    await sequelize.close();
  }
}

checkSchema();
