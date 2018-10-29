const { db } = require('../../../config');

const TABLE = 'subscriptions';

const createTable = async () => {
  await db.schema.createTable(TABLE, (table) => {
    table.string('hotel_address', 63).primary();
    table.text('notifications_uri').notNullable();
    table.string('remote_id', 63);
    table.timestamps(true, true);
  });
};

const dropTable = async () => {
  await db.schema.dropTableIfExists(TABLE);
};

/**
 * Create a new subscription record.
 *
 * @param {Object} subscriptionData
 * @return {Promise<Object>}
 */
const create = (subscriptionData) => {
  return db(TABLE).insert({
    'notifications_uri': subscriptionData.notificationsUri,
    'remote_id': subscriptionData.remoteId,
    'hotel_address': subscriptionData.hotelAddress,
  });
};

/**
 * Retrieve a subscription record by hotel address.
 *
 * @param {String} hotelAddress
 * @return {Promise<Object>}
 */
const get = async (hotelAddress) => {
  let result = (await db
    .from(TABLE)
    .where('hotel_address', hotelAddress)
    .select('hotel_address', 'remote_id', 'notifications_uri'))[0];

  return result && {
    notificationsUri: result.notifications_uri,
    remoteId: result.remote_id,
    hotelAddress: result.hotel_address,
  };
};

module.exports = {
  create,
  get,
  createTable,
  dropTable,
  TABLE,
};
