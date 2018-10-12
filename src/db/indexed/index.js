/**
 * Create all necessary tables.
 *
 * @return {Promise<void>}
 */
const setupDB = async () => {
  // TODO
};

/**
 * Bring the database to the initial empty state.
 *
 * @return {Promise<void>}
 */
const resetDB = async () => {
  // TODO
  await setupDB();
};

module.exports = {
  setupDB,
  resetDB,
};
