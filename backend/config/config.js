/**
 * Database configuration for different environments.
 * Loads environment variables from the project root .env file.
 * 
 * @module config/database
 * @requires dotenv
 * @requires path
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

module.exports = {
  jwt: {
    secret: process.env.JWT_SECRET || 'your_default_jwt_secret_key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_default_jwt_refresh_secret_key',
    accessExpirationMinutes: process.env.JWT_ACCESS_EXPIRATION_MINUTES || 60, // 1 hour
    refreshExpirationDays: process.env.JWT_REFRESH_EXPIRATION_DAYS || 7, // 7 days
    passwordResetExpirationMinutes: parseInt(process.env.JWT_PASSWORD_RESET_EXPIRATION_MINUTES || '60', 10), // 1 hour
    emailVerificationExpirationMinutes: parseInt(process.env.JWT_EMAIL_VERIFICATION_EXPIRATION_MINUTES || '1440', 10), // 24 hours (1 day)
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    },
  },
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Loloreno1',
    database: process.env.DB_NAME || 'coach_ally',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    dialect: 'mysql',
    logging: (msg) => {
      console.log(msg); // Log to console
      const fs = require('fs');
      const path = require('path');
      const logDir = path.join(__dirname, '../logs');
      const logFile = path.join(logDir, 'sql.log');
      
      // Ensure logs directory exists
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      // Write to log file
      fs.appendFileSync(logFile, `${new Date().toISOString()} - ${msg}\n`);
    }, // Log SQL queries for debugging
    dialectOptions: {
      //charset: 'utf8mb4_general_ci', // Example: if you need specific charset
      // ssl: process.env.DB_SSL === 'true' ? { require: true, rejectUnauthorized: false } : false,
    }
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: `${process.env.DB_NAME}_test`,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,  // Disable logging during tests
    ssl: false
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,  // Disable logging in production
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false  // For self-signed certificates
      }
    }
  }
};