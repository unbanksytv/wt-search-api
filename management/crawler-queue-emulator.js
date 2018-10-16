// This is only a sample script to try out crawler against an actual API
// The script will probably hang due to an open DB connection.
// You can end it with ctrl+C
const { db, logger, crawlerOpts } = require('../src/config');
const Queue = require('../src/services/queue');
const { Fetcher } = require('../src/services/crawler/fetcher');

const eventuallyEnqueueHotelResync = (address) => {
  setTimeout(() => {
    Queue.get().enqueue({
      type: 'syncHotel',
      payload: {
        hotelAddress: address
      }
    });
    eventuallyEnqueueHotelResync(address);
  }, Math.floor(Math.random() * 1000 * 60 * 5) + 1000 * 60);
}

const doStuff = async () => {
  /*Queue.get().enqueue({
    type: 'initialSync',
  });*/
  
  const fetcher = new Fetcher(crawlerOpts);
  const list = await fetcher.fetchHotelList();
  for (let address of list.ids) {
    eventuallyEnqueueHotelResync(address);
  }
  /*
  Queue.get().enqueue({
      type: 'syncHotelPart',
      payload: {
        hotelAddress: '0xc2954b66EB27A20c936A3D8F2365FE9349472663',
        partName: 'ratePlans'
      }
    });
  */
  // Can't call destroy, because queue does not wait
  //await db.destroy();
}

doStuff();
