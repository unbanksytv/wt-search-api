const { assert } = require('chai');

const { resetDB } = require('../../../src/db/indexed');
const Location = require('../../../src/db/indexed/models/location');
const byLocation = require('../../../src/services/indexer/indices/by-location');
const Indexer = require('../../../src/services/indexer');

describe('services.indexer.index', () => {
  describe('_getHotelAddresses', () => {
    const indexer = new Indexer();
    beforeEach(async () => {
      await resetDB();
      await Location.upsert('0xdummy0', 10, 10);
      await Location.upsert('0xdummy1', 11, 11);
      await Location.upsert('0xdummy2', 12, 12);
      await Location.upsert('0xdummy3', 13, 13);
      await Location.upsert('0xdummy4', 14, 14);
    });

    it('should return addresses based on the filtering conditions', async () => {
      const filter = byLocation._getFilter(11.01, 11.01, 10),
        addresses = await indexer._getHotelAddresses([filter]);
      assert.deepEqual(addresses, ['0xdummy1']);
    });

    it('should sort addresses based on the sorting condition', async () => {
      const sorting = byLocation._getSorting(13.01, 13.01),
        addresses = await indexer._getHotelAddresses(undefined, sorting);
      assert.deepEqual(addresses, [
        '0xdummy3',
        '0xdummy4',
        '0xdummy2',
        '0xdummy1',
        '0xdummy0',
      ]);
    });

    it('should allow a combination of multiple filters', async () => {
      const filter1 = byLocation._getFilter(11.5, 11.5, 120),
        filter2 = byLocation._getFilter(12.5, 12.5, 120);
      let addresses = await indexer._getHotelAddresses([filter1]);
      assert.deepEqual(addresses, ['0xdummy1', '0xdummy2']);
      addresses = await indexer._getHotelAddresses([filter2]);
      assert.deepEqual(addresses, ['0xdummy2', '0xdummy3']);
      addresses = await indexer._getHotelAddresses([filter1, filter2]);
      assert.deepEqual(addresses, ['0xdummy2']);
    });

    it('should allow a combination of filtering and sorting', async () => {
      const filter = byLocation._getFilter(11.5, 11.5, 120),
        sorting = byLocation._getSorting(20, 20),
        addresses = await indexer._getHotelAddresses([filter], sorting);
      assert.deepEqual(addresses, ['0xdummy2', '0xdummy1']);
    });
  });

  describe('lookup', () => {
    const indexer = new Indexer();

    beforeEach(async () => {
      await resetDB();
      await Location.upsert('0xdummy0', 10, 10);
      await Location.upsert('0xdummy1', 11, 11);
      await Location.upsert('0xdummy2', 12, 12);
      await Location.upsert('0xdummy3', 13, 13);
      await Location.upsert('0xdummy4', 14, 14);
    });

    it('should return addresses based on the query', async () => {
      const query = {
          filters: [
            {
              type: 'location',
              condition: { lat: 11.5, lng: 11.5, distance: 120 },
            },
          ],
          sorting: {
            type: 'location',
            data: { lat: 20, lng: 20 },
          },
        },
        addresses = await indexer.lookup(query);
      assert.deepEqual(addresses, ['0xdummy2', '0xdummy1']);
    });
  });
});
