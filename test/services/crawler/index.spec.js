const { assert } = require('chai');
const sinon = require('sinon');

const hotelData = require('../../utils/test-data');
const { resetDB } = require('../../../src/db');
const { db, logger } = require('../../../src/config');
const Crawler = require('../../../src/services/crawler');
const { FetcherRemoteError } = require('../../../src/services/crawler/fetcher');
const HotelModel = require('../../../src/db/permanent/models/hotel');

describe('services.crawler.index', () => {
  beforeEach(async () => {
    await resetDB();
  });

  describe('initalization', () => {
    it('should throw when logger is not passed in options', () => {
      assert.throws(() => {
        /* eslint-disable-next-line */
        const crawler = new Crawler({});
      }, /logger is required/i);
    });

    it('should not initalize fetcher right away', () => {
      let crawler = new Crawler({ logger: logger });
      assert.isUndefined(crawler._fetcher);
    });

    it('should store passed config', () => {
      let crawler = new Crawler({ op: 'tions', logger: logger });
      assert.equal(crawler.config.op, 'tions');
    });

    it('should reuse fetcher instance', () => {
      let crawler = new Crawler({
        readApiUrl: 'https://read-api.wt.com',
        logger: logger,
      });
      assert.isUndefined(crawler._fetcher);
      const fetcher1 = crawler.getFetcher();
      assert.isDefined(crawler._fetcher);
      const fetcher2 = crawler.getFetcher();
      assert.equal(fetcher1, fetcher2);
    });
  });

  describe('syncAllHotels', () => {
    let crawler,
      syncHotelStub, fetchHotelListStub;

    beforeEach(async () => {
      await resetDB();
      crawler = new Crawler({
        readApiUrl: 'https://read-api.wt.com',
        logger: logger,
      });
      syncHotelStub = sinon.stub().resolves([0]);
      fetchHotelListStub = sinon.stub().callsFake((opts) => {
        opts.onEveryPage && opts.onEveryPage({ addresses: [1, 2, 3] });
        return Promise.resolve({ addresses: [1, 2, 3] });
      });
      crawler.getFetcher = sinon.stub().returns({
        fetchHotelList: fetchHotelListStub,
      });
      crawler.syncHotel = syncHotelStub;
    });

    it('should initiate sync for all hotels', async () => {
      const result = await crawler.syncAllHotels();
      assert.equal(fetchHotelListStub.callCount, 1);
      assert.equal(syncHotelStub.callCount, 3);
      assert.equal(result.length, 3);
    });

    it('should not panic when individual hotels cannot be synced', async () => {
      syncHotelStub = sinon.stub().rejects(new Error('Cannot sync hotel'));
      crawler.syncHotel = syncHotelStub;
      const result = await crawler.syncAllHotels();
      assert.equal(fetchHotelListStub.callCount, 1);
      assert.equal(syncHotelStub.callCount, 3);
      assert.equal(result.length, 3);
    });
  });

  describe('syncHotel', () => {
    let crawler,
      fetchDescriptionStub, fetchRatePlansStub,
      fetchAvailabilityStub, fetchDataUrisStub;

    beforeEach(async () => {
      await resetDB();
      crawler = new Crawler({
        readApiUrl: 'https://read-api.wt.com',
        logger: logger,
      });
      fetchDescriptionStub = sinon.stub().resolves(hotelData.DESCRIPTION);
      fetchRatePlansStub = sinon.stub().resolves(hotelData.RATE_PLANS);
      fetchAvailabilityStub = sinon.stub().resolves(hotelData.AVAILABILITY);
      fetchDataUrisStub = sinon.stub().resolves({
        address: '0xdummy',
        dataUri: 'https://example.com/data',
        descriptionUri: 'https://example.com/description',
        ratePlansUri: 'https://example.com/rate-plans',
        availabilityUri: 'https://example.com/availability',
      });
      crawler.getFetcher = sinon.stub().returns({
        fetchDescription: fetchDescriptionStub,
        fetchRatePlans: fetchRatePlansStub,
        fetchAvailability: fetchAvailabilityStub,
        fetchDataUris: fetchDataUrisStub,
      });
    });

    it('should fetch all parts', async () => {
      await crawler.syncHotel('0xdummy');
      assert.equal(fetchDescriptionStub.callCount, 1);
      assert.equal(fetchRatePlansStub.callCount, 1);
      assert.equal(fetchAvailabilityStub.callCount, 1);
      assert.equal(fetchDataUrisStub.callCount, 1);
    });

    it('should not fetch parts that do not have data uri', async () => {
      crawler.getFetcher().fetchDataUris = sinon.stub().resolves({
        address: '0xdummy',
        dataUri: 'https://example.com/data',
        descriptionUri: 'https://example.com/description',
      });
      await crawler.syncHotel('0xdummy');
      assert.equal(fetchDescriptionStub.callCount, 1);
      assert.equal(fetchRatePlansStub.callCount, 0);
      assert.equal(fetchAvailabilityStub.callCount, 0);
      assert.equal(crawler.getFetcher().fetchDataUris.callCount, 1);
    });

    it('should do only one db insert for non dataUris', async () => {
      const createSpy = sinon.spy(HotelModel, 'create');
      await crawler.syncHotel('0xdummy');
      assert.equal(createSpy.callCount, 2);
      const result = await db.select('address', 'part_name', 'raw_data')
        .from(HotelModel.TABLE);
      assert.equal(result.length, 4);
      assert.equal(result[0].address, '0xdummy');
      assert.equal(result[0].part_name, 'dataUris');
      assert.equal(result[1].address, '0xdummy');
      assert.equal(result[1].part_name, 'description');
      assert.equal(result[2].address, '0xdummy');
      assert.equal(result[2].part_name, 'ratePlans');
      assert.equal(result[3].address, '0xdummy');
      assert.equal(result[3].part_name, 'availability');
      createSpy.restore();
    });

    it('should not panic on fetch error of data document', async () => {
      const createSpy = sinon.spy(HotelModel, 'create');
      crawler.getFetcher().fetchDescription = sinon.stub().rejects(new FetcherRemoteError('fetcher error'));
      await crawler.syncHotel('0xdummy');
      assert.equal(crawler.getFetcher().fetchDescription.callCount, 1);
      assert.equal(fetchRatePlansStub.callCount, 1);
      assert.equal(fetchAvailabilityStub.callCount, 1);
      assert.equal(fetchDataUrisStub.callCount, 1);
      assert.equal(createSpy.callCount, 2);
      const result = await db.select('address', 'part_name', 'raw_data')
        .from(HotelModel.TABLE);
      assert.equal(result.length, 3);
      assert.equal(result[0].address, '0xdummy');
      assert.equal(result[0].part_name, 'dataUris');
      assert.equal(result[1].address, '0xdummy');
      assert.equal(result[1].part_name, 'ratePlans');
      assert.equal(result[2].address, '0xdummy');
      assert.equal(result[2].part_name, 'availability');
      createSpy.restore();
    });

    it('should not panic when empty response is returned for a particular resource', async () => {
      const createSpy = sinon.spy(HotelModel, 'create');
      crawler.getFetcher().fetchAvailability = sinon.stub().resolves();
      await crawler.syncHotel('0xdummy');
      assert.equal(createSpy.callCount, 2);
      createSpy.restore();
    });

    it('should throw when hotelAddress is missing', async () => {
      try {
        await crawler.syncHotel();
        throw new Error('should have not been called');
      } catch (e) {
        assert.match(e.message, /hotelAddress is required/i);
      }
    });
  });

  describe('_syncHotelPart', () => {
    let crawler,
      fetchDescriptionStub, fetchRatePlansStub;

    beforeEach(async () => {
      await resetDB();
      crawler = new Crawler({
        readApiUrl: 'https://read-api.wt.com',
        logger: logger,
      });
      fetchDescriptionStub = sinon.stub().resolves(hotelData.DESCRIPTION);
      fetchRatePlansStub = sinon.stub().resolves(hotelData.RATE_PLANS);
      crawler.getFetcher = sinon.stub().returns({
        fetchDescription: fetchDescriptionStub,
        fetchRatePlans: fetchRatePlansStub,
      });
    });

    it('should fetch appropriate data', async () => {
      await crawler._syncHotelPart('0xdummy', 'description');
      assert.equal(fetchDescriptionStub.callCount, 1);
      assert.equal(fetchRatePlansStub.callCount, 0);
      await crawler._syncHotelPart('0xdummy', 'ratePlans');
      assert.equal(fetchDescriptionStub.callCount, 1);
      assert.equal(fetchRatePlansStub.callCount, 1);
    });

    it('should return downloaded data', async () => {
      const result = await crawler._syncHotelPart('0xdummy', 'description');
      assert.equal(result.db.length, 1);
      assert.deepEqual(result.rawData, hotelData.DESCRIPTION);
    });

    it('should store data', async () => {
      await crawler._syncHotelPart('0xdummy', 'description');
      await crawler._syncHotelPart('0xdummy', 'ratePlans');
      const result = await db.select('address', 'part_name', 'raw_data')
        .from(HotelModel.TABLE);
      assert.equal(result.length, 2);
      assert.equal(result[0].address, '0xdummy');
      assert.equal(result[0].part_name, 'description');
      assert.equal(result[1].address, '0xdummy');
      assert.equal(result[1].part_name, 'ratePlans');
    });

    it('should throw on fetch error', async () => {
      crawler.getFetcher = sinon.stub().returns({
        fetchRatePlans: sinon.stub().rejects(new FetcherRemoteError('fetcher error')),
      });
      try {
        await crawler._syncHotelPart('0xdummy', 'ratePlans');
        throw new Error('should not have been called');
      } catch (e) {
        assert.match(e.message, /fetcher error/i);
      }
    });
  });
});
