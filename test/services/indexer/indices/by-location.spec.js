const { assert } = require('chai');

const { db } = require('../../../../src/config');
const { resetDB } = require('../../../../src/db/indexed');
const byLocation = require('../../../../src/services/indexer/indices/by-location');
const Location = require('../../../../src/db/indexed/models/location');

describe('indices.by-location', () => {
  describe('_convertKilometersToDegrees', () => {
    // These test cases have been created using a map.
    it('should approximately convert kilometers to degrees for short distances', async () => {
      const distances = byLocation._convertKilometersToDegrees(50.386, 14.289, 2);
      let expected = 0.028;
      assert.approximately(distances.lng, expected, expected / 100);
    });

    it('should approximately convert kilometers to degrees for midsized distances', async () => {
      const distances = byLocation._convertKilometersToDegrees(50.386, 14.289, 20);
      let expected = 0.282;
      assert.approximately(distances.lng, expected, expected / 100);
    });

    it('should work well in the southern hemisphere', async () => {
      const distances = byLocation._convertKilometersToDegrees(-50.386, 14.289, 20);
      let expected = 0.282;
      assert.approximately(distances.lng, expected, expected / 10);
    });

    it('should work well in the eastern hemisphere', async () => {
      const distances = byLocation._convertKilometersToDegrees(50.386, -14.289, 20);
      let expected = 0.282;
      assert.approximately(distances.lng, expected, expected / 10);
    });
  });

  describe('_getFilter', () => {
    beforeEach(async () => {
      await resetDB();
    });

    it('should return a working filter representation', async () => {
      const kladno = {
        lat: 50.1426281,
        lng: 14.1131347,
      };
      await Location.upsert('0xberoun', 49.9645147, 14.0650694);
      await Location.upsert('0xpraha', 50.0682006, 14.4180053);
      await Location.upsert('0xberlin', 52.5137886, 13.4202919);

      // Filter out all locations under 30 km from Kladno.
      const filter = byLocation._getFilter(kladno.lat, kladno.lng, 30),
        results = await db(filter.table).where(filter.condition).select('hotel_address');
      assert.deepEqual(results, [
        { 'hotel_address': '0xberoun' },
        { 'hotel_address': '0xpraha' },
      ]);
    });
  });

  describe('_getSorting', () => {
    beforeEach(async () => {
      await resetDB();
    });

    it('should return a working sorting representation', async () => {
      const kladno = {
        lat: 50.1426281,
        lng: 14.1131347,
      };
      await Location.upsert('0xpraha', 50.0682006, 14.4180053);
      await Location.upsert('0xvladivostok', 43.1125328, 131.9291211);
      await Location.upsert('0xparis', 48.8576236, 2.3375003);
      await Location.upsert('0xberlin', 52.5137886, 13.4202919);
      await Location.upsert('0xslany', 50.2317808, 14.0844553);
      await Location.upsert('0xlondon', 51.4973892, 0.1053164);

      // Sort by distance from Kladno.
      const sorting = byLocation._getSorting(kladno.lat, kladno.lng),
        results = await db(sorting.table).select(sorting.select).orderBy(sorting.columnName).select('hotel_address');
      assert.deepEqual(results.map((x) => x.hotel_address), [
        '0xslany',
        '0xpraha',
        '0xberlin',
        '0xparis',
        '0xlondon',
        '0xvladivostok',
      ]);
    });
  });
});
