const { HttpBadRequestError, HttpUnauthorizedError } = require('../errors');
const { validateNotification, ValidationError } = require('../services/validators');
const Queue = require('../services/queue');
const Subscription = require('../db/permanent/models/subscription');

/**
 * Accept an incoming update notification.
 *
 * (Implements the consumer side of https://github.com/windingtree/wt-update-api.)
 */
module.exports.accept = async (req, res, next) => {
  try {
    const notification = req.body;
    validateNotification(notification);
    const hotelAddress = notification.resourceAddress;
    // 1. Check that the notification corresponds to
    // a previously created subscription.
    const subscription = await Subscription.get(hotelAddress);
    if (!subscription || subscription.token !== req.params.subscription_token) {
      const msg = 'Token and hotel address do not match any existing subscription.';
      throw new HttpUnauthorizedError('unauthorized', msg);
    }

    // 2. Accept and process the notification.
    let messageType = 'syncHotel';
    if (notification.scope && notification.scope.action === 'delete') {
      messageType = 'deleteHotel';
    }
    Queue.get().enqueue({
      type: messageType,
      payload: { hotelAddress },
    });
    res.set('Content-Type', 'text/plain');
    res.status(200).send('notification accepted');
  } catch (err) {
    if (err instanceof ValidationError) {
      return next(new HttpBadRequestError('validationFailed', err.message));
    }
    next(err);
  }
};
