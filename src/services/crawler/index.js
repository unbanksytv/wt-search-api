const Queue = require('../queue');
const { Fetcher, FetcherRemoteError } = require('./fetcher');
const HotelModel = require('../../db/permanent/models/hotel');
const { subscribeIfNeeded } = require('../../services/subscription');

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

  _fetchHotelPart (hotelAddress, partName) {
    const fetcher = this.getFetcher(),
      methodName = `fetch${partName.charAt(0).toUpperCase() + partName.slice(1)}`;
    this.config.logger.debug(`Fetching ${partName} for ${hotelAddress}`);
    return fetcher[methodName](hotelAddress);
  }

  async _syncHotelPart (hotelAddress, partName) {
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
              // For the sake of robustness, ignore individual hotel errors.
              // (The errors are logged within syncHotel already.)
              this.syncHotel(hotelAddress).catch(() => undefined)
            );
          }
        },
      });
      return Promise.all(syncPromises);
    } catch (e) {
      this.logError(e, `Fetching hotel list error: ${e.message}`);
      throw e;
    }
  }

  async syncHotel (hotelAddress) {
    if (!hotelAddress) {
      throw new CrawlerError('hotelAddress is required to syncHotel.');
    }
    this.config.logger.debug(`Fetching ${hotelAddress} /dataUris`);
    try {
      const indexData = await this._syncHotelPart(hotelAddress, 'dataUris');
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
      const hotelParts = (await Promise.all(hotelPartPromises)),
        hotelData = hotelParts.map((part) => {
          if (part && part.rawData) {
            return {
              address: hotelAddress,
              partName: part.partName,
              rawData: part.rawData,
            };
          }
        }).filter((p) => !!p),
        description = hotelParts.filter((part) =>
          part && part.rawData && part.partName === 'description'
        )[0],
        notificationsUri = description && description.rawData.notificationsUri;

      if (hotelData.length !== 0) {
        this.config.logger.debug(`Saving ${hotelAddress} into database`);
        await HotelModel.create(hotelData);
        if (this.config.triggerIndexing) {
          this.queue.enqueue({ type: 'indexHotel', payload: { hotelAddress } });
        }
      } else {
        this.config.logger.debug(`No data for ${hotelAddress} available`);
      }
      if (notificationsUri && this.config.subscribeForNotifications) {
        this.config.logger.debug(`Subscribing for update notifications for ${hotelAddress} at ${notificationsUri}`);
        await subscribeIfNeeded(notificationsUri, hotelAddress);
      }
    } catch (e) {
      this.logError(e, `Fetching hotel error: ${hotelAddress} - ${e.message}`);
      throw e;
    };
  }
}

module.exports = Crawler;
