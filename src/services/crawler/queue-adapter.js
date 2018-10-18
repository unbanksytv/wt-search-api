const Crawler = require('../crawler');
const { logger, crawlerOpts } = require('../../config');
const worker = require('../queue/worker');

const crawler = new Crawler(Object.assign({}, {
  logger: logger,
  // If set to true, the indexer will be triggered for each
  // saved hotel.
  triggerIndexing: false,
}, crawlerOpts));

const syncHotel = (payload) => {
  return crawler.syncHotel(payload.hotelAddress);
};

const initialSync = () => {
  return crawler.syncAllHotels();
};

const syncHotelPart = (payload) => {
  return crawler.syncHotelPart(payload.hotelAddress, payload.partName);
};

const registerProcessors = () => {
  worker.register('syncHotel', (data) => {
    return syncHotel(data);
  });
  worker.register('syncHotelPart', (data) => {
    return syncHotelPart(data);
  });
  worker.register('initialSync', (data) => {
    return initialSync();
  });
};

module.exports = {
  initialSync,
  syncHotel,
  syncHotelPart,
  registerProcessors,
};
