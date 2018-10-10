const { assert } = require('chai');

const { resetDB } = require('../../src/db');
const { db } = require('../../src/config');
const Hotel = require('../../src/models/hotel');
const hotelData = require('../utils/test-data');

describe('models.hotel', () => {
  before(async () => {
    await resetDB();
  });

  after(async () => {
    await db.destroy();
  });

  describe('create', () => {
    it('should insert data', async () => {
      const id = await Hotel.create({
        address: '0xc2954b66EB27A20c936A3D8F2365FE9349472663',
        partName: 'description',
        rawData: hotelData.DESCRIPTION,
      });
      const result = await db.select('address', 'part_name', 'raw_data')
        .from('hotels')
        .where({
          id,
        });
      assert.equal(result[0].address, '0xc2954b66EB27A20c936A3D8F2365FE9349472663');
      assert.equal(result[0].part_name, 'description');
      assert.deepEqual(JSON.parse(result[0].raw_data), hotelData.DESCRIPTION);
    });

    it('should return generated id', async () => {
      const id = await Hotel.create({
        address: '0xc2954b66EB27A20c936A3D8F2365FE9349472663',
        partName: 'description',
        rawData: hotelData.DESCRIPTION,
      });
      assert.isNumber(id);
    });

    it('should throw on missing required field', async () => {
      try {
        await Hotel.create({
          address: '0xc2954b66EB27A20c936A3D8F2365FE9349472663',
          partName: 'description',
        });
        throw new Error('should not have been called');
      } catch (e) {
        assert.match(e.message, /constraint failed/i);
      }
    });
  });
});
