const { db } = require('../../../config');
const Location = require('../../../db/indexed/models/location');

function _toRadians (degrees) {
  return degrees * Math.PI / 180;
}

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
function _getFilter (lat, lng, distance) {
  const distances = _convertKilometersToDegrees(lat, lng, distance);
  return {
    table: Location.TABLE,
    condition: function () {
      this.where(function () {
        const max = lat + distances.lat,
          min = lat - distances.lat;
        this.where(`${Location.TABLE}.lat`, '<=', max).andWhere(`${Location.TABLE}.lat`, '>=', min);
      }).andWhere(function () {
        const max = lng + distances.lng,
          min = lng - distances.lng;
        this.where(`${Location.TABLE}.lng`, '<=', max).andWhere(`${Location.TABLE}.lng`, '>=', min);
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
function _getSorting (lat, lng) {
  const scale = Math.cos(_toRadians(Math.abs(lat))),
    scaleSquared = Math.pow(scale, 2);
  return {
    table: Location.TABLE,
    columnName: 'location_distance',
    // Order by the euclidean distance between two points (we
    // approximate by a locally flat surface).
    //
    // The `lng` delta is scaled due to longitude degrees
    // having unequal spacing depending on the distance from
    // the equator.
    select: db.raw(`(${Location.TABLE}.lat - ${lat}) * (${Location.TABLE}.lat - ${lat}) + ` +
      `${scaleSquared} * (${Location.TABLE}.lng - ${lng}) * (${Location.TABLE}.lng - ${lng}) ` +
      'as location_distance'),
  };
};

const indexData = () => {};

module.exports = {
  _convertKilometersToDegrees,
  _getFilter,
  _getSorting,
  indexData,
};
