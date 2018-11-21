const { db } = require('../../../config');

const TABLE = 'hotels',
  PART_NAMES = ['description', 'ratePlans', 'availability', 'meta'];

const createTable = async () => {
  await db.schema.createTable(TABLE, (table) => {
    table.increments('id');
    table.string('address', 63).notNullable();
    table.enu('part_name', PART_NAMES).notNullable();
    table.json('raw_data').notNullable();
    table.timestamps(true, false); // We do not use the defaults as they behave strangely.

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
  const toInsert = [];
  for (let part of hotelData) {
    const partName = part.partName || null,
      address = part.address || null,
      rawData = JSON.stringify(part.rawData) || null,
      now = new Date();
    const modified = await db(TABLE)
      .where({ 'address': address, 'part_name': partName })
      .update({ 'raw_data': rawData, 'updated_at': now });
    if (modified > 0) {
      continue;
    }
    toInsert.push({
      'address': address,
      'part_name': partName,
      'raw_data': rawData,
      'created_at': now,
      'updated_at': now,
    });
  }
  if (toInsert.length > 0) {
    await db(TABLE).insert(toInsert);
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

/**
 * Delete hotel parts with obsolete data based on the updated_at timestamp.
 *
 * Resolve with the array of affected addresses.
 *
 * @param {Date} cutoff
 * @param {String} address (optional) limit the deletion to the given address
 * @return {Promise<Array>}
 */
const deleteObsoleteParts = async (cutoff, address) => {
  let query = db.from(TABLE).where('updated_at', '<', cutoff);
  if (address) {
    query = query.andWhere('address', address);
  }
  const addresses = await query.distinct('address');
  // NOTE: There's a potential race condition here, but its
  // eventual impact should be negligible.
  await query.delete();
  return addresses.map((x) => x.address);
};

module.exports = {
  createTable,
  dropTable,
  upsert,
  delete: delete_,
  getHotelData,
  getAddresses,
  deleteObsoleteParts,
  TABLE,
  PART_NAMES,
};
