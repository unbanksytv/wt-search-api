const Permanent = require('./permanent');
const Indexed = require('./indexed');

/**
 * Create all necessary tables.
 *
 * @return {Promise<void>}
 */
const setupDB = async () => {
  await Promise.all([
    Permanent.setupDB(),
    Indexed.setupDB(),
  ]);
};

/**
 * Bring the database to the initial empty state.
 *
 * @return {Promise<void>}
 */
const resetDB = async () => {
  await Promise.all([
    Permanent.resetDB(),
    Indexed.resetDB(),
  ]);
};

module.exports = {
  setupDB,
  resetDB,
};
