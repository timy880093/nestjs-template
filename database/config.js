require('dotenv').config({ path: '.env.local' });
// require('dotenv').config({ path: '.env.production-local' });

module.exports = {
  development: {
    dialect: process.env.DATABASE_DIALECT,
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  },
  // test: {
  //   dialect: "postgres
  //   host: "localhost",
  //   port: 5432,
  //   username: "roku",
  //   password: "roku",
  //   database: "test"
  // },
  // production: {
  //   dialect: "postgres",
  //   host: "localhost",
  //   port: 5432,
  //   username: "roku",
  //   password: "roku",
  //   database: "prod"
  // }
};
