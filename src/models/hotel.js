const { db } = require('../config');

const HOTELS_TABLE = 'hotels',
  HOTEL_PART_NAMES = ['description', 'ratePlans', 'availability', 'dataUris'];

const createTable = async () => {
  await db.schema.createTable(HOTELS_TABLE, (table) => {
    table.increments('id');
    table.string('address', 63).notNullable();
    table.enu('part_name', HOTEL_PART_NAMES).notNullable();
    table.json('raw_data').notNullable();
    table.timestamps(true, true);

    table.index(['address', 'part_name', 'created_at']);
  });
};

const dropTable = async () => {
  await db.schema.dropTableIfExists(HOTELS_TABLE);
};

const create = (hotelData) => {
  if (!Array.isArray(hotelData)) {
    hotelData = [hotelData];
  }
  // This actually returns a value from a numerical id column.
  // It's not very reliable and the behaviour depends on used
  // DB engine.
  return db(HOTELS_TABLE)
    .insert(hotelData.map((d) => {
      return {
        'address': d.address,
        'part_name': d.partName,
        'raw_data': JSON.stringify(d.rawData),
      };
    }));
};

module.exports = {
  createTable,
  dropTable,
  create,
  HOTELS_TABLE,
  HOTEL_PART_NAMES,
};
