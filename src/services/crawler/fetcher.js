const request = require('request-promise-native');

const DESCRIPTION_FIELDS = [
  'id',
  'managerAddress',
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
  'notificationsUri',
  'bookingUri',
];

class FetcherError extends Error {}
class FetcherRemoteError extends Error {}
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

  async _getSingleUrl (url, success) {
    try {
      const response = await request({
        method: 'GET',
        uri: url,
        json: true,
        simple: false,
        resolveWithFullResponse: true,
        timeout: this.config.timeout,
      });
      if (response.statusCode > 299) {
        throw new FetcherRemoteError(`${url} responded with ${response.statusCode}.`);
      }
      return success(response);
    } catch (e) {
      throw new FetcherRemoteError(e.message);
    }
  }

  async _appendNextPage (options) {
    const nextItems = await this._fetchHotelAddresses(Object.assign({
      url: options.previousResult.next,
    }, options));
    return {
      addresses: options.previousResult.addresses.concat(nextItems.addresses),
      errors: options.previousResult.errors ? options.previousResult.errors.concat(nextItems.errors) : nextItems.errors,
      next: nextItems.next,
    };
  }

  _fetchHotelAddresses (options) {
    const expectedUrl = new RegExp(`^${this.config.readApiUrl}/hotels`, 'i');
    if (options.url && !options.url.match(expectedUrl)) {
      throw new FetcherError(`${options.url} does not look like hotels list URI`);
    }
    return this._getSingleUrl(options.url, (response) => {
      if (!response.body || !response.body.items) {
        throw new FetcherRemoteError(`${options.url} did not respond with items list as expected.`);
      }
      const items = response.body.items,
        mappedItems = items.map((a) => a.id),
        mappedErrors = response.body.errors && response.body.errors.map((a) => a.data && a.data.id).filter((f) => !!f),
        result = {
          addresses: mappedItems,
          errors: mappedErrors,
          next: response.body.next,
        };
      if (options.onEveryPage) {
        options.onEveryPage(result);
      }
      if (response.body.next && (!options.maxPages || (options.maxPages && options.counter < options.maxPages))) {
        return this._appendNextPage({
          maxPages: options.maxPages,
          counter: ++options.counter,
          previousResult: result,
          onEveryPage: options.onEveryPage,
        });
      }
      return result;
    });
  }

  _fetchHotelResource (hotelAddress, url) {
    if (!hotelAddress) {
      throw new FetcherError('hotelAddress is required');
    }
    return this._getSingleUrl(url, (response) => {
      return response.body;
    });
  }

  fetchHotelList (options = {}) {
    return this._fetchHotelAddresses(Object.assign({}, {
      counter: 1,
      url: `${this.config.readApiUrl}/hotels?limit=${this.config.limit}&fields=id`,
    }, options));
  };

  fetchDataUris (hotelAddress) {
    return this._fetchHotelResource(hotelAddress, `${this.config.readApiUrl}/hotels/${hotelAddress}/dataUris`);
  };

  fetchDescription (hotelAddress) {
    return this._fetchHotelResource(hotelAddress, `${this.config.readApiUrl}/hotels/${hotelAddress}?fields=${DESCRIPTION_FIELDS.join(',')}`);
  };

  fetchRatePlans (hotelAddress) {
    return this._fetchHotelResource(hotelAddress, `${this.config.readApiUrl}/hotels/${hotelAddress}/ratePlans`);
  };

  fetchAvailability (hotelAddress) {
    return this._fetchHotelResource(hotelAddress, `${this.config.readApiUrl}/hotels/${hotelAddress}/availability`);
  };
}

module.exports = {
  DESCRIPTION_FIELDS,
  Fetcher,
  FetcherError,
  FetcherRemoteError,
  FetcherInitializationError,
};
