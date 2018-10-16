const { Crawler } = require('../crawler');
const { logger, crawlerOpts } = require('../../config');

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

module.exports = {
  initialSync,
  syncHotel,
  syncHotelPart,
};
