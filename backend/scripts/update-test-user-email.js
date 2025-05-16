'use strict';

const { sequelize } = require('../models');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');

async function ensureTestUser() {
  const transaction = await sequelize.transaction();
  
  try {
    // Check if test user exists
    const [users] = await sequelize.query(
      `SELECT id, username, email FROM users WHERE username = 'testuser' OR email = 'test@example.com'`,
      { transaction }
    );

    if (users.length > 0) {
      // Update existing user
      const [updated] = await sequelize.query(
        `UPDATE users SET 
          email = 'test@example.com', 
          username = 'testuser',
          password = ?,
          updated_at = NOW()
        WHERE id = ?`,
        {
          replacements: [await bcrypt.hash('testpassword123', 10), users[0].id],
          transaction
        }
      );
      logger.info('Updated existing test user');
    } else {
      // Create new test user
      await sequelize.query(
        `INSERT INTO users 
        (id, username, email, password, created_at, updated_at)
        VALUES (?, ?, ?, ?, NOW(), NOW())`,
        {
          replacements: [
            '11111111-1111-1111-1111-111111111111',
            'testuser',
            'test@example.com',
            await bcrypt.hash('testpassword123', 10)
          ],
          transaction
        }
      );
      logger.info('Created new test user');
    }

    // Verify the user exists
    const [updatedUsers] = await sequelize.query(
      `SELECT id, username, email FROM users WHERE username = 'testuser'`,
      { transaction }
    );
    
    logger.info('Current test user data:', updatedUsers[0]);
    
    await transaction.commit();
    return updatedUsers[0];
    
  } catch (error) {
    await transaction.rollback();
    logger.error('Error ensuring test user:', error);
    throw error;
  }
}

async function run() {
  try {
    await ensureTestUser();
    logger.info('Test user setup completed successfully');
  } catch (error) {
    logger.error('Failed to setup test user:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

run();
