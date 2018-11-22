/* eslint-env mocha */
const { assert } = require('chai');
const request = require('supertest');
const sinon = require('sinon');

const Queue = require('../../src/services/queue');
const Subscription = require('../../src/db/permanent/models/subscription');

describe('controllers - notifications', function () {
  let server, origQueue;

  before(async () => {
    server = require('../../src/index');
    origQueue = Queue.get();
    Queue.set({ enqueue: sinon.stub() });
  });

  after(() => {
    server.close();
    Queue.set(origQueue);
  });

  describe('POST /notifications/:subscription_token', () => {
    let token;
    before(async () => {
      token = await Subscription.generateToken();
      await Subscription.create({
        notificationsUri: 'http://dummy.uri',
        hotelAddress: '0xdummyAddress',
        remoteId: 'xxx',
        token: token,
      });
    });
    it('should return the correct message and dispatch a message to the worker queue', (done) => {
      const queue = Queue.get();
      queue.enqueue.resetHistory();
      request(server)
        .post(`/notifications/${token}`)
        .send({
          wtIndex: '0xdummyIndex',
          resourceType: 'hotel',
          resourceAddress: '0xdummyAddress',
          scope: {
            action: 'update',
            subjects: ['ratePlans'],
          },
        })
        .expect(200, 'notification accepted')
        .expect('content-type', /text\/plain/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          try {
            assert.deepEqual(queue.enqueue.args, [
              [{
                type: 'syncHotel',
                payload: { hotelAddress: '0xdummyAddress' },
              }],
            ]);
            done();
          } catch (err) {
            done(err);
          }
        });
    });

    it('should return HTTP 400 if the notification format is invalid', (done) => {
      request(server)
        .post(`/notifications/${token}`)
        .send({ dummy: 'dummy' })
        .expect(400)
        .end(done);
    });

    it('should return 401 if subscription token is invalid', (done) => {
      const queue = Queue.get();
      queue.enqueue.resetHistory();
      request(server)
        .post('/notifications/invalid')
        .send({
          wtIndex: '0xdummyIndex',
          resourceType: 'hotel',
          resourceAddress: '0xdummyAddress',
          scope: {
            action: 'update',
            subjects: ['ratePlans'],
          },
        })
        .expect(401)
        .end(done);
    });

    it('should return 401 if hotel address does not match the token', (done) => {
      const queue = Queue.get();
      queue.enqueue.resetHistory();
      request(server)
        .post(`/notifications/${token}`)
        .send({
          wtIndex: '0xdummyIndex',
          resourceType: 'hotel',
          resourceAddress: '0xanotherHotel',
          scope: {
            action: 'update',
            subjects: ['ratePlans'],
          },
        })
        .expect(401)
        .end(done);
    });
  });
});
