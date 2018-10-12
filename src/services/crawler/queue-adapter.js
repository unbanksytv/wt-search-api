const { Crawler } = require('../crawler');
const { logger, crawlerOpts } = require('../../config');

const crawler = new Crawler(Object.assign({}, crawlerOpts, {
  logger: logger,
}));

const syncHotel = (payload) => {
  crawler.syncHotel(payload.hotelId);
};

const initialSync = () => {
  crawler.syncAllHotels();
};

const syncHotelPart = (payload) => {
  crawler.syncHotel(payload.hotelId, payload.partName);
};

module.exports = {
  initialSync,
  syncHotel,
  syncHotelPart,
};
