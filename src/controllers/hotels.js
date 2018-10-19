const { HttpBadRequestError } = require('../errors');
const queryParser = require('../services/query-parser');
const Indexer = require('../services/indexer');
const HotelModel = require('../db/permanent/models/hotel');

const indexer = new Indexer();

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
    // TODO: Augment with hotel data.
    res.json(hotelAddresses);
  } catch (err) {
    if (err instanceof queryParser.QueryParseError) {
      return next(new HttpBadRequestError('badRequest', err.message));
    }
    next(err);
  }
};
