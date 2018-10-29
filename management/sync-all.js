const { db } = require('../src/config');
const { syncAll } = require('../src/services/crawler/queue-adapter');

const crawlerAdapter = require('../src/services/crawler/queue-adapter');
const indexerAdapter = require('../src/services/indexer/queue-adapter');

// Set up all message listeners.
crawlerAdapter.registerProcessors();
indexerAdapter.registerProcessors();

syncAll().finally(() => {
  setTimeout(() => { // Leave some time to finish indexing before closing the database connection.
    db.destroy();
  }, 500);
});
