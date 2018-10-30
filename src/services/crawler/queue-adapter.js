const Crawler = require('../crawler');
const { logger, crawlerOpts } = require('../../config');
const worker = require('../queue/worker');

const crawler = new Crawler(Object.assign({}, {
  logger: logger,
  // If set to true, the indexer will be triggered for each
  // saved hotel.
  triggerIndexing: false,
  // If set to true, the crawler will subscribe for
  // hotel notifications when applicable.
  subscribeForNotifications: false,
}, crawlerOpts));

const syncHotel = (payload) => {
  return crawler.syncHotel(payload.hotelAddress);
};

const syncAll = () => {
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
  worker.register('syncAll', (data) => {
    return syncAll();
  });
};

module.exports = {
  syncAll,
  syncHotel,
  syncHotelPart,
  registerProcessors,
};
