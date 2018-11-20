const { assert } = require('chai');

const { resetDB } = require('../../../../src/db/permanent');
const { db } = require('../../../../src/config');
const Subscription = require('../../../../src/db/permanent/models/subscription');

describe('models.subscription', () => {
  describe('generateToken', () => {
    it('should generate a unique token', async () => {
      const token = await Subscription.generateToken();
      assert.equal(typeof token, 'string');
      const token2 = await Subscription.generateToken();
      assert.notEqual(token, token2);
    });
  });

  describe('create', () => {
    beforeEach(async () => {
      await resetDB();
    });

    it('should insert data', async () => {
      const token = await Subscription.generateToken();
      await Subscription.create({
        hotelAddress: '0xdummy',
        remoteId: 'dummy_remote_id',
        notificationsUri: 'dummy_uri',
        token,
      });
      const result = await db.select('hotel_address', 'remote_id', 'notifications_uri', 'token')
        .from(Subscription.TABLE);

      assert.deepEqual(result[0], {
        'hotel_address': '0xdummy',
        'remote_id': 'dummy_remote_id',
        'notifications_uri': 'dummy_uri',
        'token': token,
      });
    });

    it('should throw upon inserting duplicate hotel address', async () => {
      await Subscription.create({
        hotelAddress: '0xdummy',
        remoteId: 'dummy_remote_id',
        notificationsUri: 'dummy_uri',
        token: await Subscription.generateToken(),
      });
      let errored = false;
      try {
        await Subscription.create({
          hotelAddress: '0xdummy',
          remoteId: 'dummy_remote_id',
          notificationsUri: 'dummy_uri',
          token: await Subscription.generateToken(),
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
    let token;
    beforeEach(async () => {
      await resetDB();
      token = await Subscription.generateToken();
      await Subscription.create({
        hotelAddress: '0xdummy',
        remoteId: 'dummy_remote_id',
        notificationsUri: 'dummy_uri',
        token,
      });
    });

    it('should return the existing subscription', async () => {
      const result = await Subscription.get('0xdummy');
      assert.deepEqual(result, {
        'hotelAddress': '0xdummy',
        'remoteId': 'dummy_remote_id',
        'notificationsUri': 'dummy_uri',
        'token': token,
      });
    });

    it('should return undefined if no existing subscription exists', async () => {
      const result = await Subscription.get('0xdummydum');
      assert.equal(result, undefined);
    });
  });

  describe('update', async () => {
    let token;
    beforeEach(async () => {
      await resetDB();
      token = await Subscription.generateToken();
      await Subscription.create({
        hotelAddress: '0xdummy',
        remoteId: 'dummy_remote_id',
        notificationsUri: 'dummy_uri',
        token,
      });
    });

    it('should update the existing subscription', async () => {
      await Subscription.update('0xdummy', { notificationsUri: 'modified' });
      const result = await Subscription.get('0xdummy');
      assert.deepEqual(result, {
        'hotelAddress': '0xdummy',
        'remoteId': 'dummy_remote_id',
        'notificationsUri': 'modified',
        'token': token,
      });
    });
  });
});
