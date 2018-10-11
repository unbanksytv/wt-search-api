const winston = require('winston');
const knex = require('knex');

module.exports = {
  db: knex({
    // sqlite might not be able to handle the parallel load
    client: 'mysql',
    connection: {
      // filename: './.dev.sqlite',
      host: '127.0.0.1',
      user: 'wt_dev',
      password: 'wt_dev',
      database: 'wt_dev',
    },
    useNullAsDefault: true,
  }),
  logger: winston.createLogger({
    level: 'debug',
    transports: [
      new winston.transports.Console({
        format: winston.format.simple(),
        stderrLevels: ['error'],
      }),
    ],
  }),
};
