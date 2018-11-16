const { assert } = require('chai');

const { resetDB } = require('../../../../src/db/permanent');
const { db } = require('../../../../src/config');
const Hotel = require('../../../../src/db/permanent/models/hotel');
const hotelData = require('../../../utils/test-data');

describe('models.hotel', () => {
  beforeEach(async () => {
    await resetDB();
  });

  describe('upsert', () => {
    it('should insert data', async () => {
      await Hotel.upsert({
        address: '0xc2954b66EB27A20c936A3D8F2365FE9349472663',
        partName: 'description',
        rawData: hotelData.DESCRIPTION,
      });
      const result = await db.select('address', 'part_name', 'raw_data')
        .from(Hotel.TABLE);
      assert.equal(result[0].address, '0xc2954b66EB27A20c936A3D8F2365FE9349472663');
      assert.equal(result[0].part_name, 'description');
      assert.deepEqual(JSON.parse(result[0].raw_data), hotelData.DESCRIPTION);
    });

    it('should insert multiple data at once', async () => {
      await Hotel.upsert([
        {
          address: '0xc2954b66EB27A20c936A3D8F2365FE9349472663',
          partName: 'description',
          rawData: hotelData.DESCRIPTION,
        },
        {
          address: '0xc2954b66EB27A20c936A3D8F2365FE9349472663',
          partName: 'ratePlans',
          rawData: hotelData.RATE_PLANS,
        },
      ]);
      const result = await db.select('address', 'part_name', 'raw_data')
        .from(Hotel.TABLE);
      assert.equal(result.length, 2);
      assert.equal(result[0].address, '0xc2954b66EB27A20c936A3D8F2365FE9349472663');
      assert.equal(result[0].part_name, 'description');
      assert.deepEqual(JSON.parse(result[0].raw_data), hotelData.DESCRIPTION);
      assert.equal(result[1].address, '0xc2954b66EB27A20c936A3D8F2365FE9349472663');
      assert.equal(result[1].part_name, 'ratePlans');
      assert.deepEqual(JSON.parse(result[1].raw_data), hotelData.RATE_PLANS);
    });

    it('should update existing records', async () => {
      await Hotel.upsert([
        {
          address: '0xc2954b66EB27A20c936A3D8F2365FE9349472663',
          partName: 'description',
          rawData: hotelData.DESCRIPTION,
        },
        {
          address: '0xc2954b66EB27A20c936A3D8F2365FE9349472663',
          partName: 'ratePlans',
          rawData: hotelData.RATE_PLANS,
        },
      ]);
      await Hotel.upsert([
        {
          address: '0xc2954b66EB27A20c936A3D8F2365FE9349472663',
          partName: 'description',
          rawData: { updated: true },
        },
      ]);
      const result = await db.select('address', 'part_name', 'raw_data')
        .from(Hotel.TABLE);
      assert.equal(result.length, 2);
      assert.equal(result[0].address, '0xc2954b66EB27A20c936A3D8F2365FE9349472663');
      assert.equal(result[0].part_name, 'description');
      assert.deepEqual(JSON.parse(result[0].raw_data), { updated: true });
      assert.equal(result[1].address, '0xc2954b66EB27A20c936A3D8F2365FE9349472663');
      assert.equal(result[1].part_name, 'ratePlans');
      assert.deepEqual(JSON.parse(result[1].raw_data), hotelData.RATE_PLANS);
    });

    it('should throw on missing required field', async () => {
      try {
        await Hotel.upsert({
          address: '0xc2954b66EB27A20c936A3D8F2365FE9349472663',
          partName: 'description',
        });
        throw new Error('should not have been called');
      } catch (e) {
        assert.match(e.message, /not null constraint failed/i);
      }
      try {
        await Hotel.upsert({
          address: '0xc2954b66EB27A20c936A3D8F2365FE9349472663',
          rawData: hotelData.RATE_PLANS,
        });
        throw new Error('should not have been called');
      } catch (e) {
        assert.match(e.message, /not null constraint failed/i);
      }
      try {
        await Hotel.upsert({
          partName: 'ratePlans',
          rawData: hotelData.RATE_PLANS,
        });
        throw new Error('should not have been called');
      } catch (e) {
        assert.match(e.message, /not null constraint failed/i);
      }
    });

    it('should throw on unsupported partName', async () => {
      try {
        await Hotel.upsert({
          address: '0xc2954b66EB27A20c936A3D8F2365FE9349472663',
          partName: 'RATE_PLANS',
          rawData: hotelData.RATE_PLANS,
        });
        throw new Error('should not have been called');
      } catch (e) {
        assert.match(e.message, /check constraint failed/i);
      }
    });
  });

  describe('getHotelData', () => {
    const hotelId = '0xc2954b66EB27A20c936A3D8F2365FE9349472663';
    beforeEach(async () => {
      await Hotel.upsert({
        address: hotelId,
        partName: 'meta',
        rawData: {
          descriptionUri: 'schema://uri',
        },
      });
      await Hotel.upsert({
        address: hotelId,
        partName: 'description',
        rawData: { name: 'stale data' },
      });
      await Hotel.upsert({
        address: hotelId,
        partName: 'ratePlans',
        rawData: hotelData.RATE_PLANS,
      });
      await Hotel.upsert({
        address: hotelId,
        partName: 'availability',
        rawData: hotelData.AVAILABILITY,
      });
      await Hotel.upsert({
        address: hotelId,
        partName: 'description',
        rawData: hotelData.DESCRIPTION,
      });
    });

    it('should select all data parts by default', async () => {
      const result = await Hotel.getHotelData(hotelId);
      assert.equal(result.address, hotelId);
      assert.isDefined(result.data);
      assert.deepEqual(result.data.description, hotelData.DESCRIPTION);
      assert.deepEqual(result.data.ratePlans, hotelData.RATE_PLANS);
      assert.deepEqual(result.data.availability, hotelData.AVAILABILITY);
      assert.isUndefined(result.data.meta);
    });

    it('should optionally limit the selection of data parts', async () => {
      const result = await Hotel.getHotelData(hotelId, ['ratePlans']);
      assert.equal(result.address, hotelId);
      assert.property(result.data, 'ratePlans');
      assert.notProperty(result.data, 'description');
      assert.notProperty(result.data, 'availability');
    });

    it('should select only the latest part of the same type', async () => {
      const result = await Hotel.getHotelData(hotelId);
      assert.equal(result.address, hotelId);
      assert.isDefined(result.data);
      assert.deepEqual(result.data.description, hotelData.DESCRIPTION);
      assert.deepEqual(result.data.ratePlans, hotelData.RATE_PLANS);
      assert.deepEqual(result.data.availability, hotelData.AVAILABILITY);
      assert.isUndefined(result.data.meta);
    });
  });

  describe('delete', () => {
    it('should delete all parts of the selected hotel', async () => {
      await Hotel.upsert([
        {
          address: '0xtobedeleted',
          partName: 'description',
          rawData: hotelData.DESCRIPTION,
        },
        {
          address: '0xtobedeleted',
          partName: 'ratePlans',
          rawData: hotelData.DESCRIPTION,
        },
        {
          address: '0xtobekept',
          partName: 'description',
          rawData: hotelData.DESCRIPTION,
        },
      ]);
      await Hotel.delete('0xtobedeleted');
      const result = await db.select('address').from(Hotel.TABLE);
      assert.equal(result.length, 1);
      assert.equal(result[0].address, '0xtobekept');
    });
  });
});
