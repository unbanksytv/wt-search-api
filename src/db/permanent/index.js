const Hotel = require('./models/hotel');

/**
 * Create all necessary tables.
 *
 * @return {Promise<void>}
 */
const setupDB = async () => {
  await Hotel.createTable();
};

/**
 * Bring the database to the initial empty state.
 *
 * @return {Promise<void>}
 */
const resetDB = async () => {
  await Hotel.dropTable();
  await setupDB();
};

module.exports = {
  setupDB,
  resetDB,
};
