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
      await this.getFetcher().fetchHotelList({
        onEveryPage: (hotels) => {
          for (let hotelId of hotels.ids) {
            syncPromises.push(
              this.syncHotel(hotelId)
            );
          }
        },
      });
      return Promise.all(syncPromises);
    } catch (e) {
      this.config.logger.error(`Fetching hotel list error: ${e.message}`);
      return [];
    }
  }

  async syncHotel (hotelId) {
    if (!hotelId) {
      throw new CrawlerError('hotelId is required to syncHotel.');
    }
    this.config.logger.debug(`Fetching ${hotelId} /dataUris`);
    try {
      const indexData = await this.syncHotelPart(hotelId, 'dataUris');
      const dataUris = indexData.rawData;
      const parts = HotelModel.HOTEL_PART_NAMES.filter((p) => {
        return typeof dataUris[`${p}Uri`] === 'string';
      });
      const hotelPartPromises = [];
      for (let hotelPartName of parts) {
        hotelPartPromises.push((async () => {
          try {
            const rawData = await this._fetchHotelPart(hotelId, hotelPartName);
            return {
              rawData: rawData,
              partName: hotelPartName,
            };
          } catch (e) {
            this.config.logger.error(`Fetching hotel part error: ${hotelId}:${hotelPartName} - ${e.message}`);
          }
        })());
      }
      const hotelData = (await Promise.all(hotelPartPromises)).map((part) => {
        if (part) {
          return {
            address: hotelId,
            partName: part.partName,
            rawData: part.rawData,
          };
        }
      }).filter((p) => !!p);
      this.config.logger.debug(`Saving ${hotelId} into database`);
      return HotelModel.create(hotelData);
    } catch (e) {
      this.config.logger.error(`Fetching hotel part error: ${hotelId}:dataUris - ${e.message}`);
    };
  }

  _fetchHotelPart (hotelId, partName) {
    const fetcher = this.getFetcher(),
      methodName = `fetch${partName.charAt(0).toUpperCase() + partName.slice(1)}`;
    this.config.logger.debug(`Fetching ${partName} for ${hotelId}`);
    return fetcher[methodName](hotelId);
  }

  async syncHotelPart (hotelId, partName) {
    if (!hotelId) {
      throw new CrawlerError('hotelId is required to syncHotelPart.');
    }
    if (!partName) {
      throw new CrawlerError('partName is required to syncHotelPart.');
    }
    const rawData = await this._fetchHotelPart(hotelId, partName);
    return {
      rawData: rawData,
      db: await HotelModel.create({
        address: hotelId,
        partName: partName,
        rawData: rawData,
      }),
    };
  }
}

module.exports = {
  Crawler,
};
