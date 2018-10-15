const winston = require('winston');
const knex = require('knex');

module.exports = {
  db: knex({
    client: 'sqlite3',
    connection: {
      filename: './.test.sqlite',
    },
    useNullAsDefault: true,
  }),
  logger: winston.createLogger({
    level: 'error',
    transports: [
      new winston.transports.Console({
        format: winston.format.simple(),
        stderrLevels: ['error'],
      }),
    ],
  }),
};
