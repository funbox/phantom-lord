/* eslint-disable no-undef */
const debug = require('../utils/debug');

/**
 * @param {!RemoteBrowser=} context
 * @return {Promise<void>}
 */
const initializePage = async function initializePage(context) {
  await context.page.exposeFunction('onNewDocument', async () => {
    await context.page.evaluate((settings, cookies, stubs, lsItems) => {
      window.test = settings;
      if (cookies.length > 0) {
        cookies.forEach((cookie) => {
          document.cookie = [cookie.name, cookie.value].join('=');
        });
      }
      if (stubs.length > 0) {
        window.stubs = [];
        stubs.forEach((stub) => {
          window.stubs.push({ method: stub.method, url: stub.url, data: stub.data });
        });
      }

      if (lsItems.length > 0) {
        lsItems.forEach((item) => {
          localStorage.setItem(item.key, item.value);
        });
      }
    }, context.testSettings, context.cookiesQueue, context.stubsQueue, context.localStorageItemsQueue);

    if (!context.isInitialized) {
      context.isInitialized = true;
      debug(`Puppeteer ${context.pid}: page initialized`, 'info');
    }
  });

  await context.page.evaluateOnNewDocument(() => {
    window.onNewDocument();
  });
};

module.exports = initializePage;
