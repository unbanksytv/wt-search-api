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
      let crawler = new Crawler({ logger: logger });
      assert.isUndefined(crawler._fetcher);
      const fetcher1 = crawler.getFetcher();
      assert.isDefined(crawler._fetcher);
      const fetcher2 = crawler.getFetcher();
      assert.equal(fetcher1, fetcher2);
    });
  });

  describe('syncAllHotels', () => {
    let crawler, syncHotelStub, fetchHotelListStub, deleteObsoleteStub;

    beforeEach(async () => {
      await resetDB();
      crawler = new Crawler({ logger: logger });
      syncHotelStub = sinon.stub().resolves([0]);
      deleteObsoleteStub = sinon.stub().resolves();
      fetchHotelListStub = sinon.stub().callsFake((opts) => {
        opts.onEveryPage && opts.onEveryPage({ addresses: [1, 2, 3] });
        return Promise.resolve({ addresses: [1, 2, 3] });
      });
      crawler.getFetcher = sinon.stub().returns({
        fetchHotelList: fetchHotelListStub,
      });
      crawler.syncHotel = syncHotelStub;
      crawler.deleteObsolete = deleteObsoleteStub;
    });

    it('should initiate sync for all hotels', async () => {
      await crawler.syncAllHotels();
      assert.equal(fetchHotelListStub.callCount, 1);
      assert.equal(syncHotelStub.callCount, 3);
      assert.equal(deleteObsoleteStub.callCount, 1);
    });

    it('should not panic when individual hotels cannot be synced', async () => {
      syncHotelStub = sinon.stub().rejects(new Error('Cannot sync hotel'));
      crawler.syncHotel = syncHotelStub;
      await crawler.syncAllHotels();
      assert.equal(fetchHotelListStub.callCount, 1);
      assert.equal(syncHotelStub.callCount, 3);
      assert.equal(deleteObsoleteStub.callCount, 1);
    });
  });

  describe('syncHotel', () => {
    let crawler,
      fetchDescriptionStub, fetchRatePlansStub,
      fetchAvailabilityStub, fetchMetaStub;

    beforeEach(async () => {
      await resetDB();
      crawler = new Crawler({ logger: logger });
      fetchDescriptionStub = sinon.stub().resolves(hotelData.DESCRIPTION);
      fetchRatePlansStub = sinon.stub().resolves(hotelData.RATE_PLANS);
      fetchAvailabilityStub = sinon.stub().resolves(hotelData.AVAILABILITY);
      fetchMetaStub = sinon.stub().resolves({
        address: '0xdummy',
        dataFormatVersion: '0.2.0',
        dataUri: 'https://example.com/data',
        descriptionUri: 'https://example.com/description',
        ratePlansUri: 'https://example.com/rate-plans',
        availabilityUri: 'https://example.com/availability',
      });
      crawler.getFetcher = sinon.stub().returns({
        fetchDescription: fetchDescriptionStub,
        fetchRatePlans: fetchRatePlansStub,
        fetchAvailability: fetchAvailabilityStub,
        fetchMeta: fetchMetaStub,
      });
    });

    it('should fetch all parts', async () => {
      await crawler.syncHotel('0xdummy');
      assert.equal(fetchDescriptionStub.callCount, 1);
      assert.equal(fetchRatePlansStub.callCount, 1);
      assert.equal(fetchAvailabilityStub.callCount, 1);
      assert.equal(fetchMetaStub.callCount, 1);
    });

    it('should not fetch parts that do not have data uri', async () => {
      crawler.getFetcher().fetchMeta = sinon.stub().resolves({
        address: '0xdummy',
        dataUri: 'https://example.com/data',
        descriptionUri: 'https://example.com/description',
      });
      await crawler.syncHotel('0xdummy');
      assert.equal(fetchDescriptionStub.callCount, 1);
      assert.equal(fetchRatePlansStub.callCount, 0);
      assert.equal(fetchAvailabilityStub.callCount, 0);
      assert.equal(crawler.getFetcher().fetchMeta.callCount, 1);
    });

    it('should do only one db insert for non meta', async () => {
      const upsertSpy = sinon.spy(HotelModel, 'upsert');
      await crawler.syncHotel('0xdummy');
      assert.equal(upsertSpy.callCount, 2);
      const result = await db.select('address', 'part_name', 'raw_data')
        .from(HotelModel.TABLE);
      assert.equal(result.length, 4);
      assert.equal(result[0].address, '0xdummy');
      assert.equal(result[0].part_name, 'meta');
      assert.equal(result[1].address, '0xdummy');
      assert.equal(result[1].part_name, 'description');
      assert.equal(result[2].address, '0xdummy');
      assert.equal(result[2].part_name, 'ratePlans');
      assert.equal(result[3].address, '0xdummy');
      assert.equal(result[3].part_name, 'availability');
      upsertSpy.restore();
    });

    it('delete obsolete parts', async () => {
      await crawler.syncHotel('0xdummy');
      let result = await db.select('part_name').from(HotelModel.TABLE);
      assert.equal(result.length, 4);
      crawler.getFetcher = sinon.stub().returns({
        fetchDescription: fetchDescriptionStub,
        fetchRatePlans: fetchRatePlansStub,
        fetchAvailability: fetchAvailabilityStub,
        fetchMeta: sinon.stub().resolves({
          address: '0xdummy',
          dataFormatVersion: '0.2.0',
          dataUri: 'https://example.com/data',
          descriptionUri: 'https://example.com/description',
        }),
      });
      // Sync again; this time, ratePlans and availability disappeared from upstrem.
      await crawler.syncHotel('0xdummy');
      result = await db.select('part_name').from(HotelModel.TABLE);
      assert.deepEqual(result.map((x) => x.part_name).sort(), ['description', 'meta']);
    });

    it('should not panic on fetch error of data document', async () => {
      const upsertSpy = sinon.spy(HotelModel, 'upsert');
      crawler.getFetcher().fetchDescription = sinon.stub().rejects(new FetcherRemoteError('fetcher error'));
      await crawler.syncHotel('0xdummy');
      assert.equal(crawler.getFetcher().fetchDescription.callCount, 1);
      assert.equal(fetchRatePlansStub.callCount, 1);
      assert.equal(fetchAvailabilityStub.callCount, 1);
      assert.equal(fetchMetaStub.callCount, 1);
      assert.equal(upsertSpy.callCount, 2);
      const result = await db.select('address', 'part_name', 'raw_data')
        .from(HotelModel.TABLE);
      assert.equal(result.length, 3);
      assert.equal(result[0].address, '0xdummy');
      assert.equal(result[0].part_name, 'meta');
      assert.equal(result[1].address, '0xdummy');
      assert.equal(result[1].part_name, 'ratePlans');
      assert.equal(result[2].address, '0xdummy');
      assert.equal(result[2].part_name, 'availability');
      upsertSpy.restore();
    });

    it('should not panic when empty response is returned for a particular resource', async () => {
      const upsertSpy = sinon.spy(HotelModel, 'upsert');
      crawler.getFetcher().fetchAvailability = sinon.stub().resolves();
      await crawler.syncHotel('0xdummy');
      assert.equal(upsertSpy.callCount, 2);
      upsertSpy.restore();
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
      crawler = new Crawler({ logger: logger });
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

  describe('deleteHotel', () => {
    let crawler;

    before(() => {
      sinon.stub(HotelModel, 'delete').returns(Promise.resolve());
    });

    after(() => {
      HotelModel.delete.restore();
    });

    beforeEach(async () => {
      crawler = new Crawler({ logger: logger });
    });

    it('should delete the specified hotel', async () => {
      HotelModel.delete.resetHistory();
      crawler.deleteHotel('0xdummy');
      assert.deepEqual(HotelModel.delete.args, [['0xdummy']]);
    });
  });
});
