const byLocation = require('./indices/by-location');
const { db } = require('../../config');

const INDEXERS = [
  byLocation,
];

/**
 * Implements hotel indexing and subsequent retrieval by
 * filtering and sorting criteria.
 *
 * Right now the indexer is based on plain portable SQL without
 * commitment to a specific backend.
 */
class Indexer {
  /**
  * Index a single hotel.
  *
  * @param {hotel} hotel as returned from Hotel.getLatestHotelData.
  * @return {Promise<void>}
  *
  */
  async indexHotel (hotel) {
    for (let indexer of INDEXERS) {
      await indexer.indexHotel(hotel);
    }
  }

  /**
  * Get a list of hotel addresses based on the index filters,
  * ordered by the sorting specification.
  *
  * Note that if a hotel doesn't specify the attributes necessary
  * for sorting (e.g. location when sorting by distance), it is
  * omitted from the results altogether.
  *
  * @param {Array} filters (optional)
  * @param {Object} sorting (optional)
  * @return {Promise<Array>}
  *
  */
  async _getHotelAddresses (filters, sorting) {
    if (!filters && !sorting) {
      throw new Error('At least one of `filters`, `sorting` must be provided.');
    }
    // 1. Assemble all tables.
    let allTables = new Set();
    if (filters) {
      for (let filter of filters) {
        allTables.add(filter.table);
      }
    }
    if (sorting) {
      allTables.add(sorting.table);
    }

    // 2. Join all tables on hotel_address.
    allTables = Array.from(allTables);
    const firstTable = allTables[0],
      tablesRest = allTables.slice(1);

    let query = db(firstTable);
    for (let table of tablesRest) {
      query = query.innerJoin(table, `${firstTable}.hotel_address`, '=', `${table}.hotel_address`);
    }

    // 3. Apply filtering conditions.
    if (filters) {
      const head = filters[0],
        tail = filters.slice(1);
      query = query.where(head.condition);
      for (let filter of tail) {
        query = query.andWhere(filter.condition);
      }
    }

    // 4. Apply sorting.
    if (sorting) {
      query.select(sorting.select).orderBy(sorting.columnName);
    }

    const data = await query.select(`${firstTable}.hotel_address`);
    return data.map((item) => item.hotel_address);
  }

  /**
  * Get a list of hotel addresses based on the input query.
  *
  * Query is an object like this:
  *
  * {
  *   filters: [
  *     {
  *       type: 'location',
  *       condition: { lat: 10, lng: 10, distance: 20 },
  *     },
  *   ],
  *   sorting: {
  *     type: 'distance',
  *     data: { lat: 10, lng: 10 },
  *   },
  * }
  *
  * (This example filters hotels that are at max 20 kilometers
  * away from the [10, 10] coordinates and sorts the list by
  * distance from the same location.)
  *
  * @param {Object} query
  * @return {Promise<Array>}
  *
  */
  async lookup (query) {
    let filtering = INDEXERS
      .map((indexer) => indexer.getFiltering(query))
      .filter(Boolean)
      .reduce((prev, curr) => prev.concat(curr), []);
    filtering = (filtering.length === 0) ? undefined : filtering;

    const sorting = INDEXERS
      .map((indexer) => indexer.getSorting(query))
      .filter(Boolean)
      .reduce((prev, curr) => prev || curr, undefined);

    return this._getHotelAddresses(filtering, sorting);
  }
}

module.exports = Indexer;
