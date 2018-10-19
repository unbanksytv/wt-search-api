const { assert } = require('chai');

const { getFilters, QueryParseError } = require('../../src/services/query-parser');

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
});
