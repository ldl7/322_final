require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Configure logging function
const logging = process.env.NODE_ENV === 'development' 
  ? (msg) => {
      const logFile = path.join(logDir, 'sql.log');
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ${msg}`);
      fs.appendFileSync(logFile, `[${timestamp}] ${msg}\n`);
    }
  : false; // Disable SQL logging in production

module.exports = {
  development: {
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'Loloreno1',
    database: process.env.DB_DATABASE || 'coach_ally',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: logging,
    dialectOptions: {
      // charset: 'utf8mb4_general_ci',
      // ssl: process.env.DB_SSL === 'true' ? { require: true, rejectUnauthorized: false } : false,
    }
  },
  test: {
    username: process.env.TEST_DB_USERNAME || process.env.DB_USERNAME || 'root',
    password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD || 'Loloreno1',
    database: process.env.TEST_DB_DATABASE || `${process.env.DB_DATABASE || 'coach_ally'}_test`,
    host: process.env.TEST_DB_HOST || process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.TEST_DB_PORT || process.env.DB_PORT || '3306', 10),
    dialect: process.env.TEST_DB_DIALECT || process.env.DB_DIALECT || 'mysql',
    logging: false,
    dialectOptions: {
      // ssl: process.env.TEST_DB_SSL === 'true' ? { require: true, rejectUnauthorized: false } : false
    }
  },
  production: {
    username: process.env.PROD_DB_USERNAME || process.env.DB_USERNAME,
    password: process.env.PROD_DB_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.PROD_DB_DATABASE || process.env.DB_DATABASE,
    host: process.env.PROD_DB_HOST || process.env.DB_HOST,
    port: parseInt(process.env.PROD_DB_PORT || process.env.DB_PORT || '3306', 10),
    dialect: process.env.PROD_DB_DIALECT || process.env.DB_DIALECT || 'mysql',
    logging: false,
    dialectOptions: {
      ssl: process.env.PROD_DB_SSL === 'true'
        ? { 
            require: true,
            rejectUnauthorized: process.env.PROD_DB_SSL_REJECT_UNAUTHORIZED === 'false' ? false : true
          }
        : false
    }
  }
};
