const debug = require('../utils/debug');

const RegexpToJson = regexp => `re:${regexp.source}`;

/**
 * @param {!RemoteBrowser=} context
 * @param {{method: string, url: string, data: Object}} stub
 */
module.exports = async function addStubToQueue(context, stub) {
  if (stub.url instanceof RegExp) {
    stub.url = RegexpToJson(stub.url);
  }

  try {
    if (context.isInitialized) {
      await context.page.evaluate((method, url, data) => {
        window.stubs = window.stubs || [];
        window.stubs.push({ method, url, data });
      }, stub.method, stub.url, stub.data);
    } else {
      context.stubsQueue.push(stub);
    }
  } catch (e) {
    debug('processing cmd "addStubToQueue" failed', 'error');
    throw new Error(`addStubToQueue(${stub.method} ${stub.url})`);
  }
};
