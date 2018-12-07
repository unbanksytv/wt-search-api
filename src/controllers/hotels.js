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
    let hotelAddresses, scores;
    if (query.filters || query.sorting) {
      const lookup = await indexer.lookup(query, limit + 1, startWith);
      hotelAddresses = lookup.map((x) => x.address);
      if (query.sorting) {
        scores = lookup.map((x) => {
          return {
            id: x.address,
            score: x.score,
          };
        });
      }
    } else {
      hotelAddresses = await HotelModel.getAddresses(limit + 1, startWith);
    }
    const hotels = await _augmentWithData(hotelAddresses.slice(0, limit), req.query),
      result = { items: hotels };

    if (scores) {
      result.sortingScores = scores;
    }

    if (hotelAddresses[limit]) {
      let transferredQueryParams = Object.keys(queryParser.FILTERS)
        .concat(Object.keys(queryParser.SORTS))
        .map((q) => {
          if (req.query[q]) {
            return {
              name: q,
              value: req.query[q],
            };
          }
        }).reduce((acc, c) => {
          if (c) {
            acc.push(`${c.name}=${c.value}`);
          }
          return acc;
        }, [])
        .join('&');
      if (transferredQueryParams) {
        transferredQueryParams += '&';
      }

      result.next = `${baseUrl}${req.path}?${transferredQueryParams}limit=${limit}&startWith=${hotelAddresses[limit]}`;
    }
    res.json(result);
  } catch (err) {
    if (err instanceof queryParser.QueryParseError) {
      return next(new HttpBadRequestError('badRequest', err.message));
    }
    next(err);
  }
};
