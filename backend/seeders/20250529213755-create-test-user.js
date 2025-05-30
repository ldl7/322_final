'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Enable Sequelize logging
const { sequelize } = require('../models');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    try {
      // Enable query logging
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { raw: true });
      
      // Check if test user already exists
      const existingTestUser = await queryInterface.sequelize.query(
        'SELECT id FROM users WHERE username = :username OR email = :email',
        {
          replacements: { username: 'testuser', email: 'test@example.com' },
          type: queryInterface.sequelize.QueryTypes.SELECT
        }
      );

      if (existingTestUser.length === 0) {
        console.log('Creating test user...');
        
        // Create test user with minimal required fields
        const testUserId = uuidv4();
        const testUserPassword = await bcrypt.hash('Password123!', 10);
        
        const testUser = {
          id: testUserId,
          username: 'testuser',
          email: 'test@example.com',
          password: testUserPassword,
          first_name: 'Test',
          last_name: 'User',
          role: 'user',
          is_email_verified: 1, // Using 1 for true in MySQL
          created_at: new Date(),
          updated_at: new Date(),
          last_login: null,
          refresh_token: null
        };
        
        console.log('Test user data:', JSON.stringify(testUser, null, 2));
        
        // Insert test user
        await queryInterface.bulkInsert('users', [testUser], {
          validate: true,
          individualHooks: true
        });
        
        console.log('Test user created successfully');
      } else {
        console.log('Test user already exists, skipping creation');
      }
      
      // Always create AI Coach user (force creation)
      const aiCoachId = process.env.AI_COACH_USER_ID || 'bffc93b4-f1d1-4395-bd7e-aef35648ed4e';
      const aiCoachEmail = process.env.AI_COACH_EMAIL || 'coach@example.com';
      
      // First, delete any existing AI Coach user with the same ID, username, or email
      await queryInterface.sequelize.query(
        'DELETE FROM users WHERE id = :id OR username = :username OR email = :email',
        {
          replacements: { 
            id: aiCoachId,
            username: 'aicoach', 
            email: aiCoachEmail 
          },
          type: queryInterface.sequelize.QueryTypes.DELETE
        }
      );
      
      console.log('Creating AI Coach user...');
      
      const aiCoachPassword = await bcrypt.hash(process.env.AI_COACH_PASSWORD || 'aSecurePassword123!', 10);
      
      const aiCoachUser = {
        id: aiCoachId,
        username: 'aicoach',
        email: aiCoachEmail,
        password: aiCoachPassword,
        first_name: 'AI',
        last_name: 'Coach',
        role: 'admin', // Using 'admin' role as 'ai_coach' is not in the enum
        is_email_verified: 1, // Using 1 for true in MySQL
        created_at: new Date(),
        updated_at: new Date(),
        last_login: null,
        refresh_token: null
      };
      
      console.log('AI Coach user data:', JSON.stringify(aiCoachUser, null, 2));
      
      // Insert AI Coach user
      await queryInterface.bulkInsert('users', [aiCoachUser], {
        validate: true,
        individualHooks: true
      });
      
      console.log('AI Coach user created successfully');
      console.log('Seeding completed successfully');
      
    } catch (error) {
      console.error('Error in seeder:', error);
      if (error.errors) {
        console.error('Validation errors:');
        error.errors.forEach((err, index) => {
          console.error(`  ${index + 1}. ${err.message} (${err.type}) at ${err.path} = ${JSON.stringify(err.value)}`);
        });
      }
      throw error;
    } finally {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { raw: true });
    }
  },

  async down (queryInterface, Sequelize) {
    try {
      // Remove test users
      await queryInterface.bulkDelete('users', {
        email: {
          [Sequelize.Op.in]: ['test@example.com', 'coach@example.com']
        }
      }, {});
      console.log('Test users removed successfully');
    } catch (error) {
      console.error('Error in seeder down:', error);
      throw error;
    }
  }
};
