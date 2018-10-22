/* eslint-env mocha */
/* eslint-disable promise/no-callback-in-promise */
const { assert } = require('chai');
const request = require('supertest');

const { resetDB } = require('../../src/db');
const Location = require('../../src/db/indexed/models/location');
const HotelModel = require('../../src/db/permanent/models/hotel');

describe('controllers - hotel', function () {
  let server;

  before(async () => {
    server = require('../../src/index');
    await resetDB();
    await Location.upsert('0xdummy1', 41, 10);
    await Location.upsert('0xdummy2', 41.5, 10);
    await Location.upsert('0xdummy3', 42, 10);
    await Location.upsert('0xdummy4', 42.5, 10);
    await HotelModel.create([
      { address: '0xdummy1', partName: 'description', rawData: { } },
      { address: '0xdummy2', partName: 'description', rawData: { } },
      { address: '0xdummy3', partName: 'description', rawData: { } },
      { address: '0xdummy4', partName: 'description', rawData: { } },
    ]);
  });

  after(() => {
    server.close();
  });

  describe('GET /hotels', () => {
    it('should return the full list of hotels if no criteria is specified', (done) => {
      request(server)
        .get('/hotels')
        .expect(200)
        .expect('content-type', /application\/json/)
        .end(async (err, res) => {
          if (err) return done(err);
          try {
            assert.equal(res.body.length, 4);
            assert.deepEqual(res.body, ['0xdummy1', '0xdummy2', '0xdummy3', '0xdummy4']);
            done();
          } catch (err) {
            done(err);
          }
        });
    });

    it('should return a list of hotels based on filtering and sorting criteria', (done) => {
      request(server)
        .get('/hotels?location=40.5,10:120&sortByDistance=50,10')
        .expect(200)
        .expect('content-type', /application\/json/)
        .end(async (err, res) => {
          if (err) return done(err);
          try {
            assert.equal(res.body.length, 2);
            assert.deepEqual(res.body, ['0xdummy2', '0xdummy1']);
            done();
          } catch (err) {
            done(err);
          }
        });
    });

    it('should return HTTP 400 when filtering and sorting criteria do not make sense', (done) => {
      request(server)
        .get('/hotels?location=dummy&sortByDistance=dummy')
        .expect(400)
        .end(done);
    });
  });
});
