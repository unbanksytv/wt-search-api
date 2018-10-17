const Crawler = require('../crawler');
const { logger, crawlerOpts } = require('../../config');
const worker = require('../queue/worker');

const crawler = new Crawler(Object.assign({}, crawlerOpts, {
  logger: logger,
}));

const syncHotel = (payload) => {
  crawler.syncHotel(payload.hotelAddress);
};

const initialSync = () => {
  crawler.syncAllHotels();
};

const syncHotelPart = (payload) => {
  crawler.syncHotelPart(payload.hotelAddress, payload.partName);
};

const registerProcessors = () => {
  worker.register('syncHotel', (data) => {
    syncHotel(data);
  });
  worker.register('syncHotelPart', (data) => {
    syncHotelPart(data);
  });
  worker.register('initialSync', (data) => {
    initialSync();
  });
};

module.exports = {
  initialSync,
  syncHotel,
  syncHotelPart,
  registerProcessors,
};
