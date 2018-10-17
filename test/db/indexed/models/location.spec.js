const { assert } = require('chai');

const { db } = require('../../../../src/config');
const { resetDB } = require('../../../../src/db/indexed');
const Location = require('../../../../src/db/indexed/models/location');

describe('models.location', () => {
  describe('upsert', () => {
    beforeEach(async () => {
      await resetDB();
    });

    it('should create a new record if none exists', async () => {
      let records = await db(Location.TABLE).select('hotel_address', 'lat', 'lng');
      assert.deepEqual(records, []);
      await Location.upsert('0xdummy', 10, 10);
      records = await db(Location.TABLE).select('hotel_address', 'lat', 'lng');
      assert.deepEqual(records, [{
        'hotel_address': '0xdummy',
        'lat': 10,
        'lng': 10,
      }]);
    });

    it('should update the existing record if it exists', async () => {
      let records = await db(Location.TABLE).select('hotel_address', 'lat', 'lng');
      assert.deepEqual(records, []);
      await Location.upsert('0xdummy', 10, 10);
      await Location.upsert('0xdummy2', 20, 20);
      await Location.upsert('0xdummy', 30, 30);
      records = await db(Location.TABLE).select('hotel_address', 'lat', 'lng');
      assert.deepEqual(records, [
        {
          'hotel_address': '0xdummy',
          'lat': 30,
          'lng': 30,
        },
        {
          'hotel_address': '0xdummy2',
          'lat': 20,
          'lng': 20,
        },
      ]);
    });
  });
});
