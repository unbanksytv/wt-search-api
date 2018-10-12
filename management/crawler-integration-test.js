// This is only a sample script to try out crawler against an actual API
const { db, logger, crawlerOpts } = require('../src/config');
const Queue = require('../src/services/queue');

const doStuff = async () => {
  Queue.get().enqueue({
    type: 'syncHotel',
    payload: {
      hotelId: '0xc2954b66EB27A20c936A3D8F2365FE9349472663'
    }
  });
    Queue.get().enqueue({
    type: 'syncHotel',
    payload: {
      hotelId: '0x037Ee5a21F662720bDD535620442C0A8B3E21FF7'
    }
  });
  // Can't call destroy, because queue does not wait
  //await db.destroy();
}

doStuff();
