const { db } = require('../../../config');

const TABLE = 'locations';

const createTable = async () => {
  await db.schema.createTable(TABLE, (table) => {
    table.bigInteger('hotel_id').primary();
    table.float('lat');
    table.float('lng');
    // Store longitude also scaled by "fudge" to be used in
    // a somewhat less naive distance approximation.
    //
    // Inspired by https://stackoverflow.com/a/7472230.
    table.float('lng_scaled');

    table.index(['lat']);
    table.index(['lng_scaled']);
  });
};

const dropTable = async () => {
  await db.schema.dropTableIfExists(TABLE);
};

function _toRadians (degrees) {
  return degrees * Math.PI / 180;
}

/**
 * Create or insert hotel location data.
 *
 * @param {Integer} hotelId
 * @param {Number} lat in degrees
 * @param {Number} lng in degrees
 * @return {Promise<void>}
 */
const upsert = async (hotelId, lat, lng) => {
  const existing = await db(TABLE).count().where({
      'hotel_id': hotelId,
    }),
    data = {
      'lat': lat,
      'lng': lng,
      'lng_scaled': Math.pow(Math.cos(_toRadians(lat)), 2),
    };
  if (existing < 1) {
    await db(TABLE).insert(Object.assign({ 'hotel_id': hotelId }, data));
  } else {
    await db(TABLE).where('hotel_id', hotelId).update(data);
  }
};

/**
 * Get a filtering function that can be further used by the knex
 * query builder.
 *
 * Note: the distance is only approximate at the moment.
 *
 * @param {Number} lat in degrees
 * @param {Number} lng in degrees
 * @param {Number} distance in kilometers
 * @return {Function}
 */
function getFilter (lat, lng, distance) {
  const distanceLat = 0, // TODO convert from input kilometers.
    distanceLng = 0;
  return {
    table: TABLE,
    condition: function () {
      this.where(function () {
        const max = lat + distanceLat,
          min = lat - distanceLng;
        this.where(`${TABLE}.lat`, '<=', max).andWhere(`${TABLE}.lat`, '>=', min);
      }).andWhere(function () {
        const max = lng + distanceLng,
          min = lng - distanceLng;
        this.where(`${TABLE}.lng_scaled`, '<=', max).andWhere(`${TABLE}.lng_scaled`, '>=', min);
      });
    },
  };
};

function getSorting (lat, lng) {
  // TODO: implement
};

module.exports = {
  createTable,
  dropTable,
  upsert,
  getFilter,
  getSorting,
  TABLE,
};
