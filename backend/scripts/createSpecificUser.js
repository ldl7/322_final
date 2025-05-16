'use strict';

const { User } = require('../models');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');

/**
 * Creates a user with a specific ID that the mobile app is trying to use
 */
const createSpecificUser = async () => {
  // The specific ID that the mobile app is trying to use
  const specificUserId = 'bffc93b4-f1d1-4395-bd7e-aef35648ed4e';
  
  try {
    // Check if the user with this specific ID already exists
    const existingUser = await User.findByPk(specificUserId);
    
    if (existingUser) {
      logger.info(`User with ID ${specificUserId} already exists.`);
      return { 
        success: true, 
        message: 'User already exists', 
        user: existingUser.get({ plain: true }) 
      };
    }
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    // Create the user with the specific ID
    const newUser = await User.create({
      id: specificUserId,
      username: 'mobileuser',
      email: 'mobile@example.com',
      password: hashedPassword,
      first_name: 'Mobile',
      last_name: 'User',
      role: 'user',
      is_email_verified: true
    });
    
    logger.info(`Created user with specific ID: ${specificUserId}`);
    
    return { 
      success: true, 
      message: 'User created successfully', 
      user: newUser.get({ plain: true }) 
    };
  } catch (error) {
    logger.error('Error creating specific user:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return { 
      success: false, 
      message: 'Failed to create user',
      error: error.message
    };
  }
};

// Run the function if this script is executed directly
if (require.main === module) {
  createSpecificUser()
    .then(result => {
      console.log('Result:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = createSpecificUser;
