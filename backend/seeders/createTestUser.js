'use strict';

const { User, sequelize } = require('../models');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

/**
 * Creates a test user if it doesn't exist
 * @returns {Promise<{success: boolean, message: string, user?: object}>}
 */
const createTestUser = async () => {
  const testUserData = {
    id: uuidv4(),
    username: 'testuser',
    email: 'test@example.com',
    password: 'testpassword123',
    first_name: 'Test',
    last_name: 'User',
    role: 'user',
    is_email_verified: true
  };

  const transaction = await sequelize.transaction();
  
  try {
    logger.info('Starting test user creation...', { email: testUserData.email });
    
    // Log database connection status
    try {
      await sequelize.authenticate();
      logger.info('Database connection established successfully');
    } catch (dbError) {
      logger.error('Database connection error:', dbError);
      throw new Error(`Database connection failed: ${dbError.message}`);
    }
    
    // Check if users table exists
    const [tables] = await sequelize.query("SHOW TABLES LIKE 'users'");
    if (tables.length === 0) {
      throw new Error('Users table does not exist');
    }
    
    // Check if test user already exists
    logger.info('Checking for existing test user...');
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email: testUserData.email },
          { username: testUserData.username }
        ]
      },
      transaction,
      raw: true
    });

    if (existingUser) {
      logger.info('Test user already exists', { 
        userId: existingUser.id,
        email: existingUser.email 
      });
      await transaction.commit();
      return { 
        success: true, 
        message: 'Test user already exists',
        user: existingUser
      };
    }

    logger.info('Creating test user...', { 
      userId: testUserData.id,
      email: testUserData.email 
    });
    
    try {
      // Create user using the model to ensure all hooks and validations run
      const user = await User.create(testUserData, { transaction });
      await transaction.commit();
      
      logger.info('Test user created successfully', { 
        userId: user.id,
        email: user.email 
      });
      
      return { 
        success: true, 
        message: 'Test user created successfully',
        user: user.get({ plain: true })
      };
    } catch (createError) {
      await transaction.rollback();
      throw createError; // Re-throw to be caught by the outer catch
    }
    
  } catch (error) {
    await transaction.rollback();
    
    // Log detailed error information
    logger.error('Error in createTestUser:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      ...(error.errors && { 
        validationErrors: error.errors.map(e => ({
          path: e.path,
          message: e.message,
          type: e.type,
          value: e.value
        }))
      })
    });
    
    // For unique constraint errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      return { 
        success: false, 
        message: 'A user with this email or username already exists',
        error: 'DUPLICATE_ENTRY'
      };
    }
    
    // For validation errors
    if (error.name === 'SequelizeValidationError') {
      return { 
        success: false, 
        message: 'Validation error creating test user',
        error: 'VALIDATION_ERROR',
        details: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      };
    }
    
    // For all other errors
    return { 
      success: false, 
      message: 'Failed to create test user',
      error: error.message,
      errorType: error.name
    };
  }
};

// If this file is run directly, execute the function
if (require.main === module) {
  createTestUser()
    .then(result => {
      console.log(result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = createTestUser;
