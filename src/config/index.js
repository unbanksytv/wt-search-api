const winston = require('winston');

const env = process.env.WT_CONFIG || 'dev';

module.exports = Object.assign({
  port: 1918,
  baseUrl: process.env.BASE_URL || 'http://localhost:1918',
  readApiUrl: process.env.READ_API_URL || 'http://localhost:3000',
  logger: winston.createLogger({
    level: 'info',
    transports: [
      new winston.transports.Console({
        format: winston.format.simple(),
        stderrLevels: ['error'],
      }),
    ],
  }),
  // API response pagination:
  defaultPageSize: 30,
  maxPageSize: 300,
  sync: {
    // Perform complete resync once per hour. Set to `null` if no periodic syncing is desired.
    interval: 1000 * 60 * 60,
    initial: true, // Perform the initial sync immediately after server start?
  },
}, require(`./${env}`));
