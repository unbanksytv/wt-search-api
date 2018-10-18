const Queue = require('../queue');
const { Fetcher, FetcherRemoteError } = require('./fetcher');
const HotelModel = require('../../db/permanent/models/hotel');

class CrawlerError extends Error {}
class CrawlerInitializationError extends CrawlerError {}

class Crawler {
  constructor (options) {
    if (!options.logger || !options.logger.log) {
      throw new CrawlerInitializationError('logger is required in options!');
    }
    this.config = options;
    this.queue = Queue.get();
  }

  logError (err, message) {
    // Distinguish between remote errors (we expect them to
    // happen from time to time, they're part of the business)
    // and unexpected ones (true errors representing flaws in
    // our logic).
    const level = (err instanceof FetcherRemoteError) ? 'warn' : 'error';
    this.config.logger[level](err.message);
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
          for (let hotelAddress of hotels.addresses) {
            syncPromises.push(
              this.syncHotel(hotelAddress)
            );
          }
        },
      });
      return Promise.all(syncPromises);
    } catch (e) {
      this.logError(e, `Fetching hotel list error: ${e.message}`);
      return [];
    }
  }

  async syncHotel (hotelAddress) {
    if (!hotelAddress) {
      throw new CrawlerError('hotelAddress is required to syncHotel.');
    }
    this.config.logger.debug(`Fetching ${hotelAddress} /dataUris`);
    try {
      const indexData = await this.syncHotelPart(hotelAddress, 'dataUris');
      const dataUris = indexData.rawData;
      const parts = HotelModel.PART_NAMES.filter((p) => {
        return typeof dataUris[`${p}Uri`] === 'string';
      });
      const hotelPartPromises = [];
      for (let hotelPartName of parts) {
        hotelPartPromises.push((async () => {
          try {
            const rawData = await this._fetchHotelPart(hotelAddress, hotelPartName);
            return {
              rawData: rawData,
              partName: hotelPartName,
            };
          } catch (e) {
            this.logError(e, `Fetching hotel part error: ${hotelAddress}:${hotelPartName} - ${e.message}`);
          }
        })());
      }
      const hotelData = (await Promise.all(hotelPartPromises)).map((part) => {
        if (part) {
          return {
            address: hotelAddress,
            partName: part.partName,
            rawData: part.rawData,
          };
        }
      }).filter((p) => !!p);
      if (hotelData.length !== 0) {
        this.config.logger.debug(`Saving ${hotelAddress} into database`);
        await HotelModel.create(hotelData);
        if (this.config.triggerIndexing) {
          this.queue.enqueue({ type: 'indexHotel', payload: { hotelAddress } });
        }
      } else {
        this.config.logger.debug(`No data for ${hotelAddress} available`);
      }
    } catch (e) {
      this.logError(e, `Fetching hotel part error: ${hotelAddress}:dataUris - ${e.message}`);
    };
  }

  _fetchHotelPart (hotelAddress, partName) {
    const fetcher = this.getFetcher(),
      methodName = `fetch${partName.charAt(0).toUpperCase() + partName.slice(1)}`;
    this.config.logger.debug(`Fetching ${partName} for ${hotelAddress}`);
    return fetcher[methodName](hotelAddress);
  }

  async syncHotelPart (hotelAddress, partName) {
    if (!hotelAddress) {
      throw new CrawlerError('hotelAddress is required to syncHotelPart.');
    }
    if (!partName) {
      throw new CrawlerError('partName is required to syncHotelPart.');
    }
    const rawData = await this._fetchHotelPart(hotelAddress, partName);
    this.config.logger.debug(`Saving ${hotelAddress} into database`);
    return {
      rawData: rawData,
      db: await HotelModel.create({
        address: hotelAddress,
        partName: partName,
        rawData: rawData,
      }),
    };
  }
}

module.exports = Crawler;
