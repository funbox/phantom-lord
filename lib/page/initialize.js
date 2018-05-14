/* eslint-disable no-undef */
const debug = require('../utils/debug');

const initializePage = async function initializePage() {
  await this.page.exposeFunction('setPageInitialized', () => {
    if (!this.isInitialized) {
      this.isInitialized = true;
      debug(`Puppeteer ${this.pid}: page initialized`);
    }
  });

  await this.page.evaluateOnNewDocument((settings, cookies, stubs, lsItems) => {
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

    window.setPageInitialized();
  }, this.testSettings, this.cookiesQueue, this.stubsQueue, this.localStorageItemsQueue);
};

module.exports = initializePage;
