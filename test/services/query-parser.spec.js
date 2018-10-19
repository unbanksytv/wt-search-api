const { assert } = require('chai');

const { getFilters, getSort, QueryParseError } = require('../../src/services/query-parser');

describe('query-parser', function () {
  describe('getFilters', () => {
    it('should return the parsed filter definition when the data is correct', () => {
      const filter = [
          { type: 'location', condition: { lat: 10, lng: 10, distance: 10 } },
        ],
        query = { filter: JSON.stringify(filter) },
        parsed = getFilters(query);
      assert.deepEqual(parsed, filter);
    });

    it('should return undefined if no filter is specified in the query', () => {
      const query = {},
        parsed = getFilters(query);
      assert.equal(parsed, undefined);
    });

    it('should fail when the filter definition is wrong', () => {
      const filter = [
          { type: 'location', condition: { dummy: 'dummy' } },
        ],
        query = { filter: JSON.stringify(filter) };
      assert.throws(() => getFilters(query), QueryParseError);
    });

    it('should fail when the filter is not properly json-encoded', () => {
      const query = { filter: 'dummy' };
      assert.throws(() => getFilters(query), QueryParseError);
    });
  });

  describe('getSort', () => {
    it('should return the parsed sorting definition when the data is correct', () => {
      const sort = { type: 'location', data: { lat: 10, lng: 10 } },
        query = { sort: JSON.stringify(sort) },
        parsed = getSort(query);
      assert.deepEqual(parsed, sort);
    });

    it('should return undefined if no sorting is specified in the query', () => {
      const query = {},
        parsed = getSort(query);
      assert.equal(parsed, undefined);
    });

    it('should fail when the sorting definition is wrong', () => {
      const sort = { type: 'location', condition: { dummy: 'dummy' } },
        query = { sort: JSON.stringify(sort) };
      assert.throws(() => getSort(query), QueryParseError);
    });

    it('should fail when the sorting is not properly json-encoded', () => {
      const query = { sort: 'dummy' };
      assert.throws(() => getSort(query), QueryParseError);
    });
  });
});
