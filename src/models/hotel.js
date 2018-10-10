const { db } = require('../config');

const HOTELS_TABLE = 'hotels';

module.exports.createTable = async function () {
  await db.schema.createTable(HOTELS_TABLE, (table) => {
    table.increments('id');
    table.string('address', 63).notNullable();
    table.string('part_name', 32).notNullable(); // TODO enum
    table.json('raw_data').notNullable();
    table.timestamps(true, true);

    table.index(['address', 'part_name', 'created_at']);
  });
};

module.exports.dropTable = async function () {
  await db.schema.dropTableIfExists(HOTELS_TABLE);
};

module.exports.create = async function (hotelData) {
  const result = await db(HOTELS_TABLE).insert({
    'address': hotelData.address,
    'part_name': hotelData.partName,
    'raw_data': JSON.stringify(hotelData.rawData),
  });
  return result[0];
};
