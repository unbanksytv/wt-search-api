/**
 * Create all necessary tables.
 *
 * @return {Promise<void>}
 */
async function setupDB () {
  // TODO create all models
}

/**
 * Bring the database to the initial empty state.
 *
 * @return {Promise<void>}
 */
async function resetDB () {
  // TODO drop all models
  await setupDB();
}

module.exports = {
  setupDB,
  resetDB,
};
