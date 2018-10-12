const { Crawler } = require('../crawler');
const { logger, crawlerOpts } = require('../../config');

const crawler = new Crawler(Object.assign({}, crawlerOpts, {
  logger: logger,
}));

module.exports.process = async function (message) {
  switch (message.type) {
  case 'syncHotel':
    // TODO change this into a crawlerQueue adapter
    crawler.syncHotel(message.payload.hotelId);
    break;
  default:
        // do nothing
  }
};
