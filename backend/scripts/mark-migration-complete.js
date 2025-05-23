/**
 * Script to mark specific migrations as complete in the SequelizeMeta table.
 * This is useful when consolidating migrations or manually applying changes.
 */

const { Sequelize } = require('sequelize');
const config = require('../config/config');

// List of migrations to mark as complete
const MIGRATIONS_TO_MARK = [
  '20250519202930-add-is-ai-conversation-column.js'  // Our consolidated migration
];

async function markMigrationsComplete() {
  const env = process.env.NODE_ENV || 'development';
  const dbConfig = config[env];
  
  console.log(`Connecting to database: ${dbConfig.database}@${dbConfig.host}`);
  
  const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect,
      logging: false,
      dialectOptions: {
        // Add any necessary SSL options here if needed
        // ssl: dbConfig.dialectOptions?.ssl
      }
    }
  );

  try {
    // Test the connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Ensure SequelizeMeta table exists
    await sequelize.getQueryInterface().showAllTables();
    
    // Mark each migration as complete
    for (const migrationName of MIGRATIONS_TO_MARK) {
      try {
        const [results] = await sequelize.query(
          'SELECT name FROM SequelizeMeta WHERE name = ?',
          { replacements: [migrationName] }
        );
        
        if (results.length === 0) {
          await sequelize.query(
            'INSERT INTO SequelizeMeta (name) VALUES (?)',
            { replacements: [migrationName] }
          );
          console.log(`✅ Marked migration as complete: ${migrationName}`);
        } else {
          console.log(`ℹ️ Migration already marked as complete: ${migrationName}`);
        }
      } catch (error) {
        console.error(`❌ Error processing migration ${migrationName}:`, error.message);
      }
    }
    
    console.log('✅ All migrations processed successfully');
    
  } catch (error) {
    console.error('❌ Error marking migrations as complete:', error.message);
    process.exit(1);
  } finally {
    // Close the connection
    if (sequelize) {
      await sequelize.close();
      console.log('Database connection closed.');
    }
  }
}

// Run the script
markMigrationsComplete()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
