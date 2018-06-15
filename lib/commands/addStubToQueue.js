const checkCmd = require('../utils/checkCommand');

const RegexpToJson = regexp => `re:${regexp.source}`;

/**
 * @param {!RemoteBrowser=} context
 * @param {{method: string, url: string, data: Object}} stub
 */
module.exports = function addStubToQueue(context, stub) {
  return context.then(async () => {
    if (stub.url instanceof RegExp) {
      stub.url = RegexpToJson(stub.url);
    }

    checkCmd(context, 'addStubToQueue', stub);

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
      throw new Error(`addStubToQueue(${stub.method} ${stub.url})`);
    }
  });
};