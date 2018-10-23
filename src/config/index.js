const winston = require('winston');

const env = process.env.WT_CONFIG || 'dev';

module.exports = Object.assign({
  port: 1918,
  baseUrl: process.env.WT_API_BASE_URL || 'http://localhost:1918',
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
}, require(`./${env}`));
