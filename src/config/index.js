const winston = require('winston');

const env = process.env.WT_CONFIG || 'dev';

module.exports = Object.assign({
  port: 1918,
  baseUrl: process.env.WT_API_BASE_URL || 'http://localhost:1918',
  wtIndexAddress: '0xdummy',
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
