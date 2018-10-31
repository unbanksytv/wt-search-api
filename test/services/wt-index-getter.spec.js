const { assert } = require('chai');
const sinon = require('sinon');

const wtIndexGetter = require('../../src/services/wt-index-getter');

const requestMock = sinon.stub().callsFake((opts) => {
  return Promise.resolve({
    docs: 'http://dummy',
    info: 'http://dummy',
    version: '0.0',
    config: 'dummy',
    wtIndexAddress: '0xdummy',
    ethNetwork: 'dummy',
  });
});

describe('wt-index-getter', function () {
  before(() => {
    wtIndexGetter.reset();
  });

  describe('get', () => {
    it('should return wtIndexAddress from read api', async () => {
      const addr = await wtIndexGetter.get(requestMock);
      assert.equal(addr, '0xdummy');
    });

    it('should not contact read api upon subsequent calls', async () => {
      await wtIndexGetter.get(requestMock);
      requestMock.resetHistory();
      const addr = await wtIndexGetter.get(requestMock);
      assert.equal(addr, '0xdummy');
      assert.equal(requestMock.callCount, 0);
    });
  });
});
