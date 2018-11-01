const { db } = require('../../../config');

const TABLE = 'hotels',
  PART_NAMES = ['description', 'ratePlans', 'availability', 'dataUris'];

const createTable = async () => {
  await db.schema.createTable(TABLE, (table) => {
    table.increments('id');
    table.string('address', 63).notNullable();
    table.enu('part_name', PART_NAMES).notNullable();
    table.json('raw_data').notNullable();
    table.timestamps(true, true);

    table.index(['address']);
    table.index(['address', 'part_name', 'created_at']);
  });
};

const dropTable = async () => {
  await db.schema.dropTableIfExists(TABLE);
};

const create = (hotelData) => {
  if (!hotelData || hotelData.length === 0) {
    throw new Error('No hotel data provided.');
  }
  if (!Array.isArray(hotelData)) {
    hotelData = [hotelData];
  }
  // This actually returns a value from a numerical id column.
  // It's not very reliable and the behaviour depends on used
  // DB engine.
  return db(TABLE)
    .insert(hotelData.map((d) => {
      return {
        'address': d.address,
        'part_name': d.partName,
        'raw_data': JSON.stringify(d.rawData),
      };
    }));
};

const delete_ = (hotelAddress) => {
  return db(TABLE).where('address', hotelAddress).delete();
};

const getLatestHotelData = async (hotelAddress, partNames) => {
  partNames = partNames || ['description', 'ratePlans', 'availability'];
  const result = await db.from(TABLE).whereIn('id', function () {
    this.union(partNames.map((partName) => function () {
      this.from(TABLE).max('id').where({
        'address': hotelAddress,
        'part_name': partName,
      });
    }));
  }).select('raw_data', 'part_name', 'id');

  return result.map((p) => {
    return {
      rawData: JSON.parse(p.raw_data),
      partName: p.part_name,
    };
  }).reduce((agg, p) => {
    agg.data[p.partName] = p.rawData;
    return agg;
  }, {
    address: hotelAddress,
    data: {},
  });
};

/**
 * Get a list of hotel addresses - used when no sorting
 * filtering is requested.
 *
 * NOTE: This method is probably just temporary, therefore
 * it's not directly tested.
 *
 * @param {Number} limit
 * @param {String} startWith (optional)
 * @return {Promise<Array>}
 */
const getAddresses = async (limit, startWith) => {
  let query = db
    .from(TABLE)
    .distinct('address')
    .orderBy('address')
    .limit(limit);

  if (startWith) {
    query = query.where('address', '>=', startWith);
  }

  return (await query.select()).map((item) => item.address);
};

module.exports = {
  createTable,
  dropTable,
  create,
  delete: delete_,
  getLatestHotelData,
  getAddresses,
  TABLE,
  PART_NAMES,
};
