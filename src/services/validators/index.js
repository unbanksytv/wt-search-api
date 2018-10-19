const tv4 = require('tv4');

const filterSchema = require('./filter-schema.js');

class ValidationError extends Error {};

function validateFilter (filter) {
  if (!tv4.validate(filter, filterSchema, false, true)) {
    const msg = tv4.error.message + ': ' + tv4.error.dataPath;
    throw new ValidationError(msg);
  }
};

module.exports = {
  ValidationError,
  validateFilter,
};
