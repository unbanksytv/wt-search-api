const crypto = require('crypto');

const { db } = require('../../../config');

const TABLE = 'subscriptions';

const TOKEN_LENGTH = 7;

const createTable = async () => {
  await db.schema.createTable(TABLE, (table) => {
    table.string('hotel_address', 63).primary();
    table.text('notifications_uri').notNullable();
    table.string('remote_id', 63);
    // A hard-to-guess token to prevent third parties from
    // easily flooding the server with notifications.
    table.string('token', 2 * TOKEN_LENGTH + 1).notNullable();
    table.timestamps(true, true);
  });
};

const dropTable = async () => {
  await db.schema.dropTableIfExists(TABLE);
};

/**
 * Generate a subscription token.
 *
 * @return {Promise<String>}
 */
const generateToken = () => {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(TOKEN_LENGTH, (err, buffer) => {
      if (err) {
        return reject(err);
      }
      resolve(buffer.toString('hex'));
    });
  });
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
    'token': subscriptionData.token,
  });
};

/**
 * Update an existing subscription record.
 *
 * @param {Object} subscriptionData
 * @return {Promise<Object>}
 */
const update = (hotelAddress, subscriptionData) => {
  const update = {
    'notifications_uri': subscriptionData.notificationsUri,
    'remote_id': subscriptionData.remoteId,
    'token': subscriptionData.token,
  };
  for (let key in update) {
    if (update[key] === undefined) {
      delete update[key];
    }
  }
  return db(TABLE).update(update).where('hotel_address', hotelAddress);
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
    .select('hotel_address', 'remote_id', 'notifications_uri', 'token'))[0];

  return result && {
    notificationsUri: result.notifications_uri,
    remoteId: result.remote_id,
    hotelAddress: result.hotel_address,
    token: result.token,
  };
};

module.exports = {
  create,
  get,
  update,
  generateToken,
  createTable,
  dropTable,
  TABLE,
};
