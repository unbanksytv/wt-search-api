// This is only a sample script to try out crawler against an actual API
const { Crawler } = require('../src/services/crawler');
const { db, logger } = require('../src/config');

const crawler = new Crawler({
  readApiUrl: 'https://playground-api.windingtree.com',
  timeout: 30000,
  limit: 10,
  logger: logger,
});


const doStuff = async () => {
  await crawler.syncAllHotels();
  await db.destroy();
}

doStuff();
