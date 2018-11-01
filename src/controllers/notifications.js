const { HttpBadRequestError } = require('../errors');
const { validateNotification, ValidationError } = require('../services/validators');
const Queue = require('../services/queue');

/**
 * Accept an incoming update notification.
 *
 * (Implements the consumer side of https://github.com/windingtree/wt-update-api.)
 */
module.exports.accept = async (req, res, next) => {
  try {
    const notification = req.body;
    validateNotification(notification);
    let messageType = 'syncHotel';
    if (notification.scope && notification.scope.action === 'delete') {
      messageType = 'deleteHotel';
    }
    Queue.get().enqueue({
      type: messageType,
      payload: {
        hotelAddress: notification.resourceAddress,
      },
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
