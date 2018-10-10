// This is only a sample script to try out crawler against an actual API
const { Crawler } = require('../src/services/crawler');
const { db } = require('../src/config');

const crawler = new Crawler({
  readApiUrl: 'https://playground-api.windingtree.com',
  timeout: 2000,
  limit: 3,
});


const doStuff = async () => {
  await crawler.syncAllHotels();
  await db.destroy();
}

doStuff();
