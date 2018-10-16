const { db } = require('../../../config');

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

const getLatestHotelData = async (hotelAddress) => {
  const partNames = ['description', 'ratePlans', 'availability'],
    result = await db.from(HOTELS_TABLE).whereIn('id', function () {
      this.union(partNames.map((partName) => function () {
        this.from(HOTELS_TABLE).max('id').where({
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
 * Get a list of hotel addresses based on the index filters.
 *
 * @param {Array} filters
 * @param {Function} sorting (optional)
 * @return {Promise<Array>}
 *
 */
const getAddresses = async (filters, sorting) => {
  const head = filters[0],
    tail = filters.slice(1),
    table = head.table;
  let query = db(table);
  for (let filter of tail) {
    query = query.innerJoin(table, `${table}.hotel_address`, '=', `${filter.table}.hotel_address`);
  }
  query = query.where(head.condition);
  for (let filter of tail) {
    query = query.andWhere(filter.condition);
  }

  if (sorting) {
    const filterTables = filters.map((x) => x.table);
    if (filterTables.indexOf(sorting.table) === -1) {
      query = query.innerJoin(sorting.table, `${table}.hotel_address`, '=', `${sorting.table}.hotel_address`);
    }
    query.select(sorting.select).orderBy(sorting.columnName);
  }

  const data = await query.select(`${table}.hotel_address`);
  return data.map((item) => item.hotel_address);
};

module.exports = {
  createTable,
  dropTable,
  create,
  getAddresses,
  getLatestHotelData,
  HOTELS_TABLE,
  HOTEL_PART_NAMES,
};
