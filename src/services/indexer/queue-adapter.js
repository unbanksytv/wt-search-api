const Hotel = require('../../db/permanent/models/hotel');
const Indexer = require('./index');
const { logger } = require('../../config');
const worker = require('../queue/worker');

const indexer = new Indexer();

async function indexHotel (payload) {
  try {
    const hotel = await Hotel.getLatestHotelData(payload.hotelAddress);
    await indexer.indexHotel(hotel);
  } catch (err) {
    logger.error(`Error indexing hotel: ${err.message}`);
  }
};

const registerProcessors = () => {
  worker.register('indexHotel', (data) => {
    indexHotel(data);
  });
};

module.exports = {
  indexHotel,
  registerProcessors,
};
