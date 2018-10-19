const { validateFilter, validateSort, ValidationError } = require('./validators');

class QueryParseError extends Error {};

/**
 * Parse and validate a JSON-encoded GET parameter.
 *
 * @param {Object} query request GET params
 * @param {String} partName
 * @param {Function} validateFn
 * @return {Object}
 *
 */
function getQueryPart (query, partName, validateFn) {
  let part = query[partName];
  if (!part) {
    return;
  }
  try {
    part = JSON.parse(part);
  } catch (err) {
    throw new QueryParseError(`Invalid JSON in '${partName}'.`);
  }
  try {
    validateFn(part);
  } catch (err) {
    if (err instanceof ValidationError) {
      throw new QueryParseError(`Invalid ${partName} definition.`);
    }
    throw err;
  }
  return part;
}

/**
 * Extract filtering representation from the GET query, if
 * applicable.
 *
 * @param {Object} query request GET params
 * @return {Array|undefined}
 *
 */
function getFilters (query) {
  return getQueryPart(query, 'filter', validateFilter);
}

/**
 * Extract sorting representation from the GET query, if
 * applicable.
 *
 * @param {Object} query request GET params
 * @return {Object}
 *
 */
function getSort (query) {
  return getQueryPart(query, 'sort', validateSort);
}

module.exports = {
  QueryParseError,
  getFilters,
  getSort,
};
