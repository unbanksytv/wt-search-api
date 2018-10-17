const { logger } = require('../../config');

const _processors = {
  // <message_type>: [<processor_fn1>, <processor_fn2>, ...]
};

/*
 * Register a worker processor for a given message type.
 **/
module.exports.register = (messageType, processor) => {
  if (!_processors.messageType) {
    _processors.messageType = [];
  }
  _processors.messageType.push(processor);
};

/*
 * Process a given message by the matching registered
 * processors.
 **/
module.exports.process = (message) => {
  const processors = _processors[message.type];
  if (processors) {
    for (let processor of processors) {
      processor(message.payload);
    }
  } else {
    logger.warn(`Unknown message type: ${message.type}`);
  }
};
