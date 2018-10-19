const { assert } = require('chai');

const { validateFilter, ValidationError } = require('../../../src/services/validators');

describe('validators', function () {
  describe('validateFilter', () => {
    let filter;
    beforeEach(() => {
      filter = [
        {
          'type': 'location',
          'condition': { lat: 10, lng: 10, distance: 20 },
        },
        {
          'type': 'location',
          'condition': { lat: 9.8, lng: 9.8, distance: 40 },
        },
      ];
    });

    it('should pass when the data is correct', () => {
      validateFilter(filter);
    });

    it('should fail when a required attribute is missing', () => {
      delete filter[0].type;
      assert.throws(() => validateFilter(filter), ValidationError);
    });

    it('should fail when an unknown attribute is present', () => {
      filter[0].religion = 'pagan';
      assert.throws(() => validateFilter(filter), ValidationError);
    });

    it('should fail when non-sense lat / long is specified', () => {
      filter[0].condition.lng = 1000;
      assert.throws(() => validateFilter(filter), ValidationError);
    });
  });
});
