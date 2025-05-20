const { Sequelize } = require('sequelize');
const config = require('../config/config');

async function markMigrationComplete() {
  const env = process.env.NODE_ENV || 'development';
  const dbConfig = config[env];
  
  const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      dialect: dbConfig.dialect,
      logging: false
    }
  );

  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // Insert a record into SequelizeMeta to mark the migration as complete
    await sequelize.query(
      "INSERT IGNORE INTO `SequelizeMeta` (`name`) VALUES ('20250519202930-add-is-ai-conversation-column.js')"
    );
    
    console.log('Migration marked as complete in SequelizeMeta');
    
    // Also mark our finalize migration as complete
    await sequelize.query(
      "INSERT IGNORE INTO `SequelizeMeta` (`name`) VALUES ('20250519210000-finalize-migrations.js')"
    );
    
    console.log('Finalize migration marked as complete in SequelizeMeta');
    
  } catch (error) {
    console.error('Error marking migration as complete:', error);
  } finally {
    await sequelize.close();
  }
}

markMigrationComplete();
