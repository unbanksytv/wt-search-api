const Hotel = require('./models/hotel');

/**
 * Create all necessary tables.
 *
 * @return {Promise<void>}
 */
async function setupDB () {
  await Hotel.createTable();
}

/**
 * Bring the database to the initial empty state.
 *
 * @return {Promise<void>}
 */
async function resetDB () {
  await Hotel.dropTable();
  await setupDB();
}

module.exports = {
  setupDB,
  resetDB,
};
