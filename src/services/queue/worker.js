const crawlerAdapter = require('../crawler/queue-adapter');
const indexerAdapter = require('../indexer/queue-adapter');

module.exports.process = async (message) => {
  switch (message.type) {
  case 'syncHotel':
    crawlerAdapter.syncHotel(message.payload);
    break;
  case 'syncHotelPart':
    crawlerAdapter.syncHotelPart(message.payload);
    break;
  case 'initialSync':
    crawlerAdapter.initialSync();
    break;
  case 'indexHotel':
    indexerAdapter.indexHotel(message.payload);
    break;
  default:
        // do nothing
  }
};
