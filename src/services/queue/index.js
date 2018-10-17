const worker = require('./worker');

/*
 * A messaging queue to decouple individual components (crawler, indexer, ...).
 *
 * Currently, we utilize the internal queue of node.js. It is
 * possible that this will be replaced by a proper standalone
 * message queue in the future.
 *
 */
class Queue {
  enqueue (message) {
    // The processing is not awaited to simulate the behavior of
    // a "proper" queue and not delay the caller.
    worker.process(message);
  }
}

let _Q;

const get = () => {
  if (!_Q) {
    _Q = new Queue();
  }
  return _Q;
};

module.exports = {
  get: get,
};
