const request = require('request-promise-native');

const Subscription = require('../db/permanent/models/subscription');
const { baseUrl, logger } = require('../config');
const wtIndexGetter = require('./wt-index-getter');

class RemoteError extends Error {};

/**
 * Send a subscription request and return the subscription ID.
 *
 * @param {String} notificationsUri
 * @param {String} hotelAddress
 * @param {Function} requestLib optional
 * @return {Promise<String>}
 */
async function _sendSubscriptionRequest (notificationsUri, hotelAddress, token, requestLib) {
  requestLib = requestLib || request;
  let response;
  const wtIndexAddress = await wtIndexGetter.get(requestLib);
  try {
    response = await requestLib({
      method: 'POST',
      uri: (new URL('/subscriptions', notificationsUri)).toString(),
      body: {
        wtIndex: wtIndexAddress,
        resourceType: 'hotel',
        resourceAddress: hotelAddress,
        url: (new URL(`/notifications/${token}`, baseUrl)).toString(),
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
  const token = await Subscription.generateToken(),
    remoteId = await _sendSubscriptionRequest(notificationsUri, hotelAddress, token, requestLib);
  logger.debug(`Subscribing for update notifications for ${hotelAddress} at ${notificationsUri}`);
  if (subscription) {
    // Notifications URI has changed. We don't need to
    // unsubscribe from the previous notificationsUri because,
    // presumably, updates for the given hotel will not be
    // broadcast through it anyway.
    return Subscription.update(hotelAddress, { notificationsUri, remoteId, token });
  }
  return Subscription.create({ hotelAddress, remoteId, notificationsUri, token });
}

module.exports = {
  subscribeIfNeeded,
  RemoteError,
};
