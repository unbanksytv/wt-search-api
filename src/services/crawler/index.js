const { Fetcher } = require('./fetcher');
const HotelModel = require('../../models/hotel');

class Crawler {
  constructor (options) {
    this.config = options;
  }

  getFetcher () {
    if (!this._fetcher) {
      this._fetcher = new Fetcher(this.config);
    }
    return this._fetcher;
  }

  async syncAllHotels () {
    // TODO Experiment with parallelization level (i. e. large limit over number of parallel downloads)
    // TODO deal with errored ids
    const syncPromises = [];
    const hotels = await this.getFetcher().fetchHotelList(1);
    for (let hotelId of hotels.ids) {
      syncPromises.push(
        this.syncHotel(hotelId)
      );
    }
    return Promise.all(syncPromises);
  }

  syncHotel (hotelId) {
    const hotelPartPromises = [];
    for (let hotelPartName of HotelModel.HOTEL_PART_NAMES) {
      hotelPartPromises.push(
        this.syncHotelPart(hotelId, hotelPartName)
      );
    }
    // TODO use batch create
    return Promise.all(hotelPartPromises);
  }

  _fetchHotelPart (hotelId, partName) {
    // TODO handle errors
    const fetcher = this.getFetcher(),
      methodName = `fetch${partName.charAt(0).toUpperCase() + partName.slice(1)}`;
    return fetcher[methodName](hotelId).catch((e) => {
      // TODO introduce injected logger
      console.log(e);
    });
  }

  async syncHotelPart (hotelId, partName) {
    return HotelModel.create({
      address: hotelId,
      partName: partName,
      rawData: await this._fetchHotelPart(hotelId, partName),
    });
  }
}

module.exports = {
  Crawler,
};
