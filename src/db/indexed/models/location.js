const { db } = require('../../../config');

const TABLE = 'locations';

const createTable = async () => {
  await db.schema.createTable(TABLE, (table) => {
    table.string('hotel_address').primary();
    table.float('lat');
    table.float('lng');
    table.index(['lat']);
    table.index(['lng']);
  });
};

const dropTable = async () => {
  await db.schema.dropTableIfExists(TABLE);
};

/**
 * Create or insert hotel location data.
 *
 * @param {Integer} hotelAddress
 * @param {Number} lat in degrees
 * @param {Number} lng in degrees
 * @return {Promise<void>}
 */
const upsert = async (hotelAddress, lat, lng) => {
  const existing = await db(TABLE).where({
      'hotel_address': hotelAddress,
    }).select('hotel_address'),
    data = {
      'lat': lat,
      'lng': lng,
    };
  if (existing.length === 0) {
    await db(TABLE).insert(Object.assign({ 'hotel_address': hotelAddress }, data));
  } else {
    await db(TABLE).where('hotel_address', hotelAddress).update(data);
  }
};

module.exports = {
  createTable,
  dropTable,
  upsert,
  TABLE,
};
