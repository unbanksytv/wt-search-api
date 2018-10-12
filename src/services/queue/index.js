const worker = require('./worker');

/*
 * A queue to decouple API server from the outgoing requests
 * done by `workers`.
 *
 * Currently, we utilize the internal queue of node.js. It is
 * possible that this will be replaced by a proper standalone
 * message queue in the future.
 *
 * Kudos to Hynek's work in wt-update-api
 */
class Queue {
  enqueue (message) {
    // The processing is not awaited to simulate the behavior of
    // a "proper" queue and not delay the caller.
    worker.process(message);
  }
}

let _Q;

function get () {
  if (!_Q) {
    _Q = new Queue();
  }
  return _Q;
}

module.exports = {
  get: get,
};
