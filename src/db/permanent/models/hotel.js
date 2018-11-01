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
    table.unique(['address', 'part_name']);
  });
};

const dropTable = async () => {
  await db.schema.dropTableIfExists(TABLE);
};

const upsert = async (hotelData) => {
  if (!hotelData || hotelData.length === 0) {
    throw new Error('No hotel data provided.');
  }
  if (!Array.isArray(hotelData)) {
    hotelData = [hotelData];
  }
  for (let part of hotelData) {
    const partName = part.partName || null,
      address = part.address || null,
      rawData = JSON.stringify(part.rawData) || null;
    const modified = await db(TABLE)
      .where({ 'address': address, 'part_name': partName })
      .update({ 'raw_data': rawData });
    if (modified > 0) {
      continue;
    }
    await db(TABLE).insert({
      'address': address,
      'part_name': partName,
      'raw_data': rawData,
    });
  }
};

const delete_ = (hotelAddress) => {
  return db(TABLE).where('address', hotelAddress).delete();
};

const getHotelData = async (hotelAddress, partNames) => {
  partNames = partNames || ['description', 'ratePlans', 'availability'];
  const result = await db.from(TABLE)
    .whereIn('part_name', partNames)
    .andWhere('address', hotelAddress)
    .select('raw_data', 'part_name', 'id');

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
  upsert,
  delete: delete_,
  getHotelData,
  getAddresses,
  TABLE,
  PART_NAMES,
};
