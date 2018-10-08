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
      const ids = await fetcher.fetchHotelIds();
      assert.equal(ids.length, 2);
      assert.equal(ids[0], '0xdummy1');
      assert.equal(ids[1], '0xdummy2');
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
      const ids = await fetcher.fetchHotelIds();
      assert.equal(ids.length, 7);
      assert.equal(ids[0], '0xdummy1');
      assert.equal(ids[1], '0xdummy2');
      assert.equal(ids[2], '0xdummy3');
      assert.equal(ids[3], '0xdummy4');
      assert.equal(ids[4], '0xdummy5');
      assert.equal(ids[5], '0xdummy6');
      assert.equal(ids[6], '0xdummy7');
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
      const ids = await fetcher.fetchHotelIds(`${readApiUrl}/hotels?limit=${limit}&fields=id&startWith=0xdummy6`);
      assert.equal(ids.length, 2);
      assert.equal(ids[0], '0xdummy6');
      assert.equal(ids[1], '0xdummy7');
    });

    it('should throw if url in an argument is weird', async () => {
      try {
        await fetcher.fetchHotelIds('https://google.com/look-for-travel');
        throw new Error('should not have been called');
      } catch (e) {
        assert.match(e.message, /does not look like hotels list/i);
      }
    });
  });
});
