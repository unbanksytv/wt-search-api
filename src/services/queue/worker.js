const crawlerAdapter = require('../crawler/queue-adapter');

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
  default:
        // do nothing
  }
};
