// This is only a sample script to try out crawler against an actual API
const { db, logger, crawlerOpts } = require('../src/config');
const Queue = require('../src/services/queue');

const doStuff = async () => {
  Queue.get().enqueue({
    type: 'initialSync',
  });
  // Can't call destroy, because queue does not wait
  //await db.destroy();
}

doStuff();
