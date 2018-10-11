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

  // TODO change maxPages
  async syncAllHotels (maxPages) {
    // TODO Experiment with parallelization level (i. e. large limit over number of parallel downloads)
    // TODO deal with errored ids
    const syncPromises = [];
    const hotels = await this.getFetcher().fetchHotelList(maxPages);
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
        this._fetchHotelPart(hotelId, hotelPartName).then((rawData) => {
          return {
            rawData: rawData,
            partName: hotelPartName,
          };
        }).catch((e) => {
          // Silently pass
          // TODO at least log the error, introduce injected logger
        })
      );
    }
    return Promise.all(hotelPartPromises).then((data) => {
      const hotelData = [];
      for (let i = 0; i < data.length; i++) {
        if (data[i]) {
          hotelData.push({
            address: hotelId,
            partName: data[i].partName,
            rawData: data[i].rawData,
          });
        }
      }
      return HotelModel.create(hotelData);
    });
  }

  _fetchHotelPart (hotelId, partName) {
    const fetcher = this.getFetcher(),
      methodName = `fetch${partName.charAt(0).toUpperCase() + partName.slice(1)}`;
    return fetcher[methodName](hotelId);
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
