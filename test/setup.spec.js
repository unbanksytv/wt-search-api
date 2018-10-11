const { resetDB } = require('../src/db');
const { db } = require('../src/config');

before(async () => {
  await resetDB();
});

after(async () => {
  await db.destroy();
});
