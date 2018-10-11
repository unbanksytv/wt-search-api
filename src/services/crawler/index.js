const { Fetcher } = require('./fetcher');
const HotelModel = require('../../models/hotel');

class CrawlerError extends Error {}
class CrawlerInitializationError extends CrawlerError {}

class Crawler {
  constructor (options) {
    if (!options.logger || !options.logger.log) {
      throw new CrawlerInitializationError('logger is required in options!');
    }
    this.config = options;
  }

  getFetcher () {
    if (!this._fetcher) {
      this._fetcher = new Fetcher(this.config);
    }
    return this._fetcher;
  }

  async syncAllHotels () {
    // TODO deal with errored ids - although they shouldn't
    // occur here, because it's contacting only on-chain data
    const syncPromises = [];
    try {
      this.config.logger.debug('Fetching hotel list');
      const hotels = await this.getFetcher().fetchHotelList();
      for (let hotelId of hotels.ids) {
        syncPromises.push(
          this.syncHotel(hotelId)
        );
      }
      return Promise.all(syncPromises);
    } catch (e) {
      this.config.logger.error(`Fetching hotel list error: ${e.message}`);
      return [];
    }
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
          this.config.logger.error(`Fetching hotel part error: ${hotelId}:${hotelPartName} - ${e.message}`);
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
      this.config.logger.debug(`Saving ${hotelId} into database`);
      return HotelModel.create(hotelData);
    });
  }

  _fetchHotelPart (hotelId, partName) {
    const fetcher = this.getFetcher(),
      methodName = `fetch${partName.charAt(0).toUpperCase() + partName.slice(1)}`;
    this.config.logger.debug(`Fetching ${partName} for ${hotelId}`);
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
