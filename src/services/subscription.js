const url = require('url');

const request = require('request-promise-native');

const Subscription = require('../db/permanent/models/subscription');
const { baseUrl, wtIndexAddress } = require('../config');

class RemoteError extends Error {};

/**
 * Send a subscription request and return the subscription ID.
 *
 * @param {String} notificationsUri
 * @param {String} hotelAddress
 * @param {Function} requestLib optional
 * @return {Promise<String>}
 */
async function _sendSubscriptionRequest (notificationsUri, hotelAddress, requestLib) {
  requestLib = requestLib || request;
  let response;
  try {
    response = await requestLib({
      method: 'POST',
      uri: url.resolve(notificationsUri, '/subscriptions'),
      body: {
        wtIndex: wtIndexAddress,
        resourceType: 'hotel',
        resourceAddress: hotelAddress,
        url: url.resolve(baseUrl, '/notifications'),
      },
      json: true,
      resolveWithFullResponse: true,
    });
  } catch (err) {
    throw new RemoteError(`Could not subscribe: ${err.message}`);
  }
  const subscriptionId = response.body && response.body.subscriptionId;
  if (response.statusCode > 299 || !subscriptionId) {
    throw new RemoteError(`Invalid response: ${response.statusCode} with ${subscriptionId}`);
  }
  return subscriptionId;
}

/**
 * Create a subscription for the given hotel address, if not yet
 * present.
 *
 * @param {String} notificationsUri
 * @param {String} hotelAddress
 * @param {Function} requestLib optional
 * @return {Promise}
 */
async function subscribeIfNeeded (notificationsUri, hotelAddress, requestLib) {
  requestLib = requestLib || request;
  const subscription = await Subscription.get(hotelAddress);
  if (subscription && subscription.notificationsUri === notificationsUri) {
    return; // Nothing to do.
  }
  const remoteId = await _sendSubscriptionRequest(notificationsUri, hotelAddress, requestLib);
  if (subscription) { // Notifications URI has changed.
    return Subscription.update(hotelAddress, { notificationsUri, remoteId });
  }
  return Subscription.create({ hotelAddress, remoteId, notificationsUri });
}

module.exports = {
  subscribeIfNeeded,
  RemoteError,
};
