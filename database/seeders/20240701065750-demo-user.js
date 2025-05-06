'use strict';

const table = 'user';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      table,
      [
        {
          username: 'test',
          password: '1qaz2wsx',
          email: 'test@gmail.com',
          role: 'user',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          username: 'admin',
          password: '1qaz2wsx',
          email: 'test@gmail.com',
          role: 'admin',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(table, null, {});
  },
};
