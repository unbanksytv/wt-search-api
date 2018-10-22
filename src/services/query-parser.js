class QueryParseError extends Error {};

const MAX_DISTANCE = 200; // Disallow large distances as they break the approximation.
/**
 * Extract location query from the params.
 *
 * @param {Object} query request GET params
 * @return {Array}
 * @throw QueryParseError
 *
 */
function _getLocationFilter (filters) {
  if (!(filters instanceof Array)) {
    filters = [filters];
  }
  return filters.map((filter) => {
    let [coords, distance] = filter.split(':'),
      [lat, lng] = coords.split(',');
    [distance, lat, lng] = [distance, lat, lng].map((x) => Number(x));
    if ((isNaN(distance) || isNaN(lat) || isNaN(lng)) ||
        (lat < -90 || lat > 90) ||
        (lng < -180 || lng > 180) ||
        (distance < 0)) {
      throw new QueryParseError(`Invalid location filter ${filter}.`);
    }
    if (distance > MAX_DISTANCE) {
      throw new QueryParseError(`Maximum allowed distance in a filter is ${MAX_DISTANCE} km`);
    }
    return {
      type: 'location',
      condition: { lat: lat, lng: lng, distance: distance },
    };
  });
}

/**
 * Extract filtering information from the GET query and
 * transform it to the internal representation.
 *
 * @param {Object} query request GET params
 * @return {Array}
 * @throw QueryParseError
 *
 */
function getFilters (query) {
  const filters = Object.keys(FILTERS)
    .map((filterParam) => {
      if (!query[filterParam]) {
        return;
      }
      return FILTERS[filterParam](query[filterParam]);
    })
    .filter(Boolean)
    .reduce((prev, curr) => prev.concat(curr), []);

  return (filters.length > 0) ? filters : undefined;
}

/**
 * Extract location query from the params.
 *
 * @param {Object} query request GET params
 * @return {Object}
 * @throw QueryParseError
 *
 */
function _getLocationSort (sort) {
  if (sort instanceof Array) {
    throw new QueryParseError('Only one location sort can be specified at once.');
  }
  let [lat, lng] = sort.split(',').map((x) => Number(x));
  if ((isNaN(lat) || isNaN(lng)) ||
      (lat < -90 || lat > 90) ||
      (lng < -180 || lng > 180)) {
    throw new QueryParseError(`Invalid location sort: ${sort}.`);
  }
  return {
    type: 'location',
    data: { lat: lat, lng: lng },
  };
}

/**
 * Extract sorting representation from the GET query, if
 * applicable.
 *
 * @param {Object} query request GET params
 * @return {Object}
 * @throw QueryParseError
 *
 */
function getSort (query) {
  return Object.keys(SORTS)
    .map((sortParam) => {
      if (!query[sortParam]) {
        return;
      }
      return SORTS[sortParam](query[sortParam]);
    })
    .filter(Boolean)
    .reduce((prev, curr) => {
      if (prev && curr) {
        throw new QueryParseError('Cannot specify more than a single criteria for sorting.');
      }
      return prev || curr;
    }, undefined);
}

const FILTERS = {
  // { <query_param> : <filter_fn> }
  location: _getLocationFilter,
};

const SORTS = {
  // { <query_param> : <sort_fn> }
  sortByLocation: _getLocationSort,
};

module.exports = {
  FILTERS,
  SORTS,
  MAX_DISTANCE,
  QueryParseError,
  getFilters,
  getSort,
};
