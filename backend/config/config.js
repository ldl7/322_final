/**
 * Database configuration for different environments.
 * Loads environment variables from the project root .env file.
 * 
 * @module config/database
 * @requires dotenv
 * @requires path
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logDir = path.join(__dirname, '../logs');
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
  jwt: {
    secret: process.env.JWT_SECRET || 'your_default_jwt_secret_key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_default_jwt_refresh_secret_key',
    accessExpirationMinutes: parseInt(process.env.JWT_ACCESS_EXPIRATION_MINUTES || '60', 10),
    refreshExpirationDays: parseInt(process.env.JWT_REFRESH_EXPIRATION_DAYS || '7', 10),
    passwordResetExpirationMinutes: parseInt(process.env.JWT_PASSWORD_RESET_EXPIRATION_MINUTES || '60', 10),
    emailVerificationExpirationMinutes: parseInt(process.env.JWT_EMAIL_VERIFICATION_EXPIRATION_MINUTES || '1440', 10),
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    },
  },
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
    username: process.env.TEST_DB_USERNAME || process.env.DB_USERNAME,
    password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.TEST_DB_DATABASE || `${process.env.DB_DATABASE}_test`,
    host: process.env.TEST_DB_HOST || process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.TEST_DB_PORT || process.env.DB_PORT || '3306', 10),
    dialect: process.env.TEST_DB_DIALECT || process.env.DB_DIALECT || 'mysql',
    logging: false,  // Disable logging during tests
    dialectOptions: {
      ssl: process.env.TEST_DB_SSL === 'true' 
        ? { require: true, rejectUnauthorized: false } 
        : false
    }
  },
  production: {
    username: process.env.PROD_DB_USERNAME || process.env.DB_USERNAME,
    password: process.env.PROD_DB_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.PROD_DB_DATABASE || process.env.DB_DATABASE,
    host: process.env.PROD_DB_HOST || process.env.DB_HOST,
    port: parseInt(process.env.PROD_DB_PORT || process.env.DB_PORT || '3306', 10),
    dialect: process.env.PROD_DB_DIALECT || process.env.DB_DIALECT || 'mysql',
    logging: false,  // Disable logging in production
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