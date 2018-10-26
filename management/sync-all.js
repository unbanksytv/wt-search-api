// Sync all hotels (store them to the DB and index them).
// The script will probably hang due to an open DB connection.
// You can end it with ctrl+C

const server = require('../src/index'); // As a side effect, this will set up all the message listeners.

const queue = require('../src/services/queue').get();
queue.enqueue({ type: 'syncAll' });
