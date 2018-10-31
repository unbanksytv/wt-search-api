const request = require('request-promise-native');

const { readApiUrl } = require('../config');

let _wtIndexAddress;

/**
 * Lazily retrieve wt index address from the read api and cache
 * it for subsequent uses.
 *
 * @return {Promise<String>}
 */
module.exports.get = async function (requestLib) {
  requestLib = requestLib || request;
  if (!_wtIndexAddress) {
    const response = await requestLib({
      method: 'GET',
      uri: (new URL('/', readApiUrl)).toString(),
      json: true,
    });
    _wtIndexAddress = response.wtIndexAddress;
  }
  return _wtIndexAddress;
};

/**
 * Reset the internal state of wt index getter.
 *
 * @return {void}
 */
module.exports.reset = function () {
  _wtIndexAddress = undefined;
};
