/* eslint-env mocha */
const { assert } = require('chai');
const nock = require('nock');
const { Fetcher, FetcherInitializationError, DESCRIPTION_FIELDS } = require('../../../src/services/crawler/fetcher');
const hotelData = require('../../utils/test-data');

describe('services.crawler.fetcher', () => {
  describe('initalization', () => {
    it('should throw when options are not passed', () => {
      assert.throws(() => new Fetcher(), /is required in options/i);
      assert.throws(() => new Fetcher(), FetcherInitializationError);
    });

    it('should throw when readApiUrl is not passed in options', () => {
      assert.throws(() => new Fetcher({}), /is required in options/i);
      assert.throws(() => new Fetcher({}), FetcherInitializationError);
    });

    it('should overwrite default options', () => {
      const fetcher = new Fetcher({
        readApiUrl: 'https://example.com',
        limit: 150,
        timeout: 3500,
      });
      assert.equal(fetcher.config.limit, 150);
      assert.equal(fetcher.config.timeout, 3500);
      assert.equal(fetcher.config.readApiUrl, 'https://example.com');
    });
  });

  describe('fetchHotelList', () => {
    const readApiUrl = 'https://read-api.wt.com',
      limit = 5;
    let fetcher;

    beforeEach(() => {
      fetcher = new Fetcher({
        readApiUrl,
        limit,
      });
    });

    it('should get a list of ids from readApiUrl', async () => {
      nock(readApiUrl)
        .get(`/hotels?limit=${limit}&fields=id`)
        .reply(200, {
          items: [
            { id: '0xdummy1' },
            { id: '0xdummy2' },
          ],
        });
      const result = await fetcher.fetchHotelList();
      assert.equal(result.ids.length, 2);
      assert.equal(result.ids[0], '0xdummy1');
      assert.equal(result.ids[1], '0xdummy2');
      assert.equal(result.next, undefined);
    });

    it('should automatically resolve next if present', async () => {
      nock(readApiUrl)
        .get(`/hotels?limit=${limit}&fields=id`)
        .reply(200, {
          items: [
            { id: '0xdummy1' },
            { id: '0xdummy2' },
            { id: '0xdummy3' },
            { id: '0xdummy4' },
            { id: '0xdummy5' },
          ],
          next: `${readApiUrl}/hotels?limit=${limit}&fields=id&startWith=0xdummy6`,
        });
      nock(readApiUrl)
        .get(`/hotels?limit=${limit}&fields=id&startWith=0xdummy6`)
        .reply(200, {
          items: [
            { id: '0xdummy6' },
            { id: '0xdummy7' },
          ],
        });
      const result = await fetcher.fetchHotelList();
      assert.equal(result.ids.length, 7);
      assert.equal(result.ids[0], '0xdummy1');
      assert.equal(result.ids[1], '0xdummy2');
      assert.equal(result.ids[2], '0xdummy3');
      assert.equal(result.ids[3], '0xdummy4');
      assert.equal(result.ids[4], '0xdummy5');
      assert.equal(result.ids[5], '0xdummy6');
      assert.equal(result.ids[6], '0xdummy7');
      assert.equal(result.next, undefined);
    });

    it('should get a list of errors from readApiUrl', async () => {
      nock(readApiUrl)
        .get(`/hotels?limit=${limit}&fields=id`)
        .reply(200, {
          items: [
            { id: '0xdummy1' },
            { id: '0xdummy2' },
          ],
          errors: [
            { data: { id: '0xerror1' } },
            { data: { id: '0xerror2' } },
          ],
        });
      const result = await fetcher.fetchHotelList();
      assert.equal(result.ids.length, 2);
      assert.equal(result.errors.length, 2);
      assert.equal(result.errors[0], '0xerror1');
      assert.equal(result.errors[1], '0xerror2');
      assert.equal(result.next, undefined);
    });

    it('should pass on lists if next is present', async () => {
      nock(readApiUrl)
        .get(`/hotels?limit=${limit}&fields=id`)
        .reply(200, {
          items: [
            { id: '0xdummy1' },
            { id: '0xdummy2' },
            { id: '0xdummy3' },
            { id: '0xdummy4' },
            { id: '0xdummy5' },
          ],
          errors: [
            { data: { id: '0xerror1' } },
            { data: { id: '0xerror2' } },
          ],
          next: `${readApiUrl}/hotels?limit=${limit}&fields=id&startWith=0xdummy6`,
        });
      nock(readApiUrl)
        .get(`/hotels?limit=${limit}&fields=id&startWith=0xdummy6`)
        .reply(200, {
          items: [
            { id: '0xdummy6' },
            { id: '0xdummy7' },
          ],
          errors: [
            { data: { id: '0xerror3' } },
            { data: { id: '0xerror4' } },
          ],
        });
      const result = await fetcher.fetchHotelList();
      assert.equal(result.ids.length, 7);
      assert.equal(result.errors.length, 4);
      assert.equal(result.errors[0], '0xerror1');
      assert.equal(result.errors[1], '0xerror2');
      assert.equal(result.errors[2], '0xerror3');
      assert.equal(result.errors[3], '0xerror4');
      assert.equal(result.next, undefined);
    });

    it('should call an url from an argument', async () => {
      nock(readApiUrl)
        .get(`/hotels?limit=${limit}&fields=id&startWith=0xdummy6`)
        .reply(200, {
          items: [
            { id: '0xdummy6' },
            { id: '0xdummy7' },
          ],
        });
      const result = await fetcher.fetchHotelList(undefined, `${readApiUrl}/hotels?limit=${limit}&fields=id&startWith=0xdummy6`);
      assert.equal(result.ids.length, 2);
      assert.equal(result.ids[0], '0xdummy6');
      assert.equal(result.ids[1], '0xdummy7');
      assert.equal(result.next, undefined);
    });

    it('should throw if url in an argument is weird', async () => {
      try {
        await fetcher.fetchHotelList(undefined, 'https://google.com/look-for-travel');
        throw new Error('should not have been called');
      } catch (e) {
        assert.match(e.message, /does not look like hotels list/i);
      }
    });

    it('should respect maxPages', async () => {
      nock(readApiUrl)
        .get(`/hotels?limit=${limit}&fields=id`)
        .reply(200, {
          items: [
            { id: '0xdummy1' },
            { id: '0xdummy2' },
            { id: '0xdummy3' },
            { id: '0xdummy4' },
            { id: '0xdummy5' },
          ],
          next: `${readApiUrl}/hotels?limit=${limit}&fields=id&startWith=0xdummy6`,
        });
      nock(readApiUrl)
        .get(`/hotels?limit=${limit}&fields=id&startWith=0xdummy6`)
        .reply(200, {
          items: [
            { id: '0xdummy6' },
            { id: '0xdummy7' },
            { id: '0xdummy8' },
            { id: '0xdummy9' },
            { id: '0xdummy10' },
          ],
          next: `${readApiUrl}/hotels?limit=${limit}&fields=id&startWith=0xdummy11`,
        });
      nock(readApiUrl)
        .get(`/hotels?limit=${limit}&fields=id&startWith=0xdummy11`)
        .reply(200, {
          items: [
            { id: '0xdummy11' },
            { id: '0xdummy12' },
            { id: '0xdummy13' },
            { id: '0xdummy14' },
            { id: '0xdummy15' },
          ],
        });
      const result = await fetcher.fetchHotelList(2);
      assert.equal(result.ids.length, 10);
      assert.equal(result.ids[0], '0xdummy1');
      assert.equal(result.ids[1], '0xdummy2');
      assert.equal(result.ids[2], '0xdummy3');
      assert.equal(result.ids[3], '0xdummy4');
      assert.equal(result.ids[4], '0xdummy5');
      assert.equal(result.ids[5], '0xdummy6');
      assert.equal(result.ids[6], '0xdummy7');
      assert.equal(result.ids[7], '0xdummy8');
      assert.equal(result.ids[8], '0xdummy9');
      assert.equal(result.ids[9], '0xdummy10');
      assert.equal(result.next, `${readApiUrl}/hotels?limit=${limit}&fields=id&startWith=0xdummy11`);
    });

    it('should throw on non-success from readApiUrl', async () => {
      nock(readApiUrl)
        .get(`/hotels?limit=${limit}&fields=id`)
        .reply(500);
      try {
        await fetcher.fetchHotelList();
        throw new Error('should not have been called');
      } catch (e) {
        assert.match(e.message, /responded with 500/i);
      }
    });

    it('should throw on unknown data format from readApiUrl', async () => {
      nock(readApiUrl)
        .get(`/hotels?limit=${limit}&fields=id`)
        .reply(200, {
          hotels: [],
        });
      try {
        await fetcher.fetchHotelList();
        throw new Error('should not have been called');
      } catch (e) {
        assert.match(e.message, /did not respond with items list/i);
      }
    });
  });

  describe('fetchDataUris', () => {
    const readApiUrl = 'https://read-api.wt.com',
      hotelId = '0xc2954b66EB27A20c936A3D8F2365FE9349472663';
    let fetcher;

    beforeEach(() => {
      fetcher = new Fetcher({
        readApiUrl,
      });
    });

    it('should return dataUris object', async () => {
      nock(readApiUrl)
        .get(`/hotels/${hotelId}/dataUris`)
        .reply(200, {
          address: '0xc2954b66EB27A20c936A3D8F2365FE9349472663',
          dataUri: 'https://jirkachadima.cz/wt/http/index.json',
          descriptionUri: 'https://jirkachadima.cz/wt/http/description.json',
          ratePlansUri: 'https://jirkachadima.cz/wt/http/rate-plans.json',
          availabilityUri: 'https://jirkachadima.cz/wt/http/availability.json',
        });
      const result = await fetcher.fetchDataUris(hotelId);
      assert.equal(result.address, '0xc2954b66EB27A20c936A3D8F2365FE9349472663');
      assert.equal(result.dataUri, 'https://jirkachadima.cz/wt/http/index.json');
      assert.equal(result.descriptionUri, 'https://jirkachadima.cz/wt/http/description.json');
      assert.equal(result.ratePlansUri, 'https://jirkachadima.cz/wt/http/rate-plans.json');
      assert.equal(result.availabilityUri, 'https://jirkachadima.cz/wt/http/availability.json');
    });

    it('should throw when hotelId is not passed', async () => {
      try {
        await fetcher.fetchDataUris();
        throw new Error('should have never been called');
      } catch (e) {
        assert.match(e.message, /hotelId is required/i);
      }
    });

    it('should throw on non-success response', async () => {
      nock(readApiUrl)
        .get(`/hotels/${hotelId}/dataUris`)
        .reply(502);
      try {
        await fetcher.fetchDataUris(hotelId);
        throw new Error('should have never been called');
      } catch (e) {
        assert.match(e.message, /responded with 502/i);
      }
    });
  });

  describe('fetchDesciption', () => {
    const readApiUrl = 'https://read-api.wt.com',
      hotelId = '0xc2954b66EB27A20c936A3D8F2365FE9349472663';
    let fetcher;

    beforeEach(() => {
      fetcher = new Fetcher({
        readApiUrl,
      });
    });

    it('should return description object', async () => {
      nock(readApiUrl)
        .get(`/hotels/${hotelId}?fields=${DESCRIPTION_FIELDS.join(',')}`)
        .reply(200, hotelData.DESCRIPTION);
      const result = await fetcher.fetchDescription(hotelId);
      assert.deepEqual(result, hotelData.DESCRIPTION);
    });

    it('should throw when hotelId is not passed', async () => {
      try {
        await fetcher.fetchDescription();
        throw new Error('should have never been called');
      } catch (e) {
        assert.match(e.message, /hotelId is required/i);
      }
    });

    it('should throw on non-success response', async () => {
      nock(readApiUrl)
        .get(`/hotels/${hotelId}?fields=${DESCRIPTION_FIELDS.join(',')}`)
        .reply(502);
      try {
        await fetcher.fetchDescription(hotelId);
        throw new Error('should have never been called');
      } catch (e) {
        assert.match(e.message, /responded with 502/i);
      }
    });
  });

  describe('fetchRatePlans', () => {
    const readApiUrl = 'https://read-api.wt.com',
      hotelId = '0xc2954b66EB27A20c936A3D8F2365FE9349472663';
    let fetcher;

    beforeEach(() => {
      fetcher = new Fetcher({
        readApiUrl,
      });
    });

    it('should return description object', async () => {
      nock(readApiUrl)
        .get(`/hotels/${hotelId}/ratePlans`)
        .reply(200, hotelData.RATE_PLANS);
      const result = await fetcher.fetchRatePlans(hotelId);
      assert.deepEqual(result, hotelData.RATE_PLANS);
    });

    it('should throw when hotelId is not passed', async () => {
      try {
        await fetcher.fetchRatePlans();
        throw new Error('should have never been called');
      } catch (e) {
        assert.match(e.message, /hotelId is required/i);
      }
    });

    it('should throw on non-success response', async () => {
      nock(readApiUrl)
        .get(`/hotels/${hotelId}/ratePlans`)
        .reply(502);
      try {
        await fetcher.fetchRatePlans(hotelId);
        throw new Error('should have never been called');
      } catch (e) {
        assert.match(e.message, /responded with 502/i);
      }
    });
  });

  describe('fetchAvailability', () => {
    const readApiUrl = 'https://read-api.wt.com',
      hotelId = '0xc2954b66EB27A20c936A3D8F2365FE9349472663';
    let fetcher;

    beforeEach(() => {
      fetcher = new Fetcher({
        readApiUrl,
      });
    });

    it('should return description object', async () => {
      nock(readApiUrl)
        .get(`/hotels/${hotelId}/availability`)
        .reply(200, hotelData.AVAILABILITY);
      const result = await fetcher.fetchAvailability(hotelId);
      assert.deepEqual(result, hotelData.AVAILABILITY);
    });

    it('should throw when hotelId is not passed', async () => {
      try {
        await fetcher.fetchAvailability();
        throw new Error('should have never been called');
      } catch (e) {
        assert.match(e.message, /hotelId is required/i);
      }
    });

    it('should throw on non-success response', async () => {
      nock(readApiUrl)
        .get(`/hotels/${hotelId}/availability`)
        .reply(502);
      try {
        await fetcher.fetchAvailability(hotelId);
        throw new Error('should have never been called');
      } catch (e) {
        assert.match(e.message, /responded with 502/i);
      }
    });
  });
});
