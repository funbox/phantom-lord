const waitFor = require('./waitFor');
const { matchUrl } = require('../utils');

/**
 * @param {!RemoteBrowser=} context
 * @param {string|RegExp} url
 * @param {Function=} fn
 * @param {Function=} onTimeout
 * @returns {Promise}
 */
module.exports = async function waitForTab(context, url, fn, onTimeout) {
  let tab;
  return waitFor(context, async () => {
    const pages = await context.chromium.pages();

    tab = pages.find(page => matchUrl(page.url(), url));

    if (!tab) {
      throw new Error(`waitForTab('${url}')`);
    }

    if (typeof fn === 'function') {
      const mainPage = context.page;
      context.page = tab;

      try {
        await fn();
      } finally {
        context.page = mainPage;
      }
    }

    await tab.close();
  }, 'waitForTab', onTimeout);
};
