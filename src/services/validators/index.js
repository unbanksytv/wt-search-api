const tv4 = require('tv4');

const notificationSchema = require('./notification-schema.js');

class ValidationError extends Error {};
module.exports.ValidationError = ValidationError;

function _validate (data, schema) {
  if (!tv4.validate(data, schema, false, true)) {
    const msg = tv4.error.message + ': ' + tv4.error.dataPath;
    throw new ValidationError(msg);
  }
}

module.exports.validateNotification = function (data) {
  return _validate(data, notificationSchema);
};
