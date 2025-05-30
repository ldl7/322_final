const { Sequelize } = require('sequelize');
const config = require('./config/config.json');

const { database, username, password, host, port } = config.development;

// Create a connection to MySQL without specifying a database
const sequelize = new Sequelize('', username, password, {
  host,
  port,
  dialect: 'mysql',
  logging: console.log
});

async function checkAndCreateDatabase() {
  try {
    // Connect to MySQL
    await sequelize.authenticate();
    console.log('Connected to MySQL server successfully.');

    // Check if database exists
    const [results] = await sequelize.query(`SHOW DATABASES LIKE '${database}';`);
    
    if (results.length === 0) {
      // Database doesn't exist, create it
      console.log(`Database '${database}' does not exist. Creating...`);
      await sequelize.query(`CREATE DATABASE ${database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      console.log(`Database '${database}' created successfully.`);
    } else {
      console.log(`Database '${database}' already exists.`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    // Close the connection
    await sequelize.close();
    process.exit(0);
  }
}

checkAndCreateDatabase();
