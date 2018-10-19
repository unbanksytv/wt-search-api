const tv4 = require('tv4');

const filterSchema = require('./filter-schema.js');
const sortSchema = require('./sort-schema.js');

class ValidationError extends Error {};

function _validateData (data, schema) {
  if (!tv4.validate(data, schema, false, true)) {
    const msg = tv4.error.message + ': ' + tv4.error.dataPath;
    throw new ValidationError(msg);
  }
};

function validateFilter (filter) {
  return _validateData(filter, filterSchema);
};

function validateSort (sort) {
  return _validateData(sort, sortSchema);
};

module.exports = {
  ValidationError,
  validateFilter,
  validateSort,
};
