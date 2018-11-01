/* eslint-env mocha */
/* eslint-disable promise/no-callback-in-promise */
const { assert } = require('chai');
const request = require('supertest');

const { resetDB } = require('../../src/db');
const Location = require('../../src/db/indexed/models/location');
const HotelModel = require('../../src/db/permanent/models/hotel');

describe('controllers - hotels', function () {
  let server;

  before(async () => {
    server = require('../../src/index');
    await resetDB();
    await Location.upsert('0xdummy1', 41, 10);
    await Location.upsert('0xdummy2', 41.5, 10);
    await Location.upsert('0xdummy3', 42, 10);
    await Location.upsert('0xdummy4', 42.5, 10);
    await HotelModel.upsert([
      { address: '0xdummy1', partName: 'description', rawData: { name: 'dummy1' } },
      { address: '0xdummy2', partName: 'description', rawData: { name: 'dummy2' } },
      { address: '0xdummy3', partName: 'description', rawData: { name: 'dummy3' } },
      { address: '0xdummy4', partName: 'description', rawData: { name: 'dummy4' } },
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
            assert.deepEqual(res.body, {
              items: [
                { id: '0xdummy1', name: 'dummy1' },
                { id: '0xdummy2', name: 'dummy2' },
                { id: '0xdummy3', name: 'dummy3' },
                { id: '0xdummy4', name: 'dummy4' },
              ],
            });
            done();
          } catch (err) {
            done(err);
          }
        });
    });

    it('should support pagination', (done) => {
      request(server)
        .get('/hotels?limit=2&startWith=0xdummy2')
        .expect(200)
        .expect('content-type', /application\/json/)
        .end(async (err, res) => {
          if (err) return done(err);
          try {
            assert.deepEqual(res.body, {
              items: [
                { id: '0xdummy2', name: 'dummy2' },
                { id: '0xdummy3', name: 'dummy3' },
              ],
              next: 'http://localhost:1918/hotels?limit=2&startWith=0xdummy4',
            });
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
            assert.deepEqual(res.body, {
              items: [
                { id: '0xdummy2', name: 'dummy2' },
                { id: '0xdummy1', name: 'dummy1' },
              ],
            });
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

    it('should return HTTP 400 when pagination parameters do not make sense', (done) => {
      request(server)
        .get('/hotels?limit=dummy')
        .expect(400)
        .end(done);
    });
  });
});
