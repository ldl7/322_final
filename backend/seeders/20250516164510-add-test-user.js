'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    
    // Check if test user already exists
    const [existingUser] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'test@example.com' OR username = 'testuser'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!existingUser) {
      await queryInterface.bulkInsert('users', [{
        id: '11111111-1111-1111-1111-111111111111',
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        first_name: 'Test',
        last_name: 'User',
        created_at: new Date(),
        updated_at: new Date()
      }]);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {
      email: 'test@example.com'
    });
  }
};
