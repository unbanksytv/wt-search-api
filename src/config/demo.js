const knex = require('knex');

module.exports = {
  db: knex({
    client: 'sqlite3',
    connection: {
      filename: './.demo.sqlite',
    },
    useNullAsDefault: true,
  }),
  crawlerOpts: {
    timeout: 30000,
    limit: 10,
    triggerIndexing: true,
    subscribeForNotifications: true,
  },
};
