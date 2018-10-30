const { assert } = require('chai');

const { resetDB } = require('../../../../src/db/permanent');
const { db } = require('../../../../src/config');
const Subscription = require('../../../../src/db/permanent/models/subscription');

describe('models.subscription', () => {
  describe('create', () => {
    beforeEach(async () => {
      await resetDB();
    });

    it('should insert data', async () => {
      await Subscription.create({
        hotelAddress: '0xdummy',
        remoteId: 'dummy_remote_id',
        notificationsUri: 'dummy_uri',
      });
      const result = await db.select('hotel_address', 'remote_id', 'notifications_uri')
        .from(Subscription.TABLE);
      assert.deepEqual(result[0], {
        'hotel_address': '0xdummy',
        'remote_id': 'dummy_remote_id',
        'notifications_uri': 'dummy_uri',
      });
    });

    it('should throw upon inserting duplicate hotel address', async () => {
      await Subscription.create({
        hotelAddress: '0xdummy',
        remoteId: 'dummy_remote_id',
        notificationsUri: 'dummy_uri',
      });
      let errored = false;
      try {
        await Subscription.create({
          hotelAddress: '0xdummy',
          remoteId: 'dummy_remote_id',
          notificationsUri: 'dummy_uri',
        });
      } catch (err) {
        errored = true;
      }
      if (!errored) {
        throw new Error('Should have thrown');
      }
    });
  });

  describe('get', async () => {
    beforeEach(async () => {
      await resetDB();
      await Subscription.create({
        hotelAddress: '0xdummy',
        remoteId: 'dummy_remote_id',
        notificationsUri: 'dummy_uri',
      });
    });

    it('should return the existing subscription', async () => {
      const result = await Subscription.get('0xdummy');
      assert.deepEqual(result, {
        hotelAddress: '0xdummy',
        remoteId: 'dummy_remote_id',
        notificationsUri: 'dummy_uri',
      });
    });

    it('should return undefined if no existing subscription exists', async () => {
      const result = await Subscription.get('0xdummydum');
      assert.equal(result, undefined);
    });
  });

  describe('update', async () => {
    beforeEach(async () => {
      await resetDB();
      await Subscription.create({
        hotelAddress: '0xdummy',
        remoteId: 'dummy_remote_id',
        notificationsUri: 'dummy_uri',
      });
    });

    it('should update the existing subscription', async () => {
      await Subscription.update('0xdummy', { notificationsUri: 'modified' });
      const result = await Subscription.get('0xdummy');
      assert.deepEqual(result, {
        hotelAddress: '0xdummy',
        remoteId: 'dummy_remote_id',
        notificationsUri: 'modified',
      });
    });
  });
});
