/* eslint-env mocha */
const { assert } = require('chai');
const nock = require('nock');
const { Fetcher, FetcherInitializationError } = require('../../../src/services/crawler/fetcher');

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

  describe('fetchHotelsIds', () => {
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
      const result = await fetcher.fetchHotelIds();
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
      const result = await fetcher.fetchHotelIds();
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

    it('should call an url from an argument', async () => {
      nock(readApiUrl)
        .get(`/hotels?limit=${limit}&fields=id&startWith=0xdummy6`)
        .reply(200, {
          items: [
            { id: '0xdummy6' },
            { id: '0xdummy7' },
          ],
        });
      const result = await fetcher.fetchHotelIds(undefined, `${readApiUrl}/hotels?limit=${limit}&fields=id&startWith=0xdummy6`);
      assert.equal(result.ids.length, 2);
      assert.equal(result.ids[0], '0xdummy6');
      assert.equal(result.ids[1], '0xdummy7');
      assert.equal(result.next, undefined);
    });

    it('should throw if url in an argument is weird', async () => {
      try {
        await fetcher.fetchHotelIds(undefined, 'https://google.com/look-for-travel');
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
      const result = await fetcher.fetchHotelIds(2);
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
  });
});
