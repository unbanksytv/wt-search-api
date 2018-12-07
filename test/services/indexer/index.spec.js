const { assert } = require('chai');

const { resetDB } = require('../../../src/db/indexed');
const Location = require('../../../src/db/indexed/models/location');
const byLocation = require('../../../src/services/indexer/indices/by-location');
const Indexer = require('../../../src/services/indexer');

describe('services.indexer.index', () => {
  const indexer = new Indexer();
  beforeEach(async () => {
    await resetDB();
    await Location.upsert('0xdummy0', 10, 10);
    await Location.upsert('0xdummy1', 11, 11);
    await Location.upsert('0xdummy2', 12, 12);
    await Location.upsert('0xdummy3', 13, 13);
    await Location.upsert('0xdummy4', 14, 14);
  });

  describe('_getHotelAddresses', () => {
    it('should return addresses based on the filtering conditions', async () => {
      const filter = byLocation._getFilter(11.01, 11.01, 10),
        addresses = await indexer._getHotelAddresses(99, undefined, [filter]);
      assert.deepEqual(addresses, [{ address: '0xdummy1' }]);
    });

    it('should sort addresses based on the sorting condition', async () => {
      const sorting = byLocation._getSorting(13.01, 13.01),
        addresses = await indexer._getHotelAddresses(99, undefined, undefined, sorting);
      assert.deepEqual(addresses.map((x) => x.address), [
        '0xdummy3',
        '0xdummy4',
        '0xdummy2',
        '0xdummy1',
        '0xdummy0',
      ]);
    });

    it('should provide a score that was used for sorting', async () => {
      const sorting = byLocation._getSorting(13.01, 13.01),
        addresses = await indexer._getHotelAddresses(99, undefined, undefined, sorting),
        scores = addresses.map((x) => x.score);
      for (let i = 0; i < scores.length; i++) {
        assert.propertyVal(scores[i], 'name', 'distance');
        assert.isOk(scores[i].value);
        if (i > 0) {
          assert.isAtLeast(scores[i].value, scores[i - 1].value);
        }
      }
    });

    it('should allow a combination of multiple filters', async () => {
      const filter1 = byLocation._getFilter(11.5, 11.5, 120),
        filter2 = byLocation._getFilter(12.5, 12.5, 120);
      let addresses = await indexer._getHotelAddresses(99, undefined, [filter1]);
      assert.deepEqual(addresses.map((x) => x.address), ['0xdummy1', '0xdummy2']);
      addresses = await indexer._getHotelAddresses(99, undefined, [filter2]);
      assert.deepEqual(addresses.map((x) => x.address), ['0xdummy2', '0xdummy3']);
      addresses = await indexer._getHotelAddresses(99, undefined, [filter1, filter2]);
      assert.deepEqual(addresses.map((x) => x.address), ['0xdummy2']);
    });

    it('should allow a combination of filtering and sorting', async () => {
      const filter = byLocation._getFilter(11.5, 11.5, 120),
        sorting = byLocation._getSorting(20, 20),
        addresses = await indexer._getHotelAddresses(99, undefined, [filter], sorting);
      assert.deepEqual(addresses.map((x) => x.address), ['0xdummy2', '0xdummy1']);
      assert.property(addresses[0], 'score');
      assert.propertyVal(addresses[0].score, 'name', 'distance');
      assert.property(addresses[0].score, 'value');
    });

    it('should support pagination', async () => {
      const sorting = byLocation._getSorting(20, 20),
        addresses = await indexer._getHotelAddresses(2, '0xdummy3', undefined, sorting);
      assert.deepEqual(addresses.map((x) => x.address), ['0xdummy3', '0xdummy2']);
    });
  });

  describe('lookup', () => {
    it('should return addresses based on the query', async () => {
      const query = {
          filters: [
            {
              type: 'location',
              condition: { lat: 11.5, lng: 11.5, distance: 120 },
            },
          ],
          sorting: {
            type: 'distance',
            data: { lat: 20, lng: 20 },
          },
        },
        addresses = await indexer.lookup(query, 100);
      assert.deepEqual(addresses.map((x) => x.address), ['0xdummy2', '0xdummy1']);
      assert.property(addresses[0], 'score');
      assert.propertyVal(addresses[0].score, 'name', 'distance');
      assert.property(addresses[0].score, 'value');
    });

    it('should support pagination', async () => {
      const query = {
          filters: [
            {
              type: 'location',
              condition: { lat: 11.5, lng: 11.5, distance: 200 },
            },
          ],
          sorting: {
            type: 'distance',
            data: { lat: 20, lng: 20 },
          },
        },
        addresses = await indexer.lookup(query, 2, '0xdummy2');
      assert.deepEqual(addresses.map((x) => x.address), ['0xdummy2', '0xdummy1']);
      assert.property(addresses[0], 'score');
      assert.propertyVal(addresses[0].score, 'name', 'distance');
      assert.property(addresses[0].score, 'value');
    });
  });
});
