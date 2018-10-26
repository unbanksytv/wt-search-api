const { app } = require('./app');
const config = require('./config');

const crawlerAdapter = require('./services/crawler/queue-adapter');
const indexerAdapter = require('./services/indexer/queue-adapter');
const queue = require('./services/queue').get();

// Set up all message listeners.
crawlerAdapter.registerProcessors();
indexerAdapter.registerProcessors();

const server = app.listen(config.port, () => {
  config.logger.info(`WT Update API at ${config.port}...`);
});

// Set up automatic resyncing.
if (config.sync.initial) {
  queue.enqueue({ type: 'syncAll' });
}
if (config.sync.interval) {
  setInterval(() => {
    queue.enqueue({ type: 'syncAll' });
  }, config.sync.interval);
}

module.exports = server;
