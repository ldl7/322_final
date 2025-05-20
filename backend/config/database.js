require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const path = require('path');

module.exports = {
  development: {
    mysql: {
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'coach_ally',
      host: process.env.DB_HOST || '127.0.0.1',
      dialect: 'mysql',
      logging: console.log,
    },
    sqlite: {
      dialect: 'sqlite',
      storage: process.env.SQLITE_DB_PATH || path.join(__dirname, '../coach_ally.sqlite'),
      logging: false,
    }
  },
  test: {
    mysql: {
      username: process.env.TEST_DB_USERNAME || 'root',
      password: process.env.TEST_DB_PASSWORD || '',
      database: process.env.TEST_DB_NAME || 'coach_ally_test',
      host: process.env.TEST_DB_HOST || '127.0.0.1',
      dialect: 'mysql',
      logging: false,
    },
    sqlite: {
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false,
    }
  },
  production: {
    mysql: {
      username: process.env.PROD_DB_USERNAME,
      password: process.env.PROD_DB_PASSWORD,
      database: process.env.PROD_DB_NAME,
      host: process.env.PROD_DB_HOST,
      dialect: 'mysql',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    },
    sqlite: {
      dialect: 'sqlite',
      storage: process.env.SQLITE_DB_PATH || '/var/lib/sqlite/coach_ally_prod.sqlite',
      logging: false,
    }
  }
};
