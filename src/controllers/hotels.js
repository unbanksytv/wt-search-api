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
    const hotel = await HotelModel.getLatestHotelData(address, ['description']);
    ret.push(Object.assign({ id: address }, hotel.data.description));
  }
  return ret;
}

/**
 * Get a list of hotels based on the provided criteria.
 */
module.exports.getList = async (req, res, next) => {
  try {
    const query = {
      filters: queryParser.getFilters(req.query),
      sorting: queryParser.getSort(req.query),
    };
    let hotelAddresses;
    if (query.filters || query.sorting) {
      hotelAddresses = await indexer.lookup(query);
    } else {
      hotelAddresses = await HotelModel.getAddresses();
    }
    res.json(await _augmentWithData(hotelAddresses, req.query));
  } catch (err) {
    if (err instanceof queryParser.QueryParseError) {
      return next(new HttpBadRequestError('badRequest', err.message));
    }
    next(err);
  }
};
