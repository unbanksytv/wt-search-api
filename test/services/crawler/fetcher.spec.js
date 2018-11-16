const { assert } = require('chai');
const sinon = require('sinon');
const nock = require('nock');
const { readApiUrl } = require('../../../src/config');
const { Fetcher, DESCRIPTION_FIELDS } = require('../../../src/services/crawler/fetcher');
const hotelData = require('../../utils/test-data');

describe('services.crawler.fetcher', () => {
  describe('initalization', () => {
    it('should overwrite default options', () => {
      const fetcher = new Fetcher({
        limit: 150,
        timeout: 3500,
      });
      assert.equal(fetcher.config.limit, 150);
      assert.equal(fetcher.config.timeout, 3500);
    });
  });

  describe('fetchHotelList', () => {
    const limit = 5;
    let fetcher;

    beforeEach(() => {
      fetcher = new Fetcher({
        limit,
      });
    });

    it('should get a list of addresses from readApiUrl', async () => {
      nock(readApiUrl)
        .get(`/hotels?limit=${limit}&fields=id`)
        .reply(200, {
          items: [
            { id: '0xdummy1' },
            { id: '0xdummy2' },
          ],
        });
      const result = await fetcher.fetchHotelList();
      assert.equal(result.addresses.length, 2);
      assert.equal(result.addresses[0], '0xdummy1');
      assert.equal(result.addresses[1], '0xdummy2');
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
      assert.equal(result.addresses.length, 7);
      assert.equal(result.addresses[0], '0xdummy1');
      assert.equal(result.addresses[1], '0xdummy2');
      assert.equal(result.addresses[2], '0xdummy3');
      assert.equal(result.addresses[3], '0xdummy4');
      assert.equal(result.addresses[4], '0xdummy5');
      assert.equal(result.addresses[5], '0xdummy6');
      assert.equal(result.addresses[6], '0xdummy7');
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
      assert.equal(result.addresses.length, 2);
      assert.equal(result.errors.length, 2);
      assert.equal(result.errors[0], '0xerror1');
      assert.equal(result.errors[1], '0xerror2');
      assert.equal(result.next, undefined);
    });

    it('should pass on to the next list if next is present', async () => {
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
      assert.equal(result.addresses.length, 7);
      assert.equal(result.errors.length, 4);
      assert.equal(result.errors[0], '0xerror1');
      assert.equal(result.errors[1], '0xerror2');
      assert.equal(result.errors[2], '0xerror3');
      assert.equal(result.errors[3], '0xerror4');
      assert.equal(result.next, undefined);
    });

    it('should use onEveryPage callback', async () => {
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
      const onEveryPageStub = sinon.stub().returns({});
      const result = await fetcher.fetchHotelList({ onEveryPage: onEveryPageStub });
      assert.equal(result.addresses.length, 7);
      assert.equal(result.errors.length, 4);
      assert.equal(result.errors[0], '0xerror1');
      assert.equal(result.errors[1], '0xerror2');
      assert.equal(result.errors[2], '0xerror3');
      assert.equal(result.errors[3], '0xerror4');
      assert.equal(result.next, undefined);
      assert.equal(onEveryPageStub.callCount, 2);
      assert.equal(onEveryPageStub.firstCall.args[0].addresses.length, 5);
      assert.equal(onEveryPageStub.firstCall.args[0].errors.length, 2);
      assert.equal(onEveryPageStub.secondCall.args[0].addresses.length, 2);
      assert.equal(onEveryPageStub.secondCall.args[0].errors.length, 2);
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
      const result = await fetcher.fetchHotelList({ url: `${readApiUrl}/hotels?limit=${limit}&fields=id&startWith=0xdummy6` });
      assert.equal(result.addresses.length, 2);
      assert.equal(result.addresses[0], '0xdummy6');
      assert.equal(result.addresses[1], '0xdummy7');
      assert.equal(result.next, undefined);
    });

    it('should throw if url in an argument is weird', async () => {
      try {
        await fetcher.fetchHotelList({ url: 'https://google.com/look-for-travel' });
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
      const result = await fetcher.fetchHotelList({ maxPages: 2 });
      assert.equal(result.addresses.length, 10);
      assert.equal(result.addresses[0], '0xdummy1');
      assert.equal(result.addresses[1], '0xdummy2');
      assert.equal(result.addresses[2], '0xdummy3');
      assert.equal(result.addresses[3], '0xdummy4');
      assert.equal(result.addresses[4], '0xdummy5');
      assert.equal(result.addresses[5], '0xdummy6');
      assert.equal(result.addresses[6], '0xdummy7');
      assert.equal(result.addresses[7], '0xdummy8');
      assert.equal(result.addresses[8], '0xdummy9');
      assert.equal(result.addresses[9], '0xdummy10');
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

  describe('fetchMeta', () => {
    const hotelAddress = '0xc2954b66EB27A20c936A3D8F2365FE9349472663';
    let fetcher;

    beforeEach(() => {
      fetcher = new Fetcher();
    });

    it('should return meta info object', async () => {
      nock(readApiUrl)
        .get(`/hotels/${hotelAddress}/meta`)
        .reply(200, {
          address: '0xc2954b66EB27A20c936A3D8F2365FE9349472663',
          dataUri: 'https://jirkachadima.cz/wt/http/index.json',
          descriptionUri: 'https://jirkachadima.cz/wt/http/description.json',
          ratePlansUri: 'https://jirkachadima.cz/wt/http/rate-plans.json',
          availabilityUri: 'https://jirkachadima.cz/wt/http/availability.json',
          dataFormatVersion: '0.1.0',
        });
      const result = await fetcher.fetchMeta(hotelAddress);
      assert.equal(result.address, '0xc2954b66EB27A20c936A3D8F2365FE9349472663');
      assert.equal(result.dataUri, 'https://jirkachadima.cz/wt/http/index.json');
      assert.equal(result.descriptionUri, 'https://jirkachadima.cz/wt/http/description.json');
      assert.equal(result.ratePlansUri, 'https://jirkachadima.cz/wt/http/rate-plans.json');
      assert.equal(result.availabilityUri, 'https://jirkachadima.cz/wt/http/availability.json');
      assert.equal(result.dataFormatVersion, '0.1.0');
    });

    it('should throw when hotelAddress is not passed', async () => {
      try {
        await fetcher.fetchMeta();
        throw new Error('should have never been called');
      } catch (e) {
        assert.match(e.message, /hotelAddress is required/i);
      }
    });

    it('should throw on non-success response', async () => {
      nock(readApiUrl)
        .get(`/hotels/${hotelAddress}/meta`)
        .reply(502);
      try {
        await fetcher.fetchMeta(hotelAddress);
        throw new Error('should have never been called');
      } catch (e) {
        assert.match(e.message, /responded with 502/i);
      }
    });
  });

  describe('fetchDesciption', () => {
    const hotelAddress = '0xc2954b66EB27A20c936A3D8F2365FE9349472663';
    let fetcher;

    beforeEach(() => {
      fetcher = new Fetcher();
    });

    it('should return description object', async () => {
      nock(readApiUrl)
        .get(`/hotels/${hotelAddress}?fields=${DESCRIPTION_FIELDS.join(',')}`)
        .reply(200, hotelData.DESCRIPTION);
      const result = await fetcher.fetchDescription(hotelAddress);
      assert.deepEqual(result, hotelData.DESCRIPTION);
    });

    it('should throw when hotelAddress is not passed', async () => {
      try {
        await fetcher.fetchDescription();
        throw new Error('should have never been called');
      } catch (e) {
        assert.match(e.message, /hotelAddress is required/i);
      }
    });

    it('should throw on non-success response', async () => {
      nock(readApiUrl)
        .get(`/hotels/${hotelAddress}?fields=${DESCRIPTION_FIELDS.join(',')}`)
        .reply(502);
      try {
        await fetcher.fetchDescription(hotelAddress);
        throw new Error('should have never been called');
      } catch (e) {
        assert.match(e.message, /responded with 502/i);
      }
    });
  });

  describe('fetchRatePlans', () => {
    const hotelAddress = '0xc2954b66EB27A20c936A3D8F2365FE9349472663';
    let fetcher;

    beforeEach(() => {
      fetcher = new Fetcher();
    });

    it('should return description object', async () => {
      nock(readApiUrl)
        .get(`/hotels/${hotelAddress}/ratePlans`)
        .reply(200, hotelData.RATE_PLANS);
      const result = await fetcher.fetchRatePlans(hotelAddress);
      assert.deepEqual(result, hotelData.RATE_PLANS);
    });

    it('should throw when hotelAddress is not passed', async () => {
      try {
        await fetcher.fetchRatePlans();
        throw new Error('should have never been called');
      } catch (e) {
        assert.match(e.message, /hotelAddress is required/i);
      }
    });

    it('should throw on non-success response', async () => {
      nock(readApiUrl)
        .get(`/hotels/${hotelAddress}/ratePlans`)
        .reply(502);
      try {
        await fetcher.fetchRatePlans(hotelAddress);
        throw new Error('should have never been called');
      } catch (e) {
        assert.match(e.message, /responded with 502/i);
      }
    });
  });

  describe('fetchAvailability', () => {
    const hotelAddress = '0xc2954b66EB27A20c936A3D8F2365FE9349472663';
    let fetcher;

    beforeEach(() => {
      fetcher = new Fetcher();
    });

    it('should return description object', async () => {
      nock(readApiUrl)
        .get(`/hotels/${hotelAddress}/availability`)
        .reply(200, hotelData.AVAILABILITY);
      const result = await fetcher.fetchAvailability(hotelAddress);
      assert.deepEqual(result, hotelData.AVAILABILITY);
    });

    it('should throw when hotelAddress is not passed', async () => {
      try {
        await fetcher.fetchAvailability();
        throw new Error('should have never been called');
      } catch (e) {
        assert.match(e.message, /hotelAddress is required/i);
      }
    });

    it('should throw on non-success response', async () => {
      nock(readApiUrl)
        .get(`/hotels/${hotelAddress}/availability`)
        .reply(502);
      try {
        await fetcher.fetchAvailability(hotelAddress);
        throw new Error('should have never been called');
      } catch (e) {
        assert.match(e.message, /responded with 502/i);
      }
    });
  });
});
