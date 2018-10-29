const { db } = require('../src/config');
const { syncAll } = require('../src/services/crawler/queue-adapter');
const server = require('../src/index'); // As a side effect, this will set up all the message listeners.

syncAll().finally(() => {
  server.close();
  setTimeout(() => { // Leave some time to finish indexing before closing the database connection.
    db.destroy();
  }, 500);
});
