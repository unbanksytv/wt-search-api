const { assert } = require('chai');

const { getFilters, getSort, QueryParseError, MAX_DISTANCE } = require('../../src/services/query-parser');

describe('query-parser', function () {
  describe('getFilters', () => {
    it('should return the parsed filter definition when the data is correct', () => {
      const filter = [
          { type: 'location', condition: { lat: 10, lng: 20, distance: 30 } },
        ],
        query = { location: '10,20:30' },
        parsed = getFilters(query);
      assert.deepEqual(parsed, filter);
    });

    it('should return multiple filters if applicable', () => {
      const filter = [
          { type: 'location', condition: { lat: 10, lng: 20, distance: 30 } },
          { type: 'location', condition: { lat: 11, lng: 21, distance: 160 } },
        ],
        query = { location: ['10,20:30', '11,21:160'] },
        parsed = getFilters(query);
      assert.deepEqual(parsed, filter);
    });

    it('should return undefined if no filter is specified in the query', () => {
      const query = {},
        parsed = getFilters(query);
      assert.equal(parsed, undefined);
    });

    it('should fail when the filter definition is wrong', () => {
      const query = { location: 'dummy' };
      assert.throws(() => getFilters(query), QueryParseError);
    });

    it('should fail when the lat / long are nonsensical', () => {
      const query = { location: '1000,20:30' };
      assert.throws(() => getFilters(query), QueryParseError);
    });

    it('should fail when the distance is too large', () => {
      const query = { location: `1000,20:${2 * MAX_DISTANCE}` };
      assert.throws(() => getFilters(query), QueryParseError);
    });
  });

  describe('getSort', () => {
    it('should return the parsed sorting definition when the data is correct', () => {
      const sort = { type: 'location', data: { lat: 10, lng: 20 } },
        query = { sortByLocation: '10,20' },
        parsed = getSort(query);
      assert.deepEqual(parsed, sort);
    });

    it('should return undefined if no sorting is specified in the query', () => {
      const query = {},
        parsed = getSort(query);
      assert.equal(parsed, undefined);
    });

    it('should fail when the sorting definition is wrong', () => {
      const query = { sortByLocation: 'dummy' };
      assert.throws(() => getSort(query), QueryParseError);
    });

    it('should fail when the lat / long are nonsensical', () => {
      const query = { sortByLocation: '1000,20' };
      assert.throws(() => getSort(query), QueryParseError);
    });

    it('should fail when multiple sorts are presented', () => {
      const query = { sortByLocation: ['10,20', '20,30'] };
      assert.throws(() => getSort(query), QueryParseError);
    });
  });
});
