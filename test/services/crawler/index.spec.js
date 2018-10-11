const { assert } = require('chai');
const sinon = require('sinon');

const hotelData = require('../../utils/test-data');
const { resetDB } = require('../../../src/db');
const { db } = require('../../../src/config');
const { Crawler } = require('../../../src/services/crawler');
const HotelModel = require('../../../src/models/hotel');

describe('services.crawler.fetcher', () => {
  beforeEach(async () => {
    await resetDB();
  });

  describe('initalization', () => {
    it('should not initalize fetcher right away', () => {
      let crawler = new Crawler({});
      assert.isUndefined(crawler._fetcher);
    });

    it('should store passed config', () => {
      let crawler = new Crawler({ op: 'tions' });
      assert.equal(crawler.config.op, 'tions');
    });

    it('should reuse fetcher instance', () => {
      let crawler = new Crawler({
        readApiUrl: 'https://read-api.wt.com',
      });
      assert.isUndefined(crawler._fetcher);
      const fetcher1 = crawler.getFetcher();
      assert.isDefined(crawler._fetcher);
      const fetcher2 = crawler.getFetcher();
      assert.equal(fetcher1, fetcher2);
    });
  });

  describe('syncAllHotels', () => {
    it('should initiate sync for all hotels', async () => {

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
      });
      fetchDescriptionStub = sinon.stub().resolves(hotelData.DESCRIPTION);
      fetchRatePlansStub = sinon.stub().resolves(hotelData.RATE_PLANS);
      fetchAvailabilityStub = sinon.stub().resolves(hotelData.AVAILABILITY);
      fetchDataUrisStub = sinon.stub().resolves({
        address: '0xdummy',
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

    it('should do only one db insert', async () => {
      const createSpy = sinon.spy(HotelModel, 'create');
      await crawler.syncHotel('0xdummy');
      assert.equal(createSpy.callCount, 1);
      const result = await db.select('address', 'part_name', 'raw_data')
        .from(HotelModel.HOTELS_TABLE);
      assert.equal(result.length, 4);
      assert.equal(result[0].address, '0xdummy');
      assert.equal(result[0].part_name, 'description');
      assert.equal(result[1].address, '0xdummy');
      assert.equal(result[1].part_name, 'ratePlans');
      assert.equal(result[2].address, '0xdummy');
      assert.equal(result[2].part_name, 'availability');
      assert.equal(result[3].address, '0xdummy');
      assert.equal(result[3].part_name, 'dataUris');
      createSpy.restore();
    });

    it('should not panic on fetch error', async () => {
      const createSpy = sinon.spy(HotelModel, 'create');
      crawler.getFetcher().fetchDescription = sinon.stub().rejects(new Error('fetcher error'));
      await crawler.syncHotel('0xdummy');
      assert.equal(crawler.getFetcher().fetchDescription.callCount, 1);
      assert.equal(fetchRatePlansStub.callCount, 1);
      assert.equal(fetchAvailabilityStub.callCount, 1);
      assert.equal(fetchDataUrisStub.callCount, 1);
      assert.equal(createSpy.callCount, 1);
      const result = await db.select('address', 'part_name', 'raw_data')
        .from(HotelModel.HOTELS_TABLE);
      assert.equal(result.length, 3);
      assert.equal(result[0].address, '0xdummy');
      assert.equal(result[0].part_name, 'ratePlans');
      assert.equal(result[1].address, '0xdummy');
      assert.equal(result[1].part_name, 'availability');
      assert.equal(result[2].address, '0xdummy');
      assert.equal(result[2].part_name, 'dataUris');
      createSpy.restore();
    });
  });

  describe('syncHotelPart', () => {
    let crawler,
      fetchDescriptionStub, fetchRatePlansStub;

    beforeEach(async () => {
      await resetDB();
      crawler = new Crawler({
        readApiUrl: 'https://read-api.wt.com',
      });
      fetchDescriptionStub = sinon.stub().resolves(hotelData.DESCRIPTION);
      fetchRatePlansStub = sinon.stub().resolves(hotelData.RATE_PLANS);
      crawler.getFetcher = sinon.stub().returns({
        fetchDescription: fetchDescriptionStub,
        fetchRatePlans: fetchRatePlansStub,
      });
    });

    it('should fetch appropriate data', async () => {
      await crawler.syncHotelPart('0xdummy', 'description');
      assert.equal(fetchDescriptionStub.callCount, 1);
      assert.equal(fetchRatePlansStub.callCount, 0);
      await crawler.syncHotelPart('0xdummy', 'ratePlans');
      assert.equal(fetchDescriptionStub.callCount, 1);
      assert.equal(fetchRatePlansStub.callCount, 1);
    });

    it('should store data', async () => {
      await crawler.syncHotelPart('0xdummy', 'description');
      await crawler.syncHotelPart('0xdummy', 'ratePlans');
      const result = await db.select('address', 'part_name', 'raw_data')
        .from(HotelModel.HOTELS_TABLE);
      assert.equal(result.length, 2);
      assert.equal(result[0].address, '0xdummy');
      assert.equal(result[0].part_name, 'description');
      assert.equal(result[1].address, '0xdummy');
      assert.equal(result[1].part_name, 'ratePlans');
    });

    it('should throw on fetch error', async () => {
      crawler.getFetcher = sinon.stub().returns({
        fetchRatePlans: sinon.stub().rejects(new Error('fetcher error')),
      });
      try {
        await crawler.syncHotelPart('0xdummy', 'ratePlans');
        throw new Error('should not have been called');
      } catch (e) {
        assert.match(e.message, /fetcher error/i);
      }
    });
  });
});
