const Location = require('./models/location');

/**
 * Create all necessary tables.
 *
 * @return {Promise<void>}
 */
const setupDB = async () => {
  await Location.createTable();
};

/**
 * Bring the database to the initial empty state.
 *
 * @return {Promise<void>}
 */
const resetDB = async () => {
  await Location.dropTable();
  await setupDB();
};

module.exports = {
  setupDB,
  resetDB,
};
