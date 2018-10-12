const winston = require('winston');
const knex = require('knex');

module.exports = {
  db: knex({
    client: 'sqlite',
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
  crawlerOpts: {
    readApiUrl: 'https://playground-api.windingtree.com',
    timeout: 30000,
    limit: 10,
  },
};
