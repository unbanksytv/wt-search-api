// This is only a sample script to try out crawler against an actual API
const { Fetcher } = require('../src/services/crawler/fetcher');

const fetcher = new Fetcher({
  readApiUrl: 'https://playground-api.windingtree.com',
  timeout: 2000,
  limit: 10,
});


const doStuff = async () => {
  console.log(await fetcher.fetchHotelIds(1));
}

doStuff();
