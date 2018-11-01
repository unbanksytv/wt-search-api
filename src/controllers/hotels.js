const { baseUrl, defaultPageSize, maxPageSize } = require('../config');
const { HttpBadRequestError } = require('../errors');
const queryParser = require('../services/query-parser');
const Indexer = require('../services/indexer');
const HotelModel = require('../db/permanent/models/hotel');

const indexer = new Indexer();

/**
 * Augment hotel addresses with hotel data.
 *
 * TODO:
 *   - document and utilize the ?fields=... param
 *   - be compatible with the read api interface
 *   - reduce the number of database queries
 *
 * @param {Array} hotelAddresses
 * @param {Object} queryParams
 * @return {Array}
 */
async function _augmentWithData (hotelAddresses, queryParams) {
  const ret = [];
  for (let address of hotelAddresses) {
    const hotel = await HotelModel.getHotelData(address, ['description']);
    ret.push(Object.assign({ id: address }, hotel.data.description));
  }
  return ret;
}

/**
 * Get a list of hotels based on the provided criteria.
 */
module.exports.getList = async (req, res, next) => {
  try {
    const limit = Math.min(maxPageSize, req.query.limit || defaultPageSize),
      startWith = req.query.startWith;
    if (isNaN(limit) || limit < 1) {
      throw new HttpBadRequestError('badRequest', `Invalid limit: ${req.query.limit}`);
    }
    const query = {
      filters: queryParser.getFilters(req.query),
      sorting: queryParser.getSort(req.query),
    };
    let hotelAddresses;
    if (query.filters || query.sorting) {
      hotelAddresses = await indexer.lookup(query, limit + 1, startWith);
    } else {
      hotelAddresses = await HotelModel.getAddresses(limit + 1, startWith);
    }
    const hotels = await _augmentWithData(hotelAddresses.slice(0, limit), req.query),
      result = { items: hotels };

    if (hotelAddresses[limit]) {
      result.next = `${baseUrl}${req.path}?limit=${limit}&startWith=${hotelAddresses[limit]}`;
    }
    res.json(result);
  } catch (err) {
    if (err instanceof queryParser.QueryParseError) {
      return next(new HttpBadRequestError('badRequest', err.message));
    }
    next(err);
  }
};
