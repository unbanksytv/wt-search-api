const Hotel = require('../../db/permanent/models/hotel');
const Indexer = require('./index');
const worker = require('../queue/worker');

const indexer = new Indexer();

async function indexHotel (payload) {
  const hotel = await Hotel.getLatestHotelData(payload.hotelAddress);
  await indexer.indexHotel(hotel);
};

const registerProcessors = () => {
  worker.register('indexHotel', (data) => {
    return indexHotel(data);
  });
};

module.exports = {
  indexHotel,
  registerProcessors,
};
