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

  _getSingleUrl (url, success) {
    return request({
      method: 'GET',
      uri: url,
      json: true,
      simple: false,
      resolveWithFullResponse: true,
      timeout: this.config.timeout,
    }).then((response) => {
      if (response.statusCode > 299) {
        throw new FetcherRemoteError(`${url} responded with ${response.statusCode}.`);
      }
      return success(response);
    }).catch((e) => {
      throw new FetcherRemoteError(e);
    });
  }

  _appendNextPage (maxPages, counter, previousResult) {
    return this._fetchHotelIds(maxPages, counter, previousResult.next)
      .then((nextItems) => {
        return {
          ids: previousResult.ids.concat(nextItems.ids),
          errors: previousResult.errors ? previousResult.errors.concat(nextItems.errors) : nextItems.errors,
          next: nextItems.next,
        };
      });
  }

  _fetchHotelIds (maxPages, counter, url) {
    return this._getSingleUrl(url, (response) => {
      if (!response.body || !response.body.items) {
        throw new FetcherRemoteError(`${url} did not respond with items list as expected.`);
      }
      const items = response.body.items,
        mappedItems = items.map((a) => a.id),
        mappedErrors = response.body.errors && response.body.errors.map((a) => a.data && a.data.id).filter((f) => !!f),
        result = {
          ids: mappedItems,
          errors: mappedErrors,
          next: response.body.next,
        };
      if (response.body.next && (!maxPages || (maxPages && counter < maxPages))) {
        return this._appendNextPage(maxPages, ++counter, result);
      }
      return result;
    });
  }

  _fetchHotelResource (hotelId, url) {
    if (!hotelId) {
      throw new FetcherError('hotelId is required');
    }
    return this._getSingleUrl(url, (response) => {
      return response.body;
    });
  }

  fetchHotelList (maxPages, url) {
    const defaultUrl = `${this.config.readApiUrl}/hotels?limit=${this.config.limit}&fields=id`;
    const expectedUrl = new RegExp(`^${this.config.readApiUrl}/hotels`, 'i');
    if (url && !url.match(expectedUrl)) {
      throw new FetcherError(`${url} does not look like hotels list URI`);
    }
    return this._fetchHotelIds(maxPages, 1, url || defaultUrl);
  };

  fetchDataUris (hotelId) {
    return this._fetchHotelResource(hotelId, `${this.config.readApiUrl}/hotels/${hotelId}/dataUris`);
  };

  fetchDescription (hotelId) {
    return this._fetchHotelResource(hotelId, `${this.config.readApiUrl}/hotels/${hotelId}?fields=${DESCRIPTION_FIELDS.join(',')}`);
  };

  fetchRatePlans (hotelId) {
    return this._fetchHotelResource(hotelId, `${this.config.readApiUrl}/hotels/${hotelId}/ratePlans`);
  };

  fetchAvailability (hotelId) {
    return this._fetchHotelResource(hotelId, `${this.config.readApiUrl}/hotels/${hotelId}/availability`);
  };
}

module.exports = {
  DESCRIPTION_FIELDS,
  Fetcher,
  FetcherError,
  FetcherInitializationError,
};
