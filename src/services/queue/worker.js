const { logger } = require('../../config');

const _processors = {
  // <message_type>: [<processor_fn1>, <processor_fn2>, ...]
};

/*
 * Register a worker processor for a given message type.
 **/
module.exports.register = (messageType, processor) => {
  if (!_processors[messageType]) {
    _processors[messageType] = [];
  }
  _processors[messageType].push(processor);
};

/*
 * Process a given message by the matching registered
 * processors.
 **/
module.exports.process = (message) => {
  const processors = _processors[message.type];
  if (processors) {
    for (let processor of processors) {
      (async () => {
        try {
          await processor(message.payload);
        } catch (err) {
          // Catch errors even without awaiting to avoid
          // unhandled promise rejections.
          logger.error(`Unexpected error when processing message ${message.type}: ${err.message}`);
        }
      })();
    }
  } else {
    logger.warn(`Unknown message type: ${message.type}`);
  }
};
