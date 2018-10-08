const request = require('request-promise-native');

/* const HOTEL_DESCRIPTION_FIELDS = [
  'id',
  'manager',
  'name',
  'description',
  'location',
  'images',
  'contacts',
  'address',
  'roomTypes',
  'timezone',
  'currency',
  'amenities',
  'updatedAt',
  'defaultCancellationAmount',
  'cancellationPolicies',
]; */

class FetcherError extends Error {}
class FetcherInitializationError extends FetcherError {}

class Fetcher {
  constructor (options) {
    if (!options || !options.readApiUrl) {
      throw new FetcherInitializationError('readApiUrl is required in options!');
    }
    this.config = Object.assign({}, {
      timeout: 1000,
      limit: 10,
    }, options);
  }

  async _appendNextPage (maxPages, counter, next, previousItems) {
    if (counter >= maxPages) {
      return {
        ids: previousItems,
        next: next,
      };
    }
    return this._fetchHotelIds(maxPages, ++counter, next)
      .then((nextItems) => {
        return {
          ids: previousItems.concat(nextItems.ids),
          next: nextItems.next,
        };
      });
  }

  async _fetchHotelIds (maxPages, counter, url) {
    return request({
      method: 'GET',
      uri: url,
      json: true,
      simple: false,
      resolveWithFullResponse: true,
    }).then((response) => {
      // TODO handle format errors (no items present)
      // TODO handle network errors
      // TODO somehow handle response.body.errors
      const items = response.body.items,
        mappedItems = items.map((a) => a.id);
      if (response.body.next) {
        return this._appendNextPage(maxPages, counter, response.body.next, mappedItems);
      }
      return {
        ids: mappedItems,
        next: response.body.next,
      };
    });
  }

  async fetchHotelIds (maxPages, url) {
    const defaultUrl = `${this.config.readApiUrl}/hotels?limit=${this.config.limit}&fields=id`;
    const expectedUrl = new RegExp(`^${this.config.readApiUrl}/hotels`, 'i');
    if (url && !url.match(expectedUrl)) {
      throw new FetcherError(`${url} does not look like hotels list URI`);
    }
    return this._fetchHotelIds(maxPages, 1, url || defaultUrl);
  };
/*
  fetchHotelDataUris (hotelId) {
  };

  fetchHotelDescription (hotelId) {
  };

  fetchHotelRatePlans (hotelId) {
  };

  fetchHotelAvailability (hotelId) {
  };
*/
}

module.exports = {
  Fetcher,
  FetcherError,
  FetcherInitializationError,
};
