const byLocation = require('./indices/by-location');
const HotelModel = require('../../db/permanent/models/hotel');
const { db } = require('../../config');

const indexers = [
  byLocation,
//  byTextualData
];

class Indexer {
  loadHotelData (hotelId) {
    return HotelModel.getLatestHotelData(hotelId);
  }

  indexHotel (hotelId) {
    const hotelData = this.loadHotelData(hotelId);
    for (let i = 0; indexers.length; i += 1) {
      const indexer = indexers[i];
      indexer.indexData(hotelData);
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

  async lookupQuery (query) {
    const ids = [];
    for (let i = 0; indexers.length; i += 1) {
      const indexer = indexers[i];
      // split incoming query object
      const queryPart = query;
      const newIds = await indexer.lookupQuery(queryPart);
      ids.concat(newIds);
      // or composeQuery and run it against storage from here
    }
    // later somewhere resolve hotel data for all of these IDs and return them to the query originator
    return ids;
  }
}

module.exports = {
  Indexer,
};
