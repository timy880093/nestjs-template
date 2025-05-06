'use strict';

const table = 'user';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable(table, {
      id: {
        description: '使用者 ID',
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      username: {
        type: Sequelize.TEXT,
        unique: true,
      },
      password: {
        type: Sequelize.TEXT,
      },
      email: {
        type: Sequelize.TEXT,
      },
      phone: {
        type: Sequelize.TEXT,
      },
      role: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        onUpdate: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        onDelete: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      is_email_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      is_phone_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      line_uid: {
        type: Sequelize.TEXT,
      },
    });
  },

  async down(queryInterface) {
    return queryInterface.dropTable(table);
  },
};
