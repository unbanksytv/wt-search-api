const { validateFilter, ValidationError } = require('./validators');

class QueryParseError extends Error {};

/**
 * Convert a GET query to filtering representation, if possible.
 *
 * @param {Object} query as returned from Hotel.getLatestHotelData.
 * @return {Array|undefined}
 *
 */
function getFilters (query) {
  let filter = query.filter;
  if (!filter) {
    return;
  }
  try {
    filter = JSON.parse(filter);
  } catch (err) {
    throw new QueryParseError('Invalid JSON in `filter`.');
  }
  try {
    validateFilter(filter);
  } catch (err) {
    if (err instanceof ValidationError) {
      throw new QueryParseError('Invalid filter definition.');
    }
    throw err;
  }
  return filter;
}

module.exports = {
  QueryParseError,
  getFilters,
};
