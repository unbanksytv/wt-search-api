const { app } = require('./app');
const config = require('./config');

const crawlerAdapter = require('./services/crawler/queue-adapter');
const indexerAdapter = require('./services/indexer/queue-adapter');

// Set up all message listeners.
crawlerAdapter.registerProcessors();
indexerAdapter.registerProcessors();

const server = app.listen(config.port, () => {
  config.logger.info(`WT Update API at ${config.port}...`);
});

module.exports = server;
