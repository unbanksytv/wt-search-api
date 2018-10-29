const Hotel = require('./models/hotel');
const Subscription = require('./models/subscription');

/**
 * Create all necessary tables.
 *
 * @return {Promise<void>}
 */
const setupDB = async () => {
  await Hotel.createTable();
  await Subscription.createTable();
};

/**
 * Bring the database to the initial empty state.
 *
 * @return {Promise<void>}
 */
const resetDB = async () => {
  await Hotel.dropTable();
  await Subscription.dropTable();
  await setupDB();
};

module.exports = {
  setupDB,
  resetDB,
};
