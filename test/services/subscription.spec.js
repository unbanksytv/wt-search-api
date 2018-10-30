const { assert } = require('chai');
const sinon = require('sinon');

const { baseUrl, wtIndexAddress } = require('../../src/config');
const { subscribeIfNeeded, RemoteError } = require('../../src/services/subscription');
const Subscription = require('../../src/db/permanent/models/subscription');
const { resetDB } = require('../../src/db/permanent');

const requestMock = sinon.stub().callsFake((opts) => {
  if (opts.body.resourceAddress === 'invalidAddress') {
    return Promise.reject(new Error('Invalid hotel address.'));
  }
  return Promise.resolve({
    statusCode: 201,
    body: { subscriptionId: 'dummyRemoteId' },
  });
});

describe('subscription', function () {
  describe('subscribeIfNeeded', () => {
    beforeEach(async () => {
      requestMock.resetHistory();
      await resetDB();
    });

    it('should not do anything when the subscription already exists', async () => {
      await Subscription.create({
        notificationsUri: 'http://dummy.uri',
        hotelAddress: '0xdummy',
        remoteId: 'xxx',
      });
      await subscribeIfNeeded('http://dummy.uri', '0xdummy', requestMock);
      assert.equal(requestMock.callCount, 0);
    });

    it('should create a new subscription if necessary', async () => {
      await subscribeIfNeeded('http://dummy.uri', '0xdummy', requestMock);
      assert.equal(requestMock.callCount, 1);
      assert.equal(requestMock.args[0][0].uri, 'http://dummy.uri/subscriptions');
      assert.deepEqual(requestMock.args[0][0].body, {
        wtIndex: wtIndexAddress,
        resourceType: 'hotel',
        resourceAddress: '0xdummy',
        url: `${baseUrl}/notifications`,
      });
      const sub = await Subscription.get('0xdummy');
      assert.deepEqual(sub, {
        notificationsUri: 'http://dummy.uri',
        hotelAddress: '0xdummy',
        remoteId: 'dummyRemoteId',
      });
    });

    it('should update an obsolete definition of subscription', async () => {
      await Subscription.create({
        notificationsUri: 'http://dummy.uri',
        hotelAddress: '0xdummy',
        remoteId: 'xxx',
      });
      await subscribeIfNeeded('http://dummy2.uri', '0xdummy', requestMock);
      assert.equal(requestMock.callCount, 1);
      assert.equal(requestMock.args[0][0].uri, 'http://dummy2.uri/subscriptions');
      const sub = await Subscription.get('0xdummy');
      assert.deepEqual(sub, {
        notificationsUri: 'http://dummy2.uri',
        hotelAddress: '0xdummy',
        remoteId: 'dummyRemoteId',
      });
    });

    it('should throw RemoteError if applicable', async () => {
      try {
        await subscribeIfNeeded('http://dummy.uri', 'invalidAddress', requestMock);
        throw new Error('Should have thrown');
      } catch (err) {
        assert.instanceOf(err, RemoteError);
      }
    });
  });
});
