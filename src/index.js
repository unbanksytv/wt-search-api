const crawlerAdapter = require('./services/crawler/queue-adapter');
const indexerAdapter = require('./services/indexer/queue-adapter');

// Set up all message listeners.
crawlerAdapter.registerProcessors();
indexerAdapter.registerProcessors();
