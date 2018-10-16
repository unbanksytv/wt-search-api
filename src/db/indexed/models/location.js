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

function _toRadians (degrees) {
  return degrees * Math.PI / 180;
}

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

/**
 * Approximately compute how many degrees in each direction does the
 * given distance go.
 *
 * @param {Number} lat in degrees
 * @param {Number} lng in degrees
 * @param {Number} distance in kilometers
 * @return {Object}
 *
 */
const LATITUDE_DEGREE_LENGTH = 111; // Approximately, in kilometers.
const LONGITUDE_DEGREE_LENGTH_EQUATOR = 111.321;
function _convertKilometersToDegrees (lat, lng, distance) {
  // We are invariant wrt. hemispheres.
  lat = Math.abs(lat);
  lng = Math.abs(lng);
  // The distance between longitude degrees decreases with the distance from equator.
  const scale = Math.cos(_toRadians(lat)),
    longitudeDegreeLength = scale * LONGITUDE_DEGREE_LENGTH_EQUATOR;

  return {
    lat: distance / LATITUDE_DEGREE_LENGTH,
    lng: distance / longitudeDegreeLength,
  };
}

/**
 * Get a filtering function that can be further used by the knex
 * query builder.
 *
 * Note: for simplicity and portability, the distance is only
 * approximate at the moment:
 *
 * - we assume a locally flat surface
 * - we approximate the circle radius with its square bounding box
 *
 * @param {Number} lat in degrees
 * @param {Number} lng in degrees
 * @param {Number} distance in kilometers
 * @return {Function}
 *
 */
function getFilter (lat, lng, distance) {
  const distances = _convertKilometersToDegrees(lat, lng, distance);
  return {
    table: TABLE,
    condition: function () {
      this.where(function () {
        const max = lat + distances.lat,
          min = lat - distances.lat;
        this.where(`${TABLE}.lat`, '<=', max).andWhere(`${TABLE}.lat`, '>=', min);
      }).andWhere(function () {
        const max = lng + distances.lng,
          min = lng - distances.lng;
        this.where(`${TABLE}.lng`, '<=', max).andWhere(`${TABLE}.lng`, '>=', min);
      });
    },
  };
};

/**
 * Return the expression for ordering by (approximate) distance
 * from the given point.
 *
 * @param {Number} lat in degrees
 * @param {Number} lng in degrees
 * @return {Object}
 *
 */
function getSorting (lat, lng) {
  const scale = Math.cos(_toRadians(Math.abs(lat))),
    scaleSquared = Math.pow(scale, 2);
  return {
    table: TABLE,
    columnName: 'location_distance',
    // Order by the euclidean distance between two points (we
    // approximate by a locally flat surface).
    //
    // The `lng` delta is scaled due to longitude degrees
    // having unequal spacing depending on the distance from
    // the equator.
    select: db.raw(`(${TABLE}.lat - ${lat}) * (${TABLE}.lat - ${lat}) + ` +
      `${scaleSquared} * (${TABLE}.lng - ${lng}) * (${TABLE}.lng - ${lng}) ` +
      'as location_distance'),
  };
};

module.exports = {
  _convertKilometersToDegrees,
  createTable,
  dropTable,
  upsert,
  getFilter,
  getSorting,
  TABLE,
};
