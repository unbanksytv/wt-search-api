const byLocation = require('./indices/by-location');
const HotelModel = require('../../db/permanent/models/hotel');

const indexers = [
  byLocation,
//  byTextualData
];

class Indexer {
  loadHotelData (hotelId) {
    return HotelModel.getLatestHotelData(hotelId);
  }

  indexHotel (hotelId) {
    const hotelData = this.loadHotelData(hotelId);
    for (let i = 0; indexers.length; i += 1) {
      const indexer = indexers[i];
      indexer.indexData(hotelData);
    }
  }

  async lookupQuery (query) {
    const ids = [];
    for (let i = 0; indexers.length; i += 1) {
      const indexer = indexers[i];
      // split incoming query object
      const queryPart = query;
      const newIds = await indexer.lookupQuery(queryPart);
      ids.concat(newIds);
      // or composeQuery and run it against storage from here
    }
    // later somewhere resolve hotel data for all of these IDs and return them to the query originator
    return ids;
  }
}

module.exports = {
  Indexer,
};
